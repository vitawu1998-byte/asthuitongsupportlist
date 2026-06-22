import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { GraduationCap, Users, ArrowRight, Upload, FileSpreadsheet } from "lucide-react";
import {
  CLASSES,
  STUDENTS_KEY,
  resolveClassId,
  uid,
  highestTier,
  type Student,
  type ClassInfo,
} from "@/lib/mtss-data";
import { useStudents, upsertStudents } from "@/lib/use-students";

export function ClassesPage() {
  const students = useStudents();
  const [importOpen, setImportOpen] = useState(false);
  const [importLog, setImportLog] = useState<string[]>([]);
  const [importPreview, setImportPreview] = useState<{ added: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const byClass = useMemo(() => {
    const map = new Map<string, Student[]>();
    students.forEach((s) => {
      const arr = map.get(s.classId) ?? [];
      arr.push(s);
      map.set(s.classId, arr);
    });
    return map;
  }, [students]);

  const lower = CLASSES.filter((c) => c.band === "lower");
  const middle = CLASSES.filter((c) => c.band === "middle");

  const handleFile = async (file: File) => {
    const log: string[] = [];
    let added = 0;
    let skipped = 0;
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const existingKey = new Set(students.map((s) => `${s.classId}::${s.name.toLowerCase()}`));
      const toAdd: Student[] = [];

      for (const row of rows) {
        const keys = Object.keys(row);
        const find = (...names: string[]) => {
          for (const n of names) {
            const k = keys.find((kk) => kk.toLowerCase().trim() === n.toLowerCase());
            if (k && String(row[k]).trim()) return String(row[k]).trim();
          }
          return "";
        };
        const name = find("Student Name", "Name", "name", "学生", "姓名");
        const grade = find("Grade", "grade", "年级");
        const klass = find("Class", "class", "Section", "班级");
        if (!name) {
          skipped++;
          continue;
        }
        const classId = resolveClassId(grade, klass);
        if (!classId) {
          skipped++;
          log.push(`Skipped "${name}" — could not match class "${klass}" (grade ${grade}).`);
          continue;
        }
        const key = `${classId}::${name.toLowerCase()}`;
        if (existingKey.has(key)) {
          skipped++;
          continue;
        }
        existingKey.add(key);
        const cls = CLASSES.find((c) => c.id === classId)!;
        toAdd.push({
          id: uid(),
          name,
          grade: cls.grade,
          classId,
          tiers: {},
          concerns: [],
          interventions: [],
          notes: [],
          createdAt: Date.now(),
        });
        added++;
      }
      await upsertStudents(toAdd);
      setImportPreview({ added, skipped });
      setImportLog(log);
    } catch (e) {
      setImportLog([`Failed to parse file: ${(e as Error).message}`]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Huitong School · MTSS Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                荟同学校 — Multi-Tiered Systems of Support tracking
              </p>
            </div>
          </div>
          <Button onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import Students
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-6 py-8">
        <ClassSection title="Lower School" subtitle="Grades 1 – 5" classes={lower} byClass={byClass} />
        <ClassSection title="Middle School" subtitle="Grades 6 – 8" classes={middle} byClass={byClass} />
      </main>

      <Dialog open={importOpen} onOpenChange={(o) => { setImportOpen(o); if (!o) { setImportPreview(null); setImportLog([]); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import student roster</DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx) or CSV file. Required columns:
              <span className="ml-1 font-medium">Student Name</span>,
              <span className="ml-1 font-medium">Grade</span>,
              <span className="ml-1 font-medium">Class</span> (e.g. "1A", "6E").
              Students are auto-assigned to the matching class.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border-2 border-dashed p-6 text-center">
            <FileSpreadsheet className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Choose file
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">.xlsx, .xls, or .csv</p>
          </div>

          {importPreview && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p>
                <span className="font-semibold text-foreground">{importPreview.added}</span> students imported,{" "}
                <span className="font-semibold text-foreground">{importPreview.skipped}</span> skipped.
              </p>
              {importLog.length > 0 && (
                <ul className="mt-2 max-h-32 list-disc overflow-auto pl-5 text-xs text-muted-foreground">
                  {importLog.slice(0, 20).map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setImportOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClassSection({
  title,
  subtitle,
  classes,
  byClass,
}: {
  title: string;
  subtitle: string;
  classes: ClassInfo[];
  byClass: Map<string, Student[]>;
}) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {classes.map((c) => {
          const list = byClass.get(c.id) ?? [];
          const t1 = list.filter((s) => highestTier(s) === "tier1").length;
          const t2 = list.filter((s) => highestTier(s) === "tier2").length;
          const t3 = list.filter((s) => highestTier(s) === "tier3").length;
          return (
            <Link key={c.id} to="/class/$classId" params={{ classId: c.id }}>
              <Card className="group h-full p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold tracking-tight text-primary">{c.name}</div>
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Grade {c.grade}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
                <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {list.length} {list.length === 1 ? "student" : "students"}
                </div>
                <div className="flex gap-1.5">
                  <TierPill label="T1" count={t1} tone="tier1" />
                  <TierPill label="T2" count={t2} tone="tier2" />
                  <TierPill label="T3" count={t3} tone="tier3" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function TierPill({ label, count, tone }: { label: string; count: number; tone: "tier1" | "tier2" | "tier3" }) {
  const cls =
    tone === "tier1"
      ? "bg-tier1/15 text-tier1-foreground border-tier1/30"
      : tone === "tier2"
        ? "bg-tier2/20 text-tier2-foreground border-tier2/40"
        : "bg-tier3/15 text-tier3 border-tier3/30";
  return (
    <Badge variant="outline" className={`flex-1 justify-center gap-1 ${cls}`}>
      <span className="font-semibold">{label}</span>
      <span className="tabular-nums">{count}</span>
    </Badge>
  );
}

// re-export for tooling
export { STUDENTS_KEY };