import { createFileRoute, useParams, Link } from "@tanstack/react-router";
import { MTSSDashboard } from "@/components/mtss-dashboard";
import { Button } from "@/components/ui/button";
import { findClass } from "@/lib/mtss-data";

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
  const cls = findClass(classId);
  if (!cls) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-semibold">Class not found</h1>
        <Button asChild>
          <Link to="/">Back to classes</Link>
        </Button>
      </div>
    );
  }
  return <MTSSDashboard classInfo={cls} />;
}