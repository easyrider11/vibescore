import { parseJsonOr } from "../../lib/json";
import { toDate } from "./utils";
import type { ReportEvent, ReportSession } from "./types";

interface AiPayload {
  mode?: string;
  question?: string;
  response?: string;
  tokensUsed?: number;
  responseTimeMs?: number;
  mocked?: boolean;
}

export interface BehaviorSignal {
  label: string;
  tone: "good" | "neutral" | "warn";
  hint: string;
}

export interface DerivedSessionData {
  sortedEvents: ReportEvent[];
  aiEvents: ReportEvent[];
  testEvents: ReportEvent[];
  submitEvents: ReportEvent[];
  fileOpenEvents: ReportEvent[];
  aiPayloads: AiPayload[];
  aiModeBreakdown: Record<string, number>;
  totalTokens: number;
  uniqueFilesViewed: number;
  lastTest: ReportEvent | undefined;
  lastTestPayload: { stdout?: string; passed?: boolean };
  durationMin: number | null;
  signals: BehaviorSignal[];
}

export function deriveSessionData(session: ReportSession): DerivedSessionData {
  const sortedEvents = [...session.events].sort((a, b) => {
    const aT = toDate(a.createdAt)?.getTime() ?? 0;
    const bT = toDate(b.createdAt)?.getTime() ?? 0;
    return aT - bT;
  });

  const aiEvents = sortedEvents.filter((e) => e.type === "AI_CHAT");
  const testEvents = sortedEvents.filter((e) => e.type === "RUN_TESTS");
  const submitEvents = sortedEvents.filter((e) => e.type === "SUBMIT");
  const fileOpenEvents = sortedEvents.filter((e) => e.type === "OPEN_FILE");

  const aiPayloads = aiEvents.map((e) => parseJsonOr<AiPayload>(e.payload, {}));

  const aiModeBreakdown: Record<string, number> = {};
  for (const p of aiPayloads) {
    const mode = p.mode || "unknown";
    aiModeBreakdown[mode] = (aiModeBreakdown[mode] || 0) + 1;
  }
  const totalTokens = aiPayloads.reduce((sum, p) => sum + (p.tokensUsed || 0), 0);

  const uniqueFilesViewed = new Set(
    fileOpenEvents.map((e) => parseJsonOr<{ path?: string }>(e.payload, {}).path),
  ).size;

  const lastTest = [...testEvents].reverse()[0];
  const lastTestPayload = parseJsonOr<{ stdout?: string; passed?: boolean }>(
    lastTest?.payload,
    {},
  );

  const started = toDate(session.startedAt);
  const ended = toDate(session.endedAt);
  const durationMin =
    started && ended
      ? Math.max(1, Math.round((ended.getTime() - started.getTime()) / 60000))
      : null;

  const signals: BehaviorSignal[] = [];
  if (aiEvents.length === 0) {
    signals.push({
      label: "Did not use AI",
      tone: "neutral",
      hint: "Candidate chose to work without the copilot.",
    });
  } else if (aiEvents.length >= 3) {
    signals.push({
      label: `Used AI ${aiEvents.length}x`,
      tone: "good",
      hint: `Modes: ${Object.entries(aiModeBreakdown)
        .map(([m, n]) => `${m} ${n}`)
        .join(", ")}`,
    });
  }
  if (testEvents.length >= 2) {
    signals.push({
      label: `${testEvents.length} test runs`,
      tone: "good",
      hint: "Iterated on test output before submitting.",
    });
  }
  if (testEvents.length === 0 && submitEvents.length > 0) {
    signals.push({
      label: "Submitted without running tests",
      tone: "warn",
      hint: "No test runs were recorded before submission.",
    });
  }
  if (durationMin !== null && durationMin < 5) {
    signals.push({
      label: "Very short session",
      tone: "warn",
      hint: `Only ${durationMin} minute${durationMin === 1 ? "" : "s"} between start and end.`,
    });
  }

  return {
    sortedEvents,
    aiEvents,
    testEvents,
    submitEvents,
    fileOpenEvents,
    aiPayloads,
    aiModeBreakdown,
    totalTokens,
    uniqueFilesViewed,
    lastTest,
    lastTestPayload,
    durationMin,
    signals,
  };
}
