export type Severity = "block" | "warn";
export type ClaimStatus = "supported" | "unsupported" | "to_verify";
export type StageStatus = "pending" | "running" | "done" | "warning" | "blocked";
export type RunMode = "mock" | "dify";
export type WorkspaceStatus =
  | "idle"
  | "running"
  | "reviewing"
  | "revising"
  | "approved"
  | "rejected"
  | "error";

export interface UploadedFile {
  id: string;
  name: string;
  type: "image" | "document";
}

export interface BriefInput {
  scenario?: string;
  merchantId?: string;
  selectedTrend?: string;
  trendJson?: string;
  brief: string;
  tone: string;
  toneDetails: string;
  language: string;
  platforms: string[];
  bannedWords: string;
  files: UploadedFile[];
}

export interface ReviewIssue {
  id: string;
  severity: Severity;
  type: string;
  reason: string;
  suggestion?: string;
}

export interface Claim {
  id: string;
  platform: string;
  claim: string;
  status: ClaimStatus;
  sourceQuote?: string;
}

export interface PlatformDraft {
  platform: string;
  firstRound: string;
  secondRound?: string;
  score: number;
  status: "pass" | "revise";
  issues: ReviewIssue[];
  claims: Claim[];
  wordCount: number;
}

export interface RunStage {
  id: string;
  label: string;
  detail: string;
  status: StageStatus;
  timestamp?: string;
}

export interface TrendOption {
  label: string;
  heat: string;
}

export interface RunResult {
  briefSnapshot?: BriefInput;
  documents?: string;
  reviewJson?: string;
  canApprove?: boolean;
  effectiveTone?: string;
  verifiedFacts?: string;
  knowledge?: KnowledgeHit[];
  history?: VersionRecord[];
  evaluation?: Evaluation;
  route?: RevisionMode;
  workflowRunId?: string;
  elapsedMs?: number;
  id: string;
  mode: RunMode;
  startedAt: string;
  stages: RunStage[];
  drafts: PlatformDraft[];
  trendOptions: TrendOption[];
  selectedTrend: string;
  score: number;
  summary: string;
  status: "reviewing" | "approved" | "rejected";
}

export type RevisionMode = "auto" | "tone" | "content" | "facts" | "reevaluate" | "regenerate";
export interface RevisionRequest {
  run: RunResult;
  feedback: string;
  scoreFeedback: string;
  verifiedCorrections: string;
  toneChoice: string;
  trend: string;
  revisionMode: RevisionMode;
}
export interface KnowledgeHit { id: string; title: string; source: string; text: string; kind: "guidance" | "fact"; verifiedAt?: string; }
export interface JudgeResult {
  model: string; status: "ok" | "error"; elapsedMs: number; score?: number;
  dimensions?: Record<string, number>; reasons?: Record<string, string>; blocks: string[]; error?: string;
}
export interface Evaluation {
  status: "complete" | "partial" | "unconfigured" | "demo";
  rubric: string; judges: JudgeResult[]; mean: number | null; spread: number | null;
  requiresReview: boolean; elapsedMs: number;
}
export interface VersionRecord {
  version: number; createdAt: string; route: string; content: string; reviewJson: string;
  feedback: string; scoreFeedback: string; corrections: string; tone: string; trend: string;
  workflowRunId?: string; elapsedMs: number; evaluation?: Evaluation; internalScore: number;
  approved?: boolean;
}

export interface RevisionResult {
  drafts: PlatformDraft[];
  score: number;
  stages: RunStage[];
  summary: string;
}
