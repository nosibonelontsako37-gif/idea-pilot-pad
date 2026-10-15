import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { AiBadge } from "@/components/AiBadge";
import { AppShell } from "@/components/AppShell";
import { planSchedule } from "@/lib/ai.functions";
import { localPlanSchedule } from "@/lib/fallbacks";
import { useLocalState } from "@/lib/store";

export interface Task {
  id: string;
  title: string;
  minutes: number;
  priority: "high" | "medium" | "low";
  done: boolean;
}

interface SavedPlan {
  id: string;
  horizon: string;
  body: string;
  source: "ai" | "local";
  savedAt: number;
}

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "Planner — SmartWork AI" },
      { name: "description", content: "Plan your day or week: add tasks and get a realistic schedule." },
      { property: "og:title", content: "Planner — SmartWork AI" },
      { property: "og:description", content: "Plan your day or week: add tasks and get a realistic schedule." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Planner,
});

function Planner() {
  const [tasks, setTasks] = useLocalState<Task[]>("smartwork:tasks", []);
  const [plans, setPlans] = useLocalState<SavedPlan[]>("smartwork:plans", []);
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState(30);
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [horizon, setHorizon] = useState<"day" | "week">("day");
  const [plan, setPlan] = useState("");
  const [planSource, setPlanSource] = useState<"ai" | "local" | null>(null);
  const [busy, setBusy] = useState(false);

  const runPlan = useServerFn(planSchedule);

  const addTask = () => {
    if (!title.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: title.trim(), minutes, priority, done: false },
    ]);
    setTitle("");
  };

  const handlePlan = async () => {
    const open = tasks.filter((t) => !t.done);
    if (!open.length) return;
    setBusy(true);
    try {
      const res = await runPlan({ data: { tasks: open, horizon } });
      if (res.source === "ai") {
        setPlan(res.text);
        setPlanSource("ai");
      } else {
        setPlan(localPlanSchedule(open, horizon));
        setPlanSource("local");
      }
    } finally {
      setBusy(false);
    }
  };

  const savePlan = () => {
    if (!plan.trim()) return;
    setPlans((prev) => [
      { id: crypto.randomUUID(), horizon, body: plan, source: planSource ?? "local", savedAt: Date.now() },
      ...prev,
    ]);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl font-semibold">Planner</h1>
        <p className="mt-1 text-muted-foreground">Add tasks, then build a realistic day or week schedule.</p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="card-surface p-5">
            <h2 className="font-semibold">Tasks</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                className="input-base min-w-0 flex-1"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
              />
              <input
                className="input-base w-20"
                type="number"
                min={5}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(Math.max(5, Number(e.target.value) || 30))}
                aria-label="Minutes"
              />
              <select
                className="input-base w-28"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task["priority"])}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <button className="btn-primary" onClick={addTask} disabled={!title.trim()}>
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {tasks.length === 0 && (
                <li className="text-sm text-muted-foreground">No tasks yet — add your first one above.</li>
              )}
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2"
                >
                  <button
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      t.done ? "border-primary bg-primary text-primary-foreground" : "border-input"
                    }`}
                    onClick={() =>
                      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))
                    }
                    aria-label={t.done ? "Mark as not done" : "Mark as done"}
                  >
                    {t.done && <Check className="h-3 w-3" />}
                  </button>
                  <span className={`min-w-0 flex-1 truncate text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}>
                    {t.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {t.minutes}m · {t.priority}
                  </span>
                  <button
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setTasks((prev) => prev.filter((x) => x.id !== t.id))}
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="card-surface flex flex-col p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Schedule</h2>
              {planSource && <AiBadge source={planSource} />}
            </div>
            <div className="mt-4 flex gap-2">
              <select
                className="input-base w-32"
                value={horizon}
                onChange={(e) => setHorizon(e.target.value as "day" | "week")}
              >
                <option value="day">Today</option>
                <option value="week">This week</option>
              </select>
              <button
                className="btn-primary flex-1"
                onClick={handlePlan}
                disabled={busy || !tasks.some((t) => !t.done)}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Build schedule
              </button>
            </div>
            <div className="mt-4 flex-1 rounded-lg border border-border bg-background p-4">
              {plan ? (
                <pre className="font-sans text-sm whitespace-pre-wrap">{plan}</pre>
              ) : (
                <p className="text-sm text-muted-foreground">Your schedule appears here.</p>
              )}
            </div>
            <button className="btn-secondary mt-3" onClick={savePlan} disabled={!plan.trim()}>
              Save schedule
            </button>
          </section>
        </div>

        {plans.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">Saved schedules</h2>
            <div className="mt-3 space-y-3">
              {plans.map((p) => (
                <details key={p.id} className="card-surface p-4">
                  <summary className="flex cursor-pointer items-center justify-between gap-3">
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {p.horizon === "week" ? "Weekly" : "Daily"} plan — {new Date(p.savedAt).toLocaleDateString()}
                      </span>
                      <AiBadge source={p.source} />
                    </span>
                    <button
                      className="btn-secondary shrink-0 text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        setPlans((prev) => prev.filter((x) => x.id !== p.id));
                      }}
                      aria-label="Delete schedule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </summary>
                  <pre className="mt-4 border-t border-border pt-4 font-sans text-sm whitespace-pre-wrap">{p.body}</pre>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
