import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Subject } from "./mtss-data";

export type ClassStaff = {
  classId: string;
  subjectTeachers: Partial<Record<Subject, string>>;
  astTeachers: Partial<Record<Subject, string>>;
};

type Row = {
  class_id: string;
  subject_teachers: Partial<Record<Subject, string>> | null;
  ast_teachers: Partial<Record<Subject, string>> | null;
};

const empty = (classId: string): ClassStaff => ({
  classId,
  subjectTeachers: {},
  astTeachers: {},
});

const fromRow = (classId: string, r: Row): ClassStaff => ({
  classId,
  subjectTeachers: r.subject_teachers ?? {},
  astTeachers: r.ast_teachers ?? {},
});

export function useClassStaff(classId: string) {
  const [staff, setStaff] = useState<ClassStaff>(() => empty(classId));

  useEffect(() => {
    let active = true;
    setStaff(empty(classId));
    (async () => {
      const { data, error } = await supabase
        .from("class_staff" as never)
        .select("*")
        .eq("class_id", classId)
        .maybeSingle();
      if (!active || error || !data) return;
      setStaff(fromRow(classId, data as unknown as Row));
    })();

    const channel = supabase
      .channel(`class-staff-${classId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "class_staff", filter: `class_id=eq.${classId}` },
        (payload) => {
          const r = payload.new as unknown as Row | null;
          if (!r?.class_id) return;
          setStaff(fromRow(classId, r));
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [classId]);

  return [staff, setStaff] as const;
}

export async function saveClassStaff(s: ClassStaff) {
  const { error } = await supabase.from("class_staff" as never).upsert(
    {
      class_id: s.classId,
      subject_teachers: s.subjectTeachers,
      ast_teachers: s.astTeachers,
    } as never,
  );
  if (error) console.error("Save class staff failed:", error);
}
