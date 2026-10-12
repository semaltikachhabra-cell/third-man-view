// Fallback chain: if one Flash model is overloaded (503/429) or retired (404), try the next.
const MODELS = ["gemini-3.5-flash", "gemini-flash-lite-latest", "gemini-3.8-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

type Schema = Record<string, unknown>;

export async function geminiJSON<T>(prompt: string, schema: Schema, validate: (x: unknown) => T): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");

  let lastErr: unknown;
  for (let attempt = 0; attempt < MODELS.length * 2; attempt++) {
    const model = MODELS[attempt % MODELS.length];
    if (attempt > 0) await new Promise((r) => setTimeout(r, (attempt < MODELS.length ? 100 : 500)));
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: attempt === 0 ? 0.3 : 0.1,
              responseMimeType: "application/json",
              responseSchema: schema,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
          signal: AbortSignal.timeout(20_000),
        }
      );
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini returned no content");
      return validate(JSON.parse(text));
    } catch (e) {
      lastErr = e;
    }
  }
  console.error("Gemini failed", lastErr);
  throw new Error(`The AI model is busy right now. Please try again in a moment. (${lastErr instanceof Error ? lastErr.message.slice(0, 160) : "unknown"})`);
}
