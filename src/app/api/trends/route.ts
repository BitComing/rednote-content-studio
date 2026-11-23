import { NextResponse } from "next/server";
export const runtime = "nodejs";
export async function GET() {
  try {
    const response = await fetch(process.env.TREND_API_URL || "https://60s.viki.moe/v2/weibo", { cache: "no-store", signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`热点服务 HTTP ${response.status}`);
    const data = await response.json(); const rows = Array.isArray(data.data) ? data.data : data.data?.list || data.data?.items;
    if (!Array.isArray(rows)) throw new Error("热点服务返回格式不匹配");
    const titles = [...new Set(rows.map((r: Record<string, unknown>) => String(r.title || r.name || r.word || "").replace(/[{}\r\n]/g, "").trim().slice(0,100)).filter(Boolean))].slice(0,10);
    return NextResponse.json({ topics: titles, fetchedAt: new Date().toISOString(), source: "微博热榜 · 第三方 API", warning: "仅作选题背景，不是小红书官方热榜或商家事实依据" });
  } catch (e) { return NextResponse.json({ topics: [], warning: `热点暂不可用，可不附加热点继续。${e instanceof Error ? e.message : ""}` }); }
}
