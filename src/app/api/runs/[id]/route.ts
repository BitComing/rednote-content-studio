import { NextResponse } from "next/server";
import { loadRun, saveRun, lockRun } from "@/lib/run-store";
export const runtime = "nodejs";
export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try { return NextResponse.json(loadRun((await ctx.params).id)); } catch { return NextResponse.json({ error: "未找到该本地任务" }, { status: 404 }); }
}
export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  let unlock: (()=>void) | undefined;
  try {
    const { id } = await ctx.params; const body = await request.json();
    unlock = lockRun(id); const run = loadRun(id);
    if (body.expectedVersion !== run.history?.length || run.status !== "reviewing") throw new Error("版本或状态已变化，请重新加载任务");
    if (!["approved", "rejected"].includes(body.status)) throw new Error("状态无效");
    if (body.status === "approved" && (!run.canApprove || run.drafts.some(d => d.issues.some(i => i.severity === "block") || d.claims.some(c => c.status !== "supported")))) throw new Error("检查或外部评估未通过，请修订／复评后再确认");
    run.status = body.status;
    if (run.history?.length) run.history[run.history.length-1].approved = body.status === "approved";
    saveRun(run); return NextResponse.json(run);
  } catch(error) { return NextResponse.json({ error: error instanceof Error ? error.message : "无法更新" }, { status: 400 }); } finally { unlock?.(); }
}
