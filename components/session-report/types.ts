export interface ReportEvent {
  id: string;
  type: string;
  payload: unknown;
  createdAt: Date | string;
}

export interface ReportSubmission {
  id: string;
  diffText: string;
  clarificationNotes: string | null;
  createdAt: Date | string;
}

export interface ReportRubricScore {
  id: string;
  scores: unknown;
  comments: string;
  decision: string;
  createdAt: Date | string;
}

export interface ReportAIGrade {
  scores: unknown;
  decision: string;
  summary: string;
  strengths: unknown;
  improvements: unknown;
  model: string;
}

export interface ReportScenario {
  title: string;
  description: string;
  background: string;
  tasks: unknown;
  evaluationPoints: unknown;
  aiPolicy: unknown;
  timeLimitMin: number | null;
}

export interface ReportSession {
  id: string;
  scenario: ReportScenario;
  status: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  durationMinutes: number;
  startedAt: Date | string | null;
  endedAt: Date | string | null;
  createdAt: Date | string;
  events: ReportEvent[];
  submissions: ReportSubmission[];
  rubricScores: ReportRubricScore[];
  aiGrade: ReportAIGrade | null;
}

export type Variant = "authenticated" | "public";

export interface SessionReportProps {
  session: ReportSession;
  variant?: Variant;
  shareUrl?: string | null;
}
