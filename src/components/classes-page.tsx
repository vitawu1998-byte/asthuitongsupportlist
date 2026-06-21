import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, GraduationCap, Users, ArrowRight } from "lucide-react";

type ClassInfo = { id: string; name: string; createdAt: number };

const CLASSES_KEY = "mtss-classes-v1";
const STORAGE_PREFIX = "mtss-students-v1::";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function countStudents(classId: string): number {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + classId);
    if (!raw) return 0;
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

export function ClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [name, setName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<ClassInfo | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLASSES_KEY);
      if (raw) setClasses(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(CLASSES_KEY, JSON.stringify(classes));
    force((x) => x + 1);
  }, [classes]);

  const addClass = () => {
    const n = name.trim();
    if (!n) return;
    setClasses((c) => [...c, { id: uid(), name: n, createdAt: Date.now() }]);
    setName("");
  };

  const deleteClass = () => {
    if (!confirmDelete) return;
    try {
      localStorage.removeItem(STORAGE_PREFIX + confirmDelete.id);
    } catch {}
    setClasses((c) => c.filter((x) => x.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">School MTSS Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Select a class to track students across MTSS tiers.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold">Add a class</h2>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addClass()}
              placeholder="e.g. Grade 4 — Ms. Lee"
            />
            <Button onClick={addClass}>
              <Plus className="mr-1 h-4 w-4" /> Add class
            </Button>
          </div>
        </Card>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
            Classes ({classes.length})
          </h2>
          {classes.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground">
              No classes yet. Add your first class above to get started.
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c) => {
                const count = countStudents(c.id);
                return (
                  <Card key={c.id} className="group relative overflow-hidden p-4 transition hover:shadow-md">
                    <Link
                      to="/class/$classId"
                      params={{ classId: c.id }}
                      className="block"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight">{c.name}</h3>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {count} {count === 1 ? "student" : "students"}
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setConfirmDelete(c);
                      }}
                      className="absolute right-2 top-2 rounded p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
                      aria-label="Delete class"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete class?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete <span className="font-medium text-foreground">{confirmDelete?.name}</span> and all its student data. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteClass}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}