import { NextResponse } from "next/server";

import { createMockRevision } from "@/lib/mock";
import type { PlatformDraft } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        drafts?: PlatformDraft[];
        feedback?: string;
        verifiedCorrections?: string;
      }
    | null;

  if (!body || !Array.isArray(body.drafts) || body.drafts.length === 0) {
    return NextResponse.json({ error: "缺少首轮稿件。" }, { status: 400 });
  }

  return NextResponse.json(
    createMockRevision(
      body.drafts,
      String(body.feedback || ""),
      String(body.verifiedCorrections || ""),
    ),
  );
}
