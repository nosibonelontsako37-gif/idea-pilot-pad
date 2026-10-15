import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";

import { AiBadge } from "@/components/AiBadge";
import { AppShell } from "@/components/AppShell";
import { cleanupEmail, draftEmail } from "@/lib/ai.functions";
import { localCleanupEmail, localDraftEmail } from "@/lib/fallbacks";
import { useLocalState } from "@/lib/store";

export interface Draft {
  id: string;
  title: string;
  body: string;
  source: "ai" | "local";
  savedAt: number;
}

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Studio — SmartWork AI" },
      { name: "description", content: "Draft and polish professional emails with AI assistance." },
      { property: "og:title", content: "Email Studio — SmartWork AI" },
      { property: "og:description", content: "Draft and polish professional emails with AI assistance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmailStudio,
});

function EmailStudio() {
  const [recipient, setRecipient] = useState("");
  const [tone, setTone] = useState("professional");
  const [context, setContext] = useState("");
  const [output, setOutput] = useState("");
  const [outputSource, setOutputSource] = useState<"ai" | "local" | null>(null);
  const [busy, setBusy] = useState<"draft" | "clean" | null>(null);
  const [drafts, setDrafts] = useLocalState<Draft[]>("smartwork:drafts", []);

  const runDraft = useServerFn(draftEmail);
  const runCleanup = useServerFn(cleanupEmail);

  const handleDraft = async () => {
    if (!context.trim()) return;
    setBusy("draft");
    try {
      const res = await runDraft({ data: { context, tone, recipient } });
      if (res.source === "ai") {
        setOutput(res.text);
        setOutputSource("ai");
      } else {
        setOutput(localDraftEmail(context, tone, recipient));
        setOutputSource("local");
      }
    } finally {
      setBusy(null);
    }
  };

  const handleCleanup = async () => {
    if (!output.trim()) return;
    setBusy("clean");
    try {
      const res = await runCleanup({ data: { draft: output } });
      if (res.source === "ai") {
        setOutput(res.text);
        setOutputSource("ai");
      } else {
        setOutput(localCleanupEmail(output));
        setOutputSource("local");
      }
    } finally {
      setBusy(null);
    }
  };

  const saveDraft = () => {
    if (!output.trim()) return;
    const firstLine = output.split("\n").find((l) => l.trim()) ?? "Untitled draft";
    setDrafts((prev) => [
      {
        id: crypto.randomUUID(),
        title: firstLine.replace(/^Subject:\s*/i, "").slice(0, 80),
        body: output,
        source: outputSource ?? "local",
        savedAt: Date.now(),
      },
      ...prev,
    ]);
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-3xl font-semibold">Email Studio</h1>
        <p className="mt-1 text-muted-foreground">Draft and polish emails. Saved drafts stay in this browser.</p>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input column */}
          <section className="card-surface p-5">
            <h2 className="font-semibold">What should the email say?</h2>
            <div className="mt-4 space-y-3">
              <input
                className="input-base"
                placeholder="Recipient (e.g. Sarah from Acme)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
              <select
                className="input-base"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="professional">Professional</option>
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
                <option value="concise">Concise</option>
              </select>
              <textarea
                className="textarea-base min-h-40"
                placeholder="Context and goals, e.g. Follow up on Tuesday's demo, propose a pilot starting next month, ask about their budget timeline."
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
              <button className="btn-primary w-full" onClick={handleDraft} disabled={busy !== null || !context.trim()}>
                {busy === "draft" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Draft email
              </button>
            </div>
          </section>

          {/* Output column */}
          <section className="card-surface flex flex-col p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Draft</h2>
              {outputSource && <AiBadge source={outputSource} />}
            </div>
            <textarea
              className="textarea-base mt-4 min-h-40 flex-1"
              placeholder="Your draft appears here — you can edit it freely."
              value={output}
              onChange={(e) => {
                setOutput(e.target.value);
                setOutputSource(null);
              }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={handleCleanup} disabled={busy !== null || !output.trim()}>
                {busy === "clean" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Clean up
              </button>
              <button className="btn-primary" onClick={saveDraft} disabled={!output.trim()}>
                <Save className="h-4 w-4" /> Save draft
              </button>
            </div>
          </section>
        </div>

        {/* Saved drafts */}
        {drafts.length > 0 && (
          <section className="mt-8">
            <h2 className="font-display text-xl font-semibold">Saved drafts</h2>
            <div className="mt-3 space-y-3">
              {drafts.map((d) => (
                <article key={d.id} className="card-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-medium">{d.title}</h3>
                        <AiBadge source={d.source} />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(d.savedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <button
                        className="btn-secondary"
                        onClick={() => {
                          setOutput(d.body);
                          setOutputSource(d.source);
                        }}
                      >
                        Open
                      </button>
                      <button
                        className="btn-secondary text-destructive"
                        onClick={() => setDrafts((prev) => prev.filter((x) => x.id !== d.id))}
                        aria-label="Delete draft"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
