import { NextResponse } from "next/server";

import { hasAnalysisConfig, runAccountAnalysis } from "@/lib/dify";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { accountUrl?: string; notesLimit?: string; merchantNote?: string }
    | null;

  if (!body || typeof body.accountUrl !== "string" || !body.accountUrl.trim()) {
    return NextResponse.json(
      { error: "请填写小红书主页链接或 24 位用户编号。" },
      { status: 400 },
    );
  }
  if (!hasAnalysisConfig()) {
    return NextResponse.json(
      { error: "尚未配置账号评估工作流 API Key。请打开 Dify 设置填写。" },
      { status: 400 },
    );
  }

  const limit = Number.parseInt(String(body.notesLimit ?? "20"), 10);
  if (!Number.isFinite(limit) || limit < 1) {
    return NextResponse.json(
      { error: "拉取笔记条数需要是大于 0 的整数。" },
      { status: 400 },
    );
  }

  try {
    const result = await runAccountAnalysis({
      accountUrl: body.accountUrl,
      notesLimit: String(Math.min(limit, 100)),
      merchantNote: typeof body.merchantNote === "string" ? body.merchantNote : "",
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "账号评估失败。";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
