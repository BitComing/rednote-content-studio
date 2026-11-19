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

export interface RevisionResult {
  drafts: PlatformDraft[];
  score: number;
  stages: RunStage[];
  summary: string;
}
