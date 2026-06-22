import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  rowToStudent,
  studentToRow,
  type Student,
  type StudentRow,
} from "./mtss-data";

// Module-level cache so every component sees the same list and one realtime
// subscription is shared across the app.
let cache: Student[] = [];
let loaded = false;
const listeners = new Set<(s: Student[]) => void>();
let channelStarted = false;

function emit() {
  for (const l of listeners) l(cache);
}

async function initialLoad() {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("name", { ascending: true });
  if (error) {
    console.error("Load students failed:", error);
    return;
  }
  cache = (data as unknown as StudentRow[]).map(rowToStudent);
  loaded = true;
  emit();
}

function startRealtime() {
  if (channelStarted) return;
  channelStarted = true;
  supabase
    .channel("students-shared")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "students" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string })?.id;
          if (!id) return;
          cache = cache.filter((s) => s.id !== id);
        } else {
          const row = payload.new as unknown as StudentRow;
          const s = rowToStudent(row);
          const idx = cache.findIndex((x) => x.id === s.id);
          if (idx === -1) cache = [...cache, s];
          else {
            const next = cache.slice();
            next[idx] = s;
            cache = next;
          }
        }
        emit();
      },
    )
    .subscribe();
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>(cache);

  useEffect(() => {
    listeners.add(setStudents);
    if (!loaded) initialLoad();
    startRealtime();
    setStudents(cache);
    return () => {
      listeners.delete(setStudents);
    };
  }, []);

  return students;
}

export async function upsertStudent(s: Student) {
  // optimistic update
  const idx = cache.findIndex((x) => x.id === s.id);
  if (idx === -1) cache = [...cache, s];
  else {
    const next = cache.slice();
    next[idx] = s;
    cache = next;
  }
  emit();
  const { error } = await supabase.from("students").upsert(studentToRow(s) as never);
  if (error) console.error("Save student failed:", error);
}

export async function upsertStudents(list: Student[]) {
  if (!list.length) return;
  const byId = new Map(cache.map((s) => [s.id, s]));
  for (const s of list) byId.set(s.id, s);
  cache = Array.from(byId.values());
  emit();
  const { error } = await supabase.from("students").upsert(list.map(studentToRow) as never);
  if (error) console.error("Save students failed:", error);
}

export async function deleteStudent(id: string) {
  cache = cache.filter((s) => s.id !== id);
  emit();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) console.error("Delete student failed:", error);
}