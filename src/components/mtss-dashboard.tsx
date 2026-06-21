import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileDown, GripVertical, Search } from "lucide-react";
import { StudentProfileDialog } from "@/components/student-profile";
import {
  loadStudents,
  saveStudents,
  subjectsFor,
  SUBJECT_LABEL,
  highestTier,
  type ClassInfo,
  type Student,
  type Subject,
  type Tier,
} from "@/lib/mtss-data";

const TIERS: { id: Tier; label: string; sub: string; width: string; tone: string }[] = [
  { id: "tier3", label: "Tier 3", sub: "Intensive · Individualized", width: "w-[45%]", tone: "bg-tier3 text-tier3-foreground border-tier3" },
  { id: "tier2", label: "Tier 2", sub: "Targeted · Small group", width: "w-[72%]", tone: "bg-tier2 text-tier2-foreground border-tier2" },
  { id: "tier1", label: "Tier 1", sub: "Universal · Core instruction", width: "w-[100%]", tone: "bg-tier1 text-tier1-foreground border-tier1" },
];

export function MTSSDashboard({ classInfo }: { classInfo: ClassInfo }) {
  const subjects = subjectsFor(classInfo.band);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [activeSubject, setActiveSubject] = useState<Subject>(subjects[0]);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | Tier>("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overTier, setOverTier] = useState<Tier | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    setAllStudents(loadStudents());
  }, []);

  const updateStudents = (next: Student[]) => {
    setAllStudents(next);
    saveStudents(next);
  };

  const classStudents = useMemo(
    () => allStudents.filter((s) => s.classId === classInfo.id),
    [allStudents, classInfo.id],
  );

  const moveToTier = (id: string, tier: Tier) => {
    updateStudents(
      allStudents.map((s) =>
        s.id === id ? { ...s, tiers: { ...s.tiers, [activeSubject]: tier } } : s,
      ),
    );
  };

  const tierOf = (s: Student): Tier => s.tiers[activeSubject] ?? "tier1";

  const filtered = useMemo(() => {
    return classStudents.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (tierFilter !== "all" && tierOf(s) !== tierFilter) return false;
      return true;
    });
  }, [classStudents, search, tierFilter, activeSubject]);

  const sortedList = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  const profileStudent = allStudents.find((s) => s.id === profileId) ?? null;

  const exportPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();
    doc.setFontSize(18);
    doc.text(`MTSS Report — Class ${classInfo.name}`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(`Huitong School · Generated ${now}`, 14, 25);
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Total students: ${classStudents.length}`, 14, 35);

    let y = 46;
    subjects.forEach((subj) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.text(SUBJECT_LABEL[subj], 14, y);
      y += 7;
      (["tier3", "tier2", "tier1"] as Tier[]).forEach((t) => {
        const list = classStudents.filter((s) => (s.tiers[subj] ?? "tier1") === t);
        if (!list.length) return;
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setTextColor(80);
        const label = t === "tier1" ? "Tier 1" : t === "tier2" ? "Tier 2" : "Tier 3";
        doc.text(`${label} (${list.length})`, 18, y);
        doc.setTextColor(0);
        y += 5;
        doc.setFontSize(10);
        list.forEach((s) => {
          if (y > 280) { doc.addPage(); y = 20; }
          doc.text(`• ${s.name}`, 22, y);
          y += 5;
        });
        y += 3;
      });
      y += 4;
    });

    doc.save(`mtss-${classInfo.name}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const counts = useMemo(() => {
    const total = classStudents.length || 1;
    const by = (t: Tier) => classStudents.filter((s) => tierOf(s) === t).length;
    return {
      total: classStudents.length,
      tier1: by("tier1"),
      tier2: by("tier2"),
      tier3: by("tier3"),
      pct: (t: Tier) => Math.round((by(t) / total) * 100),
    };
  }, [classStudents, activeSubject]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
          <div className="min-w-0">
            <Link to="/" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> All classes
            </Link>
            <div className="flex items-baseline gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                Class <span className="text-primary">{classInfo.name}</span>
              </h1>
              <span className="text-sm text-muted-foreground">Grade {classInfo.grade} · {classInfo.band === "lower" ? "Lower School" : "Middle School"}</span>
            </div>
            <p className="text-sm text-muted-foreground">MTSS support tracking by subject — drag students between tiers.</p>
          </div>
          <Button onClick={exportPDF} disabled={classStudents.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Tabs value={activeSubject} onValueChange={(v) => setActiveSubject(v as Subject)}>
          <TabsList className="mb-4">
            {subjects.map((s) => (
              <TabsTrigger key={s} value={s}>
                {SUBJECT_LABEL[s]} MTSS
              </TabsTrigger>
            ))}
          </TabsList>

          {subjects.map((subj) => (
            <TabsContent key={subj} value={subj} className="mt-0">
              <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
                {/* Student list */}
                <aside className="space-y-4">
                  <Card className="p-4">
                    <h2 className="mb-3 text-sm font-semibold">Students ({classStudents.length})</h2>
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search student"
                          className="pl-8"
                        />
                      </div>
                      <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as typeof tierFilter)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All tiers</SelectItem>
                          <SelectItem value="tier1">Tier 1 only</SelectItem>
                          <SelectItem value="tier2">Tier 2 only</SelectItem>
                          <SelectItem value="tier3">Tier 3 only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="mt-3 max-h-[420px] space-y-1.5 overflow-auto pr-1">
                      {classStudents.length === 0 && (
                        <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                          No students yet. Use Bulk Import on the home page.
                        </p>
                      )}
                      {sortedList.map((s) => (
                        <StudentRow
                          key={s.id}
                          student={s}
                          tier={tierOf(s)}
                          onDragStart={() => setDragId(s.id)}
                          onClick={() => setProfileId(s.id)}
                        />
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h2 className="mb-3 text-sm font-semibold">{SUBJECT_LABEL[subj]} distribution</h2>
                    <Stat label="Tier 1" value={`${counts.tier1} · ${counts.pct("tier1")}%`} dot="bg-tier1" />
                    <Stat label="Tier 2" value={`${counts.tier2} · ${counts.pct("tier2")}%`} dot="bg-tier2" />
                    <Stat label="Tier 3" value={`${counts.tier3} · ${counts.pct("tier3")}%`} dot="bg-tier3" />
                  </Card>
                </aside>

                {/* Pyramid */}
                <section className="space-y-3">
                  {TIERS.map((t) => {
                    const list = classStudents.filter((s) => tierOf(s) === t.id);
                    const pct = counts.pct(t.id);
                    return (
                      <div key={t.id} className="flex justify-center">
                        <div
                          className={`${t.width} rounded-xl border-2 p-4 transition-all ${t.tone} ${
                            overTier === t.id ? "ring-4 ring-offset-2 ring-primary/40 scale-[1.005]" : ""
                          }`}
                          onDragOver={(e) => { e.preventDefault(); setOverTier(t.id); }}
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
                          <div className="min-h-[64px] rounded-md bg-background/60 p-2">
                            {list.length === 0 ? (
                              <p className="px-1 py-3 text-center text-xs opacity-70">Drag students here</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {list.map((s) => (
                                  <button
                                    key={s.id}
                                    draggable
                                    onDragStart={() => setDragId(s.id)}
                                    onClick={() => setProfileId(s.id)}
                                    className="group flex cursor-grab items-center gap-1.5 rounded-md border bg-card px-2 py-1 text-sm text-card-foreground shadow-sm active:cursor-grabbing"
                                  >
                                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-medium">{s.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </section>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      <StudentProfileDialog
        student={profileStudent}
        classInfo={classInfo}
        onClose={() => setProfileId(null)}
        onSave={(updated) => {
          updateStudents(allStudents.map((s) => (s.id === updated.id ? updated : s)));
        }}
        onDelete={(id) => {
          updateStudents(allStudents.filter((s) => s.id !== id));
          setProfileId(null);
        }}
      />
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

function StudentRow({
  student,
  tier,
  onDragStart,
  onClick,
}: {
  student: Student;
  tier: Tier;
  onDragStart: () => void;
  onClick: () => void;
}) {
  const tierTone =
    tier === "tier1" ? "bg-tier1/15 text-tier1-foreground" :
    tier === "tier2" ? "bg-tier2/25 text-tier2-foreground" :
    "bg-tier3/15 text-tier3";
  const overall = highestTier(student);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="group flex cursor-grab items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-sm hover:bg-accent/30 active:cursor-grabbing"
    >
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="flex-1 truncate font-medium">{student.name}</span>
      <Badge variant="secondary" className={`text-[10px] ${tierTone}`}>
        {tier === "tier1" ? "T1" : tier === "tier2" ? "T2" : "T3"}
      </Badge>
      {overall !== "tier1" && overall !== tier && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-destructive"
          title={`Also in ${overall === "tier3" ? "Tier 3" : "Tier 2"} for another subject`}
        />
      )}
    </div>
  );
}