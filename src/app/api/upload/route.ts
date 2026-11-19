import { NextResponse } from "next/server";

import { getDifyConfig } from "@/lib/config";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少上传文件。" }, { status: 400 });
  }

  const type = file.type.startsWith("image/") ? "image" : "document";

  const config = getDifyConfig();
  if (!config) {
    return NextResponse.json({
      id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      type,
    });
  }

  const { baseUrl, apiKey, user } = config;
  const body = new FormData();
  body.append("file", file, file.name);
  body.append("user", user);

  const response = await fetch(`${baseUrl}/files/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body,
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.message || `Dify 文件上传失败：HTTP ${response.status}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    id: payload.id,
    name: file.name,
    type,
  });
}
