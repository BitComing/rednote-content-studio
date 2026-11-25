import fs from "node:fs";
import path from "node:path";
import { editorialGuidance } from "./campus";
import type { KnowledgeHit } from "./types";

interface RecordEntry extends KnowledgeHit { merchantId: string; verified: boolean; expiresAt: string; }
export function retrieveKnowledge(merchantId: string): KnowledgeHit[] {
  const guidance = editorialGuidance();
  const file = path.join(process.cwd(), "data", "merchant-knowledge.json");
  const records = JSON.parse(fs.readFileSync(file, "utf8")) as RecordEntry[];
  const now = Date.now();
  return guidance.concat(records.filter(r => r.merchantId === merchantId && r.kind === "fact" && r.verified === true &&
    Boolean(r.source && r.verifiedAt) && Date.parse(r.verifiedAt!) <= now && Date.parse(r.expiresAt) > now)
    .slice(0, 8).map(({ id, title, source, text, kind, verifiedAt }) => ({ id, title, source, text, kind, verifiedAt })));
}
export function knowledgeText(hits: KnowledgeHit[], kind: "fact" | "guidance") {
  return hits.filter(h => h.kind === kind).map(h => `[${h.id}] ${h.title}\n来源：${h.source}\n${h.text}`).join("\n\n");
}
