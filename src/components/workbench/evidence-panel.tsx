"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RunResult } from "@/lib/types";
const routeLabels: Record<string, string> = { initial: "首轮", tone: "仅调语气", content: "局部改稿", facts: "事实纠正", reevaluate: "仅复评", regenerate: "调用首轮工具" };
const dimensions: Record<string, string> = { factuality: "事实", safety: "风险", campusFit: "校园适配", tone: "语气", clarity: "清晰度" };
export function EvidencePanel({ run, onExport }: { run: RunResult; onExport: () => void }) {
  const ev = run.evaluation;
  return <Card><CardHeader className="pb-2"><CardTitle>版本与独立评估</CardTitle></CardHeader><CardContent className="space-y-3 text-xs">
    <div className="flex flex-wrap justify-between gap-2"><span>当前 V{run.history?.length || 1} · {routeLabels[run.route || "initial"]} · 总耗时 {((run.elapsedMs || 0)/1000).toFixed(1)} 秒</span><Button size="sm" variant="outline" onClick={onExport}>导出全部版本 / 评估 JSON</Button></div>
    <p>当前语气：{run.effectiveTone || run.briefSnapshot?.tone} · 话题：{run.selectedTrend}</p>
    <p className="text-muted-foreground">事实 40% · 风险 25% · 校园与平台适配 15% · 语气 10% · 清晰度 10%。每项 0–5 分，服务端计算总分。</p>
    <div className="rounded-md border bg-muted/30 p-3">
      {ev?.status === "demo" ? "演示模式：未调用评估模型，不显示模拟分数。" : ev?.status === "unconfigured" || !ev ? "外部评估尚未配置；当前内部评分不代表独立评估已完成。" : <>
        <strong>外部均分 {ev.mean ?? "—"} / 100</strong> · 分差 {ev.spread ?? "—"} · {ev.status === "complete" ? "评估完成" : "评估未完整完成"}
        {ev.requiresReview && <p className="mt-1 text-amber-800">存在风险、明显分歧或评估缺失，暂不能通过。</p>}
        {ev.judges.map(j => <details key={j.model} className="mt-2 border-t pt-2"><summary>{j.model} · {j.status === "ok" ? `${j.score} 分` : "失败"} · {(j.elapsedMs/1000).toFixed(1)} 秒</summary>
          {j.error && <p>{j.error}</p>}{Object.entries(j.dimensions || {}).map(([k,v]) => <p key={k} className="mt-1">{dimensions[k] || k} {v}/5：{j.reasons?.[k]}</p>)}
          {j.blocks.map((b,i) => <p key={i} className="text-red-700">拦截：{b}</p>)}</details>)}
      </>}
    </div>
    <details><summary className="cursor-pointer">全部版本与处理记录（{run.history?.length || 0}）</summary>
      {run.history?.map(v => <details key={v.version} className="mt-2 rounded border p-2"><summary>V{v.version} · {routeLabels[v.route] || v.route} · 外评 {v.evaluation?.mean ?? "未评"} · {(v.elapsedMs/1000).toFixed(1)} 秒</summary>
        <p className="mt-1">语气：{v.tone}；话题：{v.trend}；反馈：{v.feedback || "无"}；评分异议：{v.scoreFeedback || "无"}</p>
        <p>事实补充：{v.corrections || "无"}</p><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-sans">{v.content}</pre></details>)}
    </details>
    <details><summary className="cursor-pointer">本次知识依据（{run.knowledge?.length || 0}）</summary>
      {run.knowledge?.map(k => <div key={k.id} className="mt-2 rounded border p-2"><strong>{k.kind === "fact" ? "商家事实" : "写作指引，非事实依据"} · {k.title}</strong><p>{k.text}</p><p className="text-muted-foreground">{k.source}</p></div>)}
      {!run.knowledge?.some(k => k.kind === "fact") && <p className="mt-2 text-muted-foreground">本次未检索到已核实、在有效期内的商家事实；以提交的简报和文档为准。</p>}
    </details>
  </CardContent></Card>;
}
