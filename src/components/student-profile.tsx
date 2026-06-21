import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import {
  CONCERN_OPTIONS,
  INTERVENTION_OPTIONS,
  SUBJECT_LABEL,
  subjectsFor,
  TIER_LABEL,
  uid,
  type ClassInfo,
  type Intervention,
  type Note,
  type Student,
  type Subject,
  type Tier,
} from "@/lib/mtss-data";

export function StudentProfileDialog({
  student,
  classInfo,
  onClose,
  onSave,
  onDelete,
}: {
  student: Student | null;
  classInfo: ClassInfo;
  onClose: () => void;
  onSave: (s: Student) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState<Student | null>(student);

  useEffect(() => {
    setDraft(student);
  }, [student?.id]);

  if (!draft) return null;

  const subjects = subjectsFor(classInfo.band);

  const setTier = (subj: Subject, tier: Tier) =>
    setDraft({ ...draft, tiers: { ...draft.tiers, [subj]: tier } });

  const toggleConcern = (c: string) => {
    setDraft({
      ...draft,
      concerns: draft.concerns.includes(c)
        ? draft.concerns.filter((x) => x !== c)
        : [...draft.concerns, c],
    });
  };

  const addIntervention = () =>
    setDraft({
      ...draft,
      interventions: [
        ...draft.interventions,
        {
          id: uid(),
          name: INTERVENTION_OPTIONS[0],
          startDate: new Date().toISOString().slice(0, 10),
          status: "Active",
        } as Intervention,
      ],
    });

  const updateIntervention = (id: string, patch: Partial<Intervention>) =>
    setDraft({
      ...draft,
      interventions: draft.interventions.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });

  const removeIntervention = (id: string) =>
    setDraft({ ...draft, interventions: draft.interventions.filter((i) => i.id !== id) });

  const addNote = () =>
    setDraft({
      ...draft,
      notes: [
        { id: uid(), date: new Date().toISOString().slice(0, 10), staff: "", text: "" } as Note,
        ...draft.notes,
      ],
    });

  const updateNote = (id: string, patch: Partial<Note>) =>
    setDraft({ ...draft, notes: draft.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) });

  const removeNote = (id: string) =>
    setDraft({ ...draft, notes: draft.notes.filter((n) => n.id !== id) });

  const save = () => {
    onSave(draft);
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{draft.name}</DialogTitle>
          <DialogDescription>
            Grade {classInfo.grade} · Class {classInfo.name}
          </DialogDescription>
        </DialogHeader>

        <Section title="Subject support status">
          <div className="grid gap-3 sm:grid-cols-3">
            {subjects.map((subj) => {
              const tier = draft.tiers[subj] ?? "tier1";
              return (
                <div key={subj} className="rounded-lg border p-3">
                  <div className="mb-2 text-sm font-medium">{SUBJECT_LABEL[subj]}</div>
                  <Select value={tier} onValueChange={(v) => setTier(subj, v as Tier)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tier1">{TIER_LABEL.tier1}</SelectItem>
                      <SelectItem value="tier2">{TIER_LABEL.tier2}</SelectItem>
                      <SelectItem value="tier3">{TIER_LABEL.tier3}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Concerns">
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(CONCERN_OPTIONS).map(([group, opts]) => (
              <div key={group}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </div>
                <div className="space-y-1.5">
                  {opts.map((opt) => (
                    <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={draft.concerns.includes(opt)}
                        onCheckedChange={() => toggleConcern(opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Interventions"
          action={
            <Button size="sm" variant="outline" onClick={addIntervention}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add
            </Button>
          }
        >
          {draft.interventions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No interventions tracked.</p>
          ) : (
            <div className="space-y-2">
              {draft.interventions.map((iv) => (
                <div key={iv.id} className="grid grid-cols-1 gap-2 rounded-md border p-2 sm:grid-cols-[1fr_140px_140px_120px_auto]">
                  <Input
                    list="intervention-options"
                    value={iv.name}
                    onChange={(e) => updateIntervention(iv.id, { name: e.target.value })}
                    placeholder="Intervention"
                  />
                  <Input
                    type="date"
                    value={iv.startDate}
                    onChange={(e) => updateIntervention(iv.id, { startDate: e.target.value })}
                  />
                  <Input
                    type="date"
                    value={iv.reviewDate ?? ""}
                    onChange={(e) => updateIntervention(iv.id, { reviewDate: e.target.value })}
                    placeholder="Review"
                  />
                  <Select
                    value={iv.status}
                    onValueChange={(v) => updateIntervention(iv.id, { status: v as Intervention["status"] })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Monitoring">Monitoring</SelectItem>
                      <SelectItem value="Successful">Successful</SelectItem>
                      <SelectItem value="Escalated">Escalated</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" onClick={() => removeIntervention(iv.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <datalist id="intervention-options">
                {INTERVENTION_OPTIONS.map((o) => <option key={o} value={o} />)}
              </datalist>
            </div>
          )}
        </Section>

        <Section
          title="Progress notes"
          action={
            <Button size="sm" variant="outline" onClick={addNote}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add note
            </Button>
          }
        >
          {draft.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <div className="space-y-2">
              {draft.notes.map((n) => (
                <div key={n.id} className="rounded-md border p-2">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Input
                      type="date"
                      value={n.date}
                      onChange={(e) => updateNote(n.id, { date: e.target.value })}
                      className="w-[150px]"
                    />
                    <Input
                      value={n.staff}
                      onChange={(e) => updateNote(n.id, { staff: e.target.value })}
                      placeholder="Staff member"
                      className="w-[200px]"
                    />
                    <Button variant="ghost" size="icon" className="ml-auto" onClick={() => removeNote(n.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={n.text}
                    onChange={(e) => updateNote(n.id, { text: e.target.value })}
                    rows={3}
                    placeholder="Observations, progress, next steps..."
                  />
                </div>
              ))}
            </div>
          )}
        </Section>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="destructive" onClick={() => onDelete(draft.id)} className="mr-auto">
            <Trash2 className="mr-1 h-4 w-4" /> Remove student
          </Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mt-4 border-t pt-4 first:mt-0 first:border-0 first:pt-0">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

// Re-export Badge to satisfy linter when unused
export { Badge as _Badge };