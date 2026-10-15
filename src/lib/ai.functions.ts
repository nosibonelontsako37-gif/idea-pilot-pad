import { createServerFn, getRequest } from "@tanstack/react-start";

import { callAi } from "./ai.server";

export type AiResponse =
  | { ok: true; source: "ai"; text: string }
  | { ok: true; source: "unavailable"; reason: string };

async function run(
  instructions: string,
  prompt: string,
): Promise<AiResponse> {
  const result = await callAi(getRequest(), instructions, prompt);
  if (result.available) {
    return { ok: true, source: "ai", text: result.text };
  }
  return { ok: true, source: "unavailable", reason: result.reason };
}

export const getAiStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ available: boolean }> => {
    return { available: Boolean(process.env["LOVABLE_API_KEY"]) };
  },
);

export const draftEmail = createServerFn({ method: "POST" })
  .inputValidator((data: { context: string; tone: string; recipient: string }) => data)
  .handler(async ({ data }): Promise<AiResponse> => {
    return run(
      "You are a professional email writing assistant. Write a complete, ready-to-send email. " +
        "Include a subject line prefixed with 'Subject: ' on the first line, then a blank line, then the body. " +
        "No placeholders, no commentary.",
      `Recipient: ${data.recipient || "not specified"}\nTone: ${data.tone}\nContext and goals:\n${data.context}`,
    );
  });

export const cleanupEmail = createServerFn({ method: "POST" })
  .inputValidator((data: { draft: string }) => data)
  .handler(async ({ data }): Promise<AiResponse> => {
    return run(
      "You are an editor. Improve the email draft below: fix grammar, tighten wording, " +
        "improve structure and flow, and keep the author's intent and tone. Return only the improved email.",
      data.draft,
    );
  });

export const extractMeetingNotes = createServerFn({ method: "POST" })
  .inputValidator((data: { transcript: string }) => data)
  .handler(async ({ data }): Promise<AiResponse> => {
    return run(
      "You are a meeting notes assistant. From the raw notes or transcript below, produce markdown with exactly these sections: " +
        "## Summary (2-4 sentences), ## Key Decisions (bullets), ## Action Items (bullets with owner if mentioned), " +
        "## Open Questions (bullets). Omit a section only if truly nothing fits.",
      data.transcript,
    );
  });

export const planSchedule = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { tasks: { title: string; minutes: number; priority: string }[]; horizon: string }) => data,
  )
  .handler(async ({ data }): Promise<AiResponse> => {
    const taskList = data.tasks
      .map((t, i) => `${i + 1}. ${t.title} — ${t.minutes} min, priority: ${t.priority}`)
      .join("\n");
    return run(
      "You are a pragmatic planning assistant. Build a realistic schedule from the task list. " +
        "Group deep work in the morning, batch small tasks, add short breaks, and flag anything that does not fit. " +
        "Return markdown: a timetable with times, then a short '## Notes' section.",
      `Planning horizon: ${data.horizon}\nTasks:\n${taskList}`,
    );
  });
