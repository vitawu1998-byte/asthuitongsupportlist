import { createFileRoute } from "@tanstack/react-router";
import { ClassesPage } from "@/components/classes-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Classes — MTSS Student Tracking" },
      { name: "description", content: "Select a class to track MTSS student tiers and interventions." },
      { property: "og:title", content: "Classes — MTSS Student Tracking" },
      { property: "og:description", content: "Select a class to track MTSS student tiers and interventions." },
    ],
  }),
  component: Index,
});

function Index() {
  return <ClassesPage />;
}
