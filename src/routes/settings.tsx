import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Trash2, Wrench } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { getAiStatus } from "@/lib/ai.functions";
import { clearSmartWorkData } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SmartWork AI" },
      { name: "description", content: "AI connection status and local data management." },
      { property: "og:title", content: "Settings — SmartWork AI" },
      { property: "og:description", content: "AI connection status and local data management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { data: aiStatus, isLoading } = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => getAiStatus(),
  });
  const [cleared, setCleared] = useState(false);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl font-semibold">Settings</h1>

        <section className="card-surface mt-6 p-5">
          <h2 className="font-semibold">AI connection</h2>
          <div className="mt-3 flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                aiStatus?.available ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
              }`}
            >
              {aiStatus?.available ? <Sparkles className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
            </span>
            <div>
              <p className="text-sm font-medium">
                {isLoading ? "Checking…" : aiStatus?.available ? "Connected" : "Unavailable"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {aiStatus?.available
                  ? "The server has an AI key configured. Drafting, extraction, and scheduling use Lovable AI."
                  : "The server reports no AI key. Features use local rules and are labeled as such — the app never presents local output as AI-generated."}
              </p>
            </div>
          </div>
        </section>

        <section className="card-surface mt-4 p-5">
          <h2 className="font-semibold">Your data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tasks, drafts, notes, and schedules are stored only in this browser's local storage. Nothing is sent to a
            database.
          </p>
          <button
            className="btn-secondary mt-4 text-destructive"
            onClick={() => {
              clearSmartWorkData();
              setCleared(true);
              setTimeout(() => window.location.reload(), 600);
            }}
          >
            <Trash2 className="h-4 w-4" /> Clear all local data
          </button>
          {cleared && <p className="mt-2 text-sm text-muted-foreground">Cleared — reloading…</p>}
        </section>
      </div>
    </AppShell>
  );
}
