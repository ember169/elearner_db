import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { AssessLlmConfig } from "./types";

export function readAssessLlmConfig(): AssessLlmConfig {
  const cfg = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (cfg?.assessLlmProvider) {
    return {
      provider: cfg.assessLlmProvider,
      apiKey: cfg.assessLlmApiKey ?? null,
      model: cfg.assessLlmModel ?? null,
      baseUrl: cfg.assessLlmBaseUrl ?? null,
    };
  }
  return {
    provider: cfg?.llmProvider ?? "anthropic",
    apiKey: cfg?.llmApiKey ?? null,
    model: cfg?.llmModel ?? "claude-sonnet-5",
    baseUrl: cfg?.llmBaseUrl ?? null,
  };
}

export async function callAssessLlm(
  systemPrompt: string,
  userPrompt: string,
  config?: AssessLlmConfig,
): Promise<string> {
  const cfg = config ?? readAssessLlmConfig();

  if (cfg.provider === "anthropic") {
    if (!cfg.apiKey) throw new Error("Assessment AI: no Anthropic API key configured");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": cfg.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: cfg.model ?? "claude-sonnet-5",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${text.slice(0, 500)}`);
    }
    const data = await res.json();
    const textBlock = data.content?.find((b: { type: string }) => b.type === "text");
    return textBlock?.text ?? "";
  }

  if (cfg.provider === "openai") {
    const base = "https://api.openai.com/v1";
    if (!cfg.apiKey) throw new Error("Assessment AI: no OpenAI API key configured");
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model ?? "gpt-4o",
        max_tokens: 2048,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${text.slice(0, 500)}`);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  // local / OpenAI-compatible
  if (!cfg.baseUrl) throw new Error("Assessment AI: no base URL configured for local LLM");
  const url = `${cfg.baseUrl.replace(/\/+$/, "")}/v1/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    signal: AbortSignal.timeout(90_000),
    headers: {
      "Content-Type": "application/json",
      ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: cfg.model ?? "default",
      max_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Local LLM error ${res.status}: ${text.slice(0, 500)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export function parseJsonFromLlm<T>(raw: string): T {
  const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`LLM response is not JSON: ${cleaned.slice(0, 300)}`);
  return JSON.parse(match[0]) as T;
}
