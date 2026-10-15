import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarRange, ClipboardList, Mail, Sparkles, Wrench } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { getAiStatus } from "@/lib/ai.functions";
import { useLocalState } from "@/lib/store";
import type { Draft } from "./email";
import type { Note } from "./notes";
import type { Task } from "./planner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SmartWork AI" },
      { name: "description", content: "Your AI-assisted workday: emails, meeting notes, and planning in one place." },
      { property: "og:title", content: "SmartWork AI" },
      { property: "og:description", content: "Your AI-assisted workday: emails, meeting notes, and planning in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [drafts] = useLocalState<Draft[]>("smartwork:drafts", []);
  const [notes] = useLocalState<Note[]>("smartwork:notes", []);
  const [tasks] = useLocalState<Task[]>("smartwork:tasks", []);
  const { data: aiStatus } = useQuery({
    queryKey: ["ai-status"],
    queryFn: () => getAiStatus(),
  });

  const openTasks = tasks.filter((t) => !t.done).length;

  const stats = [
    { label: "Open tasks", value: openTasks, icon: CalendarRange, to: "/planner" },
    { label: "Saved drafts", value: drafts.length, icon: Mail, to: "/email" },
    { label: "Meeting notes", value: notes.length, icon: ClipboardList, to: "/notes" },
  ] as const;

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-3xl font-semibold">Good to see you</h1>
        <p className="mt-1 text-muted-foreground">
          Here's your workday at a glance.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {stats.map(({ label, value, icon: Icon, to }) => (
            <Link key={label} to={to} className="card-surface group p-5 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-primary" />
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </Link>
          ))}
        </div>

        <div className="card-surface mt-6 flex items-start gap-4 p-5">
          <span
            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              aiStatus?.available ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
            }`}
          >
            {aiStatus?.available ? <Sparkles className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
          </span>
          <div>
            <h2 className="font-semibold">
              {aiStatus?.available ? "AI is connected" : "AI is not available"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {aiStatus?.available
                ? "Email drafting, note extraction, and scheduling are powered by Lovable AI."
                : "The server reports AI as unavailable. Features fall back to clearly labeled local rules — nothing is passed off as AI output."}
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
