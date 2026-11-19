import { NextResponse } from "next/server";

import { hasDifyConfig, runDifyWorkflow } from "@/lib/dify";
import { createMockRun } from "@/lib/mock";
import type { BriefInput } from "@/lib/types";

export const runtime = "nodejs";

function isBriefInput(value: unknown): value is BriefInput {
  if (!value || typeof value !== "object") return false;
  const input = value as Record<string, unknown>;
  return (
    typeof input.brief === "string" &&
    typeof input.tone === "string" &&
    typeof input.language === "string" &&
    Array.isArray(input.platforms) &&
    input.platforms.length > 0 &&
    input.platforms.every((item) => typeof item === "string")
  );
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!isBriefInput(body)) {
    return NextResponse.json({ error: "输入参数不完整。" }, { status: 400 });
  }

  try {
    const result = hasDifyConfig()
      ? await runDifyWorkflow(body)
      : createMockRun(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "运行失败。";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
