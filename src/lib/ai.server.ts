import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";
const GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

function createRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) {
        headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      }
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
  };
}

export type AiCallResult =
  | { available: true; text: string }
  | { available: false; reason: string };

/**
 * Runs a one-shot AI call through the Lovable AI Gateway.
 * Streams the gateway call and consumes the final text server-side.
 * Never throws for a missing key — reports unavailability honestly so the
 * caller can fall back to clearly labeled local rules.
 */
export async function callAi(
  request: Request,
  instructions: string,
  userPrompt: string,
): Promise<AiCallResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return { available: false, reason: "AI key is not configured on the server." };
  }

  const runIdFetch = createRunIdFetch(
    request.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined,
  );
  const provider = createOpenAI({
    baseURL: GATEWAY_BASE_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  try {
    const result = streamText({
      model: provider.responses(MODEL),
      system: instructions,
      messages: [{ role: "user", content: userPrompt }],
      abortSignal: request.signal,
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const text = (await result.text).trim();
    if (!text) {
      return { available: false, reason: "AI returned an empty response." };
    }
    return { available: true, text };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI error";
    return { available: false, reason: message };
  }
}
