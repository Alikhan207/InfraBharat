// _shared/gemini.ts
//
// Direct Google Gemini API client (generativelanguage.googleapis.com).
// Replaces the previous ai.gateway.lovable.dev proxy so the hackathon's
// "mandatory Google AI integration" requirement is satisfied literally,
// not through a third-party gateway.
//
// Get a key from Google AI Studio (https://aistudio.google.com/apikey)
// and set it as a Supabase Edge Function secret:
//   supabase secrets set GEMINI_API_KEY=your-key-here
//
// Returns a response shaped like the OpenAI chat-completions format
// ( { choices: [ { message: { content } } ] } ) so existing call sites
// that do `aiData.choices[0].message.content` don't need to change.

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface GeminiCallOptions {
  model?: string; // e.g. "gemini-2.5-flash"
  temperature?: number;
  maxOutputTokens?: number;
}

export async function callGemini(
  messages: ChatMessage[],
  options: GeminiCallOptions = {}
): Promise<{ choices: [{ message: { content: string } }] }> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = options.model ?? Deno.env.get("GEMINI_MODEL") ?? "gemini-3.7-flash";

  // Gemini keeps system instructions separate from the turn-by-turn
  // conversation, and uses "model" instead of "assistant".
  const systemParts = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      ...(options.maxOutputTokens
        ? { maxOutputTokens: options.maxOutputTokens }
        : {}),
    },
  };

  if (systemParts) {
    body.systemInstruction = { parts: [{ text: systemParts }] };
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    const err = new Error(`Gemini request failed (${res.status}): ${errText}`);
    // @ts-ignore - carry status through for callers that branch on it
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";

  return { choices: [{ message: { content: text } }] };
}

// Multimodal variant: pass one or more inline images (base64, no data: prefix)
// alongside a text prompt. Used for citizen-photo analysis (Gemini multimodal).
export async function callGeminiVision(
  prompt: string,
  images: { base64: string; mimeType: string }[],
  options: GeminiCallOptions = {}
): Promise<{ choices: [{ message: { content: string } }] }> {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = options.model ?? Deno.env.get("GEMINI_MODEL") ?? "gemini-3.7-flash";

  const parts: unknown[] = [{ text: prompt }];
  for (const img of images) {
    parts.push({
      inline_data: { mime_type: img.mimeType, data: img.base64 },
    });
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: options.temperature ?? 0.4 },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini vision request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("") ?? "";

  return { choices: [{ message: { content: text } }] };
}
