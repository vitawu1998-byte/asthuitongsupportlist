import { createFileRoute } from "@tanstack/react-router";
import { MTSSDashboard } from "@/components/mtss-dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MTSS Student Tracking Dashboard" },
      { name: "description", content: "Track student tiers, interventions, and export MTSS reports." },
      { property: "og:title", content: "MTSS Student Tracking Dashboard" },
      { property: "og:description", content: "Track student tiers, interventions, and export MTSS reports." },
    ],
  }),
  component: Index,
});

function Index() {
  return <MTSSDashboard />;
}
