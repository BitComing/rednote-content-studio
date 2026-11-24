import { NextResponse } from "next/server";

import {
  clearDifyConfig,
  getDifyConfig,
  getDifyStatus,
  normalizeBaseUrl,
  saveDifyConfig,
  testDifyConnection,
} from "@/lib/config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getDifyStatus());
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        baseUrl?: string;
        apiKey?: string;
        revisionApiKey?: string;
        analysisApiKey?: string;
        user?: string;
        testOnly?: boolean;
      }
    | null;

  if (!body) {
    return NextResponse.json({ error: "配置参数不完整。" }, { status: 400 });
  }

  const existing = getDifyConfig();
  const baseUrl = body.baseUrl?.trim() || existing?.baseUrl || "";
  const apiKey = body.apiKey?.trim() || existing?.apiKey || "";
  const user = body.user?.trim() || existing?.user || "content-studio";

  if (!baseUrl) {
    return NextResponse.json({ error: "请填写 Dify Base URL。" }, { status: 400 });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "请填写 Dify API Key。" }, { status: 400 });
  }

  let normalized: string;
  try {
    normalized = normalizeBaseUrl(baseUrl);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Base URL 格式不正确。" },
      { status: 400 },
    );
  }

  const test = await testDifyConnection({ baseUrl: normalized, apiKey });

  if (body.testOnly) {
    return NextResponse.json(
      { ok: test.ok, message: test.message, status: getDifyStatus() },
      { status: test.ok ? 200 : 400 },
    );
  }

  try {
    saveDifyConfig({
      baseUrl: normalized,
      apiKey,
      user,
      revisionApiKey: body.revisionApiKey,
      analysisApiKey: body.analysisApiKey,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存配置失败。" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    tested: test.ok,
    message: test.ok ? test.message : `配置已保存，但连接测试失败：${test.message}`,
    status: getDifyStatus(),
  });
}

export async function DELETE() {
  clearDifyConfig();
  return NextResponse.json({ ok: true, status: getDifyStatus() });
}
