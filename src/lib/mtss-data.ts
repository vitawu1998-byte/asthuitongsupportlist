export type Tier = "tier1" | "tier2" | "tier3";
export type Subject = "english" | "math" | "science";

export type Student = {
  id: string;
  name: string;
  grade: number; // 1..8
  classId: string;
  advisor?: string;
  tiers: Partial<Record<Subject, Tier>>;
  concerns: string[];
  interventions: Intervention[];
  notes: Note[];
  watch?: boolean;
  createdAt: number;
};

export type Attachment = {
  id: string;
  name: string;
  path: string;
};

export type NoteSubject = Subject | "other";

export type Intervention = {
  id: string;
  name: string;
  subject?: NoteSubject;
  otherSubject?: string;
  startDate: string;
  supports: string[];
  attachments: Attachment[];
  status: "Active" | "Monitoring" | "Successful" | "Escalated";
};

export type Note = {
  id: string;
  date: string;
  subject?: NoteSubject;
  otherSubject?: string;
  staff: string;
  text: string;
  attachments: Attachment[];
};

export type ClassInfo = {
  id: string;
  name: string;
  grade: number;
  band: "lower" | "middle";
};

export const CLASSES: ClassInfo[] = [
  // Lower School: grades 1-5 (grade 5 also has section E)
  ...[1, 2, 3, 4, 5].flatMap((g) =>
    (g === 5 ? ["A", "C", "E"] : ["A", "C"]).map((s) => ({
      id: `g${g}-${s}`,
      name: `${g}${s}`,
      grade: g,
      band: "lower" as const,
    })),
  ),
  // Middle School: grades 6-8, sections A, C, E
  ...[6, 7, 8].flatMap((g) =>
    ["A", "C", "E"].map((s) => ({
      id: `g${g}-${s}`,
      name: `${g}${s}`,
      grade: g,
      band: "middle" as const,
    })),
  ),
];

export const STUDENTS_KEY = "huitong-mtss-students-v1";

export function subjectsFor(band: "lower" | "middle"): Subject[] {
  return band === "lower" ? ["english", "math", "science"] : ["english", "science"];
}

export const SUBJECT_LABEL: Record<Subject, string> = {
  english: "English",
  math: "Mathematics",
  science: "Science",
};

export const TIER_LABEL: Record<Tier, string> = {
  tier1: "Tier 1",
  tier2: "Tier 2",
  tier3: "Tier 3",
};

export const CONCERN_OPTIONS = {
  Academic: ["Reading", "Writing", "Numeracy", "Science Understanding"],
  Behavior: ["Attention", "Engagement", "Organization", "Self-regulation"],
  Other: ["Attendance", "Homework Completion"],
};

export const INTERVENTION_OPTIONS = [
  "Small Group Support 小组支持",
  "One-to-One Support 1对1支持",
  "Push-in Support 随堂支持",
  "Pull-out Support 抽离支持",
  "Check-in Check-out 每日签到",
  "Parent Meeting 家长会议",
  "Reflection Sheet 反思表",
  "Goal Setting 目标设定",
  "Academic Coaching 学业辅导",
];

// Checkbox list: what support was actually delivered
export const SUPPORT_ACTIONS = [
  "In-class content explanation 课堂内容讲解",
  "Listening / attention reminders 听课提醒",
  "Small group pull-out 小组 pull out",
  "Individual pull-out 单独 pull out",
  "Behavior intervention 行为干预",
  "Homework / assignment support 作业辅导",
  "Differentiated tasks 分层任务",
  "Pre-teaching vocabulary 预教词汇",
  "Seating / environment adjustment 座位调整",
  "Assessment accommodation 考试调整",
  "Emotional / social support 情绪支持",
  "Parent communication 家长沟通",
];

export const NOTE_SUBJECT_LABEL: Record<NoteSubject, string> = {
  english: "English 英语",
  math: "Mathematics 数学",
  science: "Science 科学",
  other: "Other 其他",
};

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Row <-> Student mapping for the shared Supabase `students` table.
export type StudentRow = {
  id: string;
  name: string;
  grade: number;
  class_id: string;
  advisor?: string;
  tiers: Partial<Record<Subject, Tier>>;
  concerns: string[];
  interventions: Intervention[];
  notes: Note[];
  watch: boolean;
  created_at_ms: number;
};

export function rowToStudent(r: StudentRow): Student {
  return {
    id: r.id,
    name: r.name,
    grade: r.grade,
    classId: r.class_id,
    advisor: r.advisor ?? "",
    tiers: r.tiers ?? {},
    concerns: r.concerns ?? [],
    interventions: r.interventions ?? [],
    notes: r.notes ?? [],
    watch: !!r.watch,
    createdAt: r.created_at_ms,
  };
}

export function studentToRow(s: Student): StudentRow {
  return {
    id: s.id,
    name: s.name,
    grade: s.grade,
    class_id: s.classId,
    advisor: s.advisor ?? "",
    tiers: s.tiers ?? {},
    concerns: s.concerns ?? [],
    interventions: s.interventions ?? [],
    notes: s.notes ?? [],
    watch: !!s.watch,
    created_at_ms: s.createdAt,
  };
}

export function findClass(id: string): ClassInfo | undefined {
  return CLASSES.find((c) => c.id === id);
}

// Match a class name like "1A", "6E", "Grade 3 - C" to a classId
export function resolveClassId(grade: number | string | undefined, klass: string | undefined): string | undefined {
  if (!klass && !grade) return undefined;
  const gStr = String(grade ?? "").match(/\d+/)?.[0];
  const kStr = (klass ?? "").toString().trim().toUpperCase();
  // Try direct "1A" form
  const direct = kStr.match(/^(\d+)\s*([ACE])$/);
  if (direct) return `g${direct[1]}-${direct[2]}`;
  // Section letter only
  const sec = kStr.match(/([ACE])\b/)?.[1];
  if (gStr && sec) return `g${gStr}-${sec}`;
  return undefined;
}

export function highestTier(s: Student): Tier {
  const order: Tier[] = ["tier3", "tier2", "tier1"];
  for (const t of order) {
    if (Object.values(s.tiers).some((v) => v === t)) return t;
  }
  return "tier1";
}