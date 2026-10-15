/**
 * Local-rule fallbacks used when the server reports AI as unavailable.
 * Everything here is deterministic string logic — clearly labeled in the UI
 * as "Local rules", never presented as AI output.
 */

export function localDraftEmail(context: string, tone: string, recipient: string): string {
  const firstLine = context.split("\n").find((l) => l.trim())?.trim() ?? "your request";
  const subject = firstLine.length > 60 ? `${firstLine.slice(0, 57)}...` : firstLine;
  const greeting = recipient.trim() ? `Hi ${recipient.trim()},` : "Hello,";
  const signoff =
    tone === "formal" ? "Kind regards," : tone === "friendly" ? "Best," : "Thanks,";
  return [
    `Subject: ${subject}`,
    "",
    greeting,
    "",
    `I'm writing regarding ${firstLine.charAt(0).toLowerCase()}${firstLine.slice(1)}.`,
    "",
    context
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(1)
      .join("\n\n"),
    "",
    "Please let me know if you need anything else from my side.",
    "",
    signoff,
    "[Your name]",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export function localCleanupEmail(draft: string): string {
  return draft
    .split("\n")
    .map((line) => line.trim().replace(/\s{2,}/g, " "))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\bi\b/g, "I")
    .trim();
}

export function localExtractMeetingNotes(transcript: string): string {
  const lines = transcript
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const decisions = lines.filter((l) => /decid|agree|confirmed|approved/i.test(l));
  const actions = lines.filter((l) => /will|todo|to-do|action|follow up|by (mon|tue|wed|thu|fri)/i.test(l));
  const questions = lines.filter((l) => l.endsWith("?"));
  const bullet = (items: string[]) =>
    items.length ? items.map((i) => `- ${i}`).join("\n") : "- (none detected)";
  return [
    "## Summary",
    `The meeting covered ${lines.length} noted points. First topic: "${lines[0] ?? "n/a"}".`,
    "",
    "## Key Decisions",
    bullet(decisions),
    "",
    "## Action Items",
    bullet(actions),
    "",
    "## Open Questions",
    bullet(questions),
  ].join("\n");
}

export function localPlanSchedule(
  tasks: { title: string; minutes: number; priority: string }[],
  horizon: string,
): string {
  const order = { high: 0, medium: 1, low: 2 } as Record<string, number>;
  const sorted = [...tasks].sort(
    (a, b) => (order[a.priority] ?? 1) - (order[b.priority] ?? 1),
  );
  const dayMinutes = 8 * 60;
  let cursor = 9 * 60;
  const fmt = (m: number) =>
    `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  const rows: string[] = [];
  const overflow: string[] = [];
  for (const t of sorted) {
    if (cursor + t.minutes > 9 * 60 + dayMinutes) {
      overflow.push(t.title);
      continue;
    }
    rows.push(`- ${fmt(cursor)} – ${fmt(cursor + t.minutes)} — ${t.title} (${t.priority})`);
    cursor += t.minutes + 15; // 15-min break between blocks
  }
  return [
    `## ${horizon === "week" ? "Weekly" : "Daily"} plan (local rules)`,
    "",
    ...(rows.length ? rows : ["- No tasks to schedule."]),
    "",
    "## Notes",
    overflow.length
      ? `- Does not fit today: ${overflow.join(", ")} — move to another day.`
      : "- All tasks fit within an 8-hour day with 15-minute breaks.",
    "- High-priority tasks were scheduled first, starting at 09:00.",
  ].join("\n");
}
