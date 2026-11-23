import { NextResponse } from "next/server";
import { reviseDifyWorkflow } from "@/lib/dify";
import { createMockRevision } from "@/lib/mock";
import { loadRun, saveRun, lockRun } from "@/lib/run-store";
import { TONES } from "@/lib/constants";
import type { RevisionRequest } from "@/lib/types";
export const runtime = "nodejs";
export async function POST(request: Request) {
  let unlock: (() => void) | undefined;
  try {
    const body = await request.json();
    if (typeof body.runId !== "string" || !["auto", "tone", "content", "facts", "reevaluate", "regenerate"].includes(body.revisionMode)) throw new Error("缺少任务编号或修改路径无效");
    for (const [k, max] of Object.entries({ feedback: 6000, scoreFeedback: 4000, verifiedCorrections: 6000, trend: 256, toneChoice: 2048 })) {
      if (typeof body[k] !== "string" || body[k].length > max) throw new Error(`${k} 输入无效或过长`);
    }
    if (body.toneChoice !== "保持原 tone" && !TONES.includes(body.toneChoice)) throw new Error("语气无效");
    unlock = lockRun(body.runId);
    const run = loadRun(body.runId);
    if (run.status !== "reviewing") throw new Error("任务已结束，请新建首轮任务");
    if (body.expectedVersion !== run.history?.length) return NextResponse.json({ error: "版本已更新，请刷新或重新打开任务后再操作" }, { status: 409 });
    if ((run.verifiedFacts || "").length + body.verifiedCorrections.length > 6000) throw new Error("累计事实补充超过 6000 字符，请整理简报后开始新任务");
    if (!body.feedback.trim() && !body.verifiedCorrections.trim() && !body.scoreFeedback.trim() && body.toneChoice === "保持原 tone" && body.trend === run.selectedTrend && !["reevaluate", "regenerate"].includes(body.revisionMode)) throw new Error("请填写反馈、调整语气／话题或选择重新评分");
    const req: RevisionRequest = { run, feedback: body.feedback, scoreFeedback: body.scoreFeedback, verifiedCorrections: body.verifiedCorrections, trend: body.trend, toneChoice: body.toneChoice, revisionMode: body.revisionMode };
    const result = run.mode === "dify" ? await reviseDifyWorkflow(req) : createMockRevision(req);
    saveRun(result);
    return NextResponse.json(result);
  } catch(error) { return NextResponse.json({ error: error instanceof Error ? error.message : "改稿失败" }, { status: 400 }); }
  finally { unlock?.(); }
}
