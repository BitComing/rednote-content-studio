import { NextResponse } from "next/server";
import { hasDifyConfig, runDifyWorkflow } from "@/lib/dify";
import { createMockRun } from "@/lib/mock";
import { saveRun } from "@/lib/run-store";
import { validateBrief } from "@/lib/validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let input;
  try { input = validateBrief(await request.json()); } catch(error) { return NextResponse.json({ error: error instanceof Error ? error.message : "输入无效" }, { status: 400 }); }
  try {
    const result = hasDifyConfig() ? await runDifyWorkflow(input) : createMockRun(input);
    saveRun(result);
    return NextResponse.json(result);
  } catch(error) { return NextResponse.json({ error: error instanceof Error ? error.message : "运行失败" }, { status: 502 }); }
}
