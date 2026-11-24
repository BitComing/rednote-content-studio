"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
export function TrendPicker({ value, onChange }: { value: string; onChange: (value: string, json: string) => void }) {
  const [topics, setTopics] = useState<string[]>([]); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const [fetchedAt, setFetchedAt] = useState(""); const [source, setSource] = useState("");
  async function refresh() { setBusy(true); try { const r = await fetch("/api/trends"); const p = await r.json(); setTopics(p.topics || []); setMessage(p.warning || ""); setFetchedAt(p.fetchedAt || ""); setSource(p.source || ""); } catch { setMessage("热点加载失败，可以不附加热点继续。"); } finally { setBusy(false); } }
  return <div className="space-y-1"><div className="flex items-center justify-between text-xs"><span>话题（可不附加）</span><Button type="button" size="sm" variant="ghost" onClick={refresh} disabled={busy}>{busy ? "加载中" : "刷新热榜"}</Button></div>
    <Select value={value} onChange={e => onChange(e.target.value, JSON.stringify(e.target.value === "不附加热点" ? { attached: false } : { attached: true, title: e.target.value, fetchedAt, source: source || "公开热榜" }))}>{[...new Set(["不附加热点", value, ...topics])].filter(Boolean).map(t => <option key={t}>{t}</option>)}</Select>
    {message && <p className="text-[10px] text-muted-foreground">{message}</p>}</div>;
}
