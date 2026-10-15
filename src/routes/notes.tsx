import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { AiBadge } from "@/components/AiBadge";
import { AppShell } from "@/components/AppShell";
import { extractMeetingNotes } from "@/lib/ai.functions";
import { localExtractMeetingNotes } from "@/lib/fallbacks";
import { useLocalState } from "@/lib/store";

export interface Note {
  id: string;
  title: string;
  body: string;
  source: "ai" | "local";
  savedAt: number;
}

export const Route = createFileRoute("/notes")({
  head: () => ({
    meta: [
      { title: "Meeting Notes — SmartWork AI" },
      { name: "description", content: "Turn raw meeting notes into summaries, decisions, and action items." },
      { property: "og:title", content: "Meeting Notes — SmartWork AI" },
      { property: "og:description", content: "Turn raw meeting notes into summaries, decisions, and action items." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MeetingNotes,
});

function renderMarkdown-lite(md: string) {
  return md.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="mt-4 font-display text-lg font-semibold first:mt-0">
          {line.slice(3)}
        </h3>
      );
    }
    if (line.startsWith("- ")) {
      return (
        <li key={i} className="ml-5 list-disc text-sm">
          {line.slice(2)}
        </li>
      );
    }
    if (!line.trim()) return <div key={i} className="h-2" />;
    return (
      <p key={i} className="text-sm">
        {line}
      </p>
    );
  });
}

function MeetingNotes() {
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState("");
  const [source, setSource] = useState<"ai" | "local" | null>(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useLocalState<Note[]>("smartwork:notes", []);

  const runExtract = useServerFn(extractMeetingNotes);

  const handleExtract = async () => {
    if (!raw.trim()) return;
    setBusy(true);
    try {
      const res = await runExtract({ data: { transcript: raw } });
      if (res.source === "ai") {
        setResult(res.text);
        setSource("ai");
      } else {
        setResult(localExtractMeetingNotes(raw));
        setSource("local");
      }
    } finally {
      setBusy(false);
    }
  };

  const saveNote = () => {
    if (!result.trim()) return;
    const heading = result.split("\n").find((l) => l.startsWith("## "));
    setNotes((prev) => [
      {
        id: crypto.randomUUID(),
        title: `Meeting note — ${new Date().toLocaleDateString()}`,
        body: result,
        source: source ?? "local",
        savedAt: Date.now(),
      },
      ...prev,
    ]);
    void heading;
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl font-semibold">Meeting Notes</h1>
        <p className="mt-1 text-muted-foreground">
          Paste raw notes or a transcript; get a summary, decisions, and action items.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="card-surface p-5">
            <h2 className="font-semibold">Raw notes</h2>
            <textarea
              className="textarea-base mt-4 min-h-64"
              placeholder={"Paste your meeting notes here, one point per line…\n\ne.g.\nDecided to launch the pilot in March\nAnna will draft the proposal by Friday\nBudget still unclear?"}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
            />
            <button className="btn-primary mt-3 w-full" onClick={handleExtract} disabled={busy || !raw.trim()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Extract notes
            </button>
          </section>

          <section className="card-surface flex flex-col p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Structured notes</h2>
              {source && <AiBadge source={source} />}
            </div>
            <div className="mt-4 flex-1 rounded-lg border border-border bg-background p-4">
              {result ? (
                renderMarkdown-lite(result)
              ) : (
                <p className="text-sm text-muted-foreground">Structured notes appear here.</p>
              )}
            </div>
            <button className="btn-primary mt-3" onClick={saveNote} disabled={!result.trim()}>
              <Save className="h-4 w-4" /> Save note
            </button>
          </section>
        </div>

        {notes.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">Saved notes</h2>
            <div className="mt-3 space-y-3">
              {notes.map((n) => (
                <details key={n.id} className="card-surface p-4">
                  <summary className="flex cursor-pointer items-center justify-between gap-3">
                    <span className="flex min-w-0 flex-wrap items-center gap-2">
                      <span className="truncate font-medium">{n.title}</span>
                      <AiBadge source={n.source} />
                    </span>
                    <button
                      className="btn-secondary shrink-0 text-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        setNotes((prev) => prev.filter((x) => x.id !== n.id));
                      }}
                      aria-label="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </summary>
                  <div className="mt-4 border-t border-border pt-4">{renderMarkdown-lite(n.body)}</div>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
