import { NextResponse } from "next/server";
import { runGuidanceEngine } from "@/lib/guidance/engine";
import { getLlmGuidance } from "@/lib/guidance/llm";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = runGuidanceEngine();

  let llmAdvice: string | null = null;
  try {
    llmAdvice = await getLlmGuidance(result);
  } catch (e) {
    llmAdvice = e instanceof Error ? `Error: ${e.message}` : null;
  }

  return NextResponse.json({ ...result, llmAdvice });
}

export async function POST() {
  const result = runGuidanceEngine();

  let llmAdvice: string | null = null;
  try {
    llmAdvice = await getLlmGuidance(result);
  } catch (e) {
    llmAdvice = e instanceof Error ? `Error: ${e.message}` : null;
  }

  return NextResponse.json({ ...result, llmAdvice });
}
