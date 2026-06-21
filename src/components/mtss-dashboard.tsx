import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, FileDown, GripVertical, StickyNote } from "lucide-react";

type Tier = "tier1" | "tier2" | "tier3" | "unassigned";

type Student = {
  id: string;
  name: string;
  tier: Tier;
  notes: string;
};

const STORAGE_KEY = "mtss-students-v1";

const TIERS: { id: Tier; label: string; sub: string; tone: string }[] = [
  {
    id: "tier3",
    label: "Tier 3",
    sub: "Intensive · Individualized",
    tone: "bg-tier3 text-tier3-foreground border-tier3",
  },
  {
    id: "tier2",
    label: "Tier 2",
    sub: "Targeted · Small group",
    tone: "bg-tier2 text-tier2-foreground border-tier2",
  },
  {
    id: "tier1",
    label: "Tier 1",
    sub: "Universal · Core instruction",
    tone: "bg-tier1 text-tier1-foreground border-tier1",
  },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function MTSSDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overTier, setOverTier] = useState<Tier | null>(null);
  const [noteStudent, setNoteStudent] = useState<Student | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStudents(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  const addStudent = () => {
    const n = name.trim();
    if (!n) return;
    setStudents((s) => [...s, { id: uid(), name: n, tier: "unassigned", notes: "" }]);
    setName("");
  };

  const removeStudent = (id: string) =>
    setStudents((s) => s.filter((x) => x.id !== id));

  const moveToTier = (id: string, tier: Tier) =>
    setStudents((s) => s.map((x) => (x.id === id ? { ...x, tier } : x)));

  const openNotes = (s: Student) => {
    setNoteStudent(s);
    setNoteDraft(s.notes);
  };

  const saveNotes = () => {
    if (!noteStudent) return;
    setStudents((s) =>
      s.map((x) => (x.id === noteStudent.id ? { ...x, notes: noteDraft } : x))
    );
    setNoteStudent(null);
  };

  const counts = useMemo(() => {
    const total = students.length || 1;
    const by = (t: Tier) => students.filter((s) => s.tier === t).length;
    return {
      total: students.length,
      tier1: by("tier1"),
      tier2: by("tier2"),
      tier3: by("tier3"),
      unassigned: by("unassigned"),
      pct: (t: Tier) => Math.round((by(t) / total) * 100),
    };
  }, [students]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();
    doc.setFontSize(18);
    doc.text("MTSS Student Tracking Report", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Generated ${now}`, 14, 25);
    doc.setTextColor(0);

    doc.setFontSize(12);
    doc.text(`Total students: ${counts.total}`, 14, 36);
    doc.text(
      `Tier 1: ${counts.tier1} (${counts.pct("tier1")}%)   Tier 2: ${counts.tier2} (${counts.pct("tier2")}%)   Tier 3: ${counts.tier3} (${counts.pct("tier3")}%)`,
      14,
      44
    );

    let y = 56;
    (["tier3", "tier2", "tier1", "unassigned"] as Tier[]).forEach((t) => {
      const label =
        t === "unassigned" ? "Unassigned" : t === "tier1" ? "Tier 1" : t === "tier2" ? "Tier 2" : "Tier 3";
      const list = students.filter((s) => s.tier === t);
      if (!list.length) return;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.text(label, 14, y);
      y += 7;
      doc.setFontSize(11);
      list.forEach((s) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        doc.text(`• ${s.name}`, 18, y);
        y += 6;
        if (s.notes.trim()) {
          const lines = doc.splitTextToSize(`Notes: ${s.notes}`, 175);
          doc.setFontSize(9);
          doc.setTextColor(90);
          lines.forEach((ln: string) => {
            if (y > 280) {
              doc.addPage();
              y = 20;
            }
            doc.text(ln, 22, y);
            y += 5;
          });
          doc.setFontSize(11);
          doc.setTextColor(0);
        }
        y += 2;
      });
      y += 4;
    });

    doc.save(`mtss-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const unassigned = students.filter((s) => s.tier === "unassigned");

  // Pyramid widths (Tier 3 narrow at top, Tier 1 wide at base)
  const pyramidWidths: Record<Tier, string> = {
    tier3: "w-[45%]",
    tier2: "w-[72%]",
    tier1: "w-[100%]",
    unassigned: "",
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">MTSS Student Tracking</h1>
            <p className="text-sm text-muted-foreground">
              Multi-Tiered System of Supports · drag students into tiers
            </p>
          </div>
          <Button onClick={exportPDF} disabled={students.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[320px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Add student</h2>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addStudent()}
                placeholder="Student name"
              />
              <Button size="icon" onClick={addStudent} aria-label="Add">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">
              Unassigned <span className="text-muted-foreground">({unassigned.length})</span>
            </h2>
            <div
              className={`min-h-[120px] rounded-md border-2 border-dashed p-2 transition-colors ${
                overTier === "unassigned" ? "border-primary bg-accent" : "border-border"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setOverTier("unassigned");
              }}
              onDragLeave={() => setOverTier(null)}
              onDrop={() => {
                if (dragId) moveToTier(dragId, "unassigned");
                setDragId(null);
                setOverTier(null);
              }}
            >
              {unassigned.length === 0 && (
                <p className="px-1 py-2 text-xs text-muted-foreground">
                  Add a student above to begin.
                </p>
              )}
              <div className="space-y-2">
                {unassigned.map((s) => (
                  <StudentChip
                    key={s.id}
                    s={s}
                    onDragStart={() => setDragId(s.id)}
                    onNotes={() => openNotes(s)}
                    onRemove={() => removeStudent(s.id)}
                  />
                ))}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-sm font-semibold">Distribution</h2>
            <Stat label="Total" value={counts.total} />
            <Stat label="Tier 1" value={`${counts.tier1} · ${counts.pct("tier1")}%`} dot="bg-tier1" />
            <Stat label="Tier 2" value={`${counts.tier2} · ${counts.pct("tier2")}%`} dot="bg-tier2" />
            <Stat label="Tier 3" value={`${counts.tier3} · ${counts.pct("tier3")}%`} dot="bg-tier3" />
          </Card>
        </aside>

        {/* Pyramid */}
        <section className="space-y-3">
          {TIERS.map((t) => {
            const list = students.filter((s) => s.tier === t.id);
            const pct = counts.pct(t.id);
            return (
              <div key={t.id} className="flex justify-center">
                <div
                  className={`${pyramidWidths[t.id]} rounded-xl border-2 p-4 transition-all ${t.tone} ${
                    overTier === t.id ? "ring-4 ring-offset-2 ring-primary/40 scale-[1.01]" : ""
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverTier(t.id);
                  }}
                  onDragLeave={() => setOverTier(null)}
                  onDrop={() => {
                    if (dragId) moveToTier(dragId, t.id);
                    setDragId(null);
                    setOverTier(null);
                  }}
                >
                  <div className="mb-3 flex items-baseline justify-between gap-4">
                    <div>
                      <div className="text-lg font-bold leading-tight">{t.label}</div>
                      <div className="text-xs opacity-80">{t.sub}</div>
                    </div>
                    <div className="text-right text-sm font-semibold">
                      {list.length} {list.length === 1 ? "student" : "students"} · {pct}%
                    </div>
                  </div>
                  <div className="min-h-[64px] rounded-md bg-background/50 p-2">
                    {list.length === 0 ? (
                      <p className="px-1 py-3 text-center text-xs opacity-70">
                        Drag students here
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {list.map((s) => (
                          <StudentChip
                            key={s.id}
                            s={s}
                            compact
                            onDragStart={() => setDragId(s.id)}
                            onNotes={() => openNotes(s)}
                            onRemove={() => removeStudent(s.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      <Dialog open={!!noteStudent} onOpenChange={(o) => !o && setNoteStudent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Intervention notes — {noteStudent?.name}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={8}
            placeholder="Document interventions, progress monitoring, goals..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteStudent(null)}>
              Cancel
            </Button>
            <Button onClick={saveNotes}>Save notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, dot }: { label: string; value: React.ReactNode; dot?: string }) {
  return (
    <div className="flex items-center justify-between border-b py-2 text-sm last:border-0">
      <span className="flex items-center gap-2 text-muted-foreground">
        {dot && <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />}
        {label}
      </span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}

function StudentChip({
  s,
  compact,
  onDragStart,
  onNotes,
  onRemove,
}: {
  s: Student;
  compact?: boolean;
  onDragStart: () => void;
  onNotes: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={`group flex cursor-grab items-center gap-1.5 rounded-md border bg-card text-card-foreground shadow-sm active:cursor-grabbing ${
        compact ? "px-2 py-1 text-sm" : "px-2 py-1.5"
      }`}
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="flex-1 truncate font-medium">{s.name}</span>
      {s.notes.trim() && (
        <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Has notes" />
      )}
      <button
        onClick={onNotes}
        className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground group-hover:opacity-100"
        aria-label="Edit notes"
      >
        <StickyNote className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onRemove}
        className="rounded p-1 text-muted-foreground opacity-0 transition hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100"
        aria-label="Remove"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}