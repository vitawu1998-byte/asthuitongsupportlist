import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MTSSDashboard } from "@/components/mtss-dashboard";
import { Button } from "@/components/ui/button";

const CLASSES_KEY = "mtss-classes-v1";

export const Route = createFileRoute("/class/$classId")({
  head: () => ({
    meta: [
      { title: "Class — MTSS Tracking" },
      { name: "description", content: "Track student MTSS tiers and interventions for this class." },
    ],
  }),
  component: ClassPage,
});

function ClassPage() {
  const { classId } = useParams({ from: "/class/$classId" });
  const [name, setName] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLASSES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      const found = list.find((c: { id: string; name: string }) => c.id === classId);
      if (found) setName(found.name);
      else setMissing(true);
    } catch {
      setMissing(true);
    }
  }, [classId]);

  if (missing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">Class not found</h1>
        <p className="text-sm text-muted-foreground">
          This class doesn't exist on this device. Class data is stored locally.
        </p>
        <Button asChild>
          <Link to="/">Back to classes</Link>
        </Button>
      </div>
    );
  }

  if (!name) return null;

  return <MTSSDashboard classId={classId} className={name} />;
}