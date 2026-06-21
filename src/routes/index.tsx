import { createFileRoute } from "@tanstack/react-router";
import { ClassesPage } from "@/components/classes-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Huitong School — MTSS Dashboard" },
      { name: "description", content: "Multi-Tiered Systems of Support tracking across all Huitong School advisory classes." },
      { property: "og:title", content: "Huitong School — MTSS Dashboard" },
      { property: "og:description", content: "Multi-Tiered Systems of Support tracking across all Huitong School advisory classes." },
    ],
  }),
  component: Index,
});

function Index() {
  return <ClassesPage />;
}
