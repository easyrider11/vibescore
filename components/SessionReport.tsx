import { DiffViewer } from "./DiffViewer";
import { parseJsonOr } from "../lib/json";
import {
  DECISION_CHIP_CLASSES as DECISION_COLORS,
  DECISION_LABELS,
  RUBRIC_LABELS,
  type Decision,
} from "../lib/rubric";
import type { SessionReportProps } from "./session-report/types";
import { EVENT_CHIP_COLORS, formatDate, formatTime, titleCase } from "./session-report/utils";
import { deriveSessionData } from "./session-report/derive";

export type { ReportSession, SessionReportProps } from "./session-report/types";

export function SessionReport({ session, variant = "authenticated", shareUrl }: SessionReportProps) {
  const {
    sortedEvents,
    aiEvents,
    testEvents,
    aiPayloads,
    totalTokens,
    uniqueFilesViewed,
    lastTest,
    lastTestPayload,
    durationMin,
    signals,
  } = deriveSessionData(session);

  const scenarioTasks = parseJsonOr<string[]>(session.scenario.tasks, []);
  const scenarioEvalPoints = parseJsonOr<string[]>(session.scenario.evaluationPoints, []);
  const aiPolicy = parseJsonOr<{ allowedModes?: string[] }>(session.scenario.aiPolicy, {});
  const allowedModes = aiPolicy.allowedModes || [];

  const grade = session.aiGrade;
  const gradeScores = grade
    ? (parseJsonOr<Record<string, number>>(grade.scores, {}) as Record<string, number>)
    : null;
  const gradeStrengths = grade ? parseJsonOr<string[]>(grade.strengths, []) : [];
  const gradeImprovements = grade ? parseJsonOr<string[]>(grade.improvements, []) : [];

  const manualScore = session.rubricScores[0] || null;

  return (
    <div className="mx-auto max-w-5xl p-6 lg:p-10 space-y-8">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider"
             style={{ color: "var(--text-tertiary)" }}>
          <span>Session Report</span>
          <span aria-hidden="true">·</span>
          <span>{formatDate(session.createdAt)}</span>
          {variant === "public" && (
            <>
              <span aria-hidden="true">·</span>
              <span style={{ color: "var(--accent-cyan)" }}>Shared Read-Only</span>
            </>
          )}
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="font-display text-2xl font-semibold leading-tight"
                style={{ color: "var(--text-primary)" }}>
              {session.scenario.title}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {session.candidateName || "Unnamed candidate"}
              {session.position && (
                <span style={{ color: "var(--text-tertiary)" }}> · {session.position}</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-muted">{titleCase(session.status)}</span>
            {durationMin !== null && (
              <span className="chip chip-muted">{durationMin}m spent</span>
            )}
            <span className="chip chip-muted">{session.durationMinutes}m budget</span>
          </div>
        </div>
      </header>

      {grade && (
        <section
          className="card p-6 lg:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-2xl">
              <div
                className="text-xs font-semibold uppercase tracking-[0.22em] mb-2"
                style={{ color: "var(--accent-cyan)" }}
              >
                AI Assessment
              </div>
              <h2
                className="font-display text-xl font-semibold leading-snug"
                style={{ color: "var(--text-primary)" }}
              >
                {grade.summary}
              </h2>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span
                className={`chip ${DECISION_COLORS[grade.decision as Decision] || "chip-muted"}`}
                style={{ fontSize: 12, padding: "4px 12px" }}
              >
                {DECISION_LABELS[grade.decision as Decision] || grade.decision}
              </span>
              {gradeScores && (
                <div
                  className="font-mono text-xs tabular"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Avg{" "}
                  {(
                    Object.values(gradeScores).reduce((a, b) => a + b, 0) /
                    Math.max(Object.values(gradeScores).length, 1)
                  ).toFixed(1)}
                  /5
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-tabular>
        {[
          { label: "Events", value: sortedEvents.length },
          { label: "AI Queries", value: aiEvents.length },
          { label: "Files Viewed", value: uniqueFilesViewed },
          { label: "Test Runs", value: testEvents.length },
          {
            label: "Tokens",
            value: totalTokens > 0 ? totalTokens.toLocaleString() : "—",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="card p-4">
            <div className="font-mono text-xl font-semibold tabular"
                 style={{ color: "var(--text-primary)" }}>
              {kpi.value}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      {grade && (
        <section className="card p-6">
          <div className="mb-4">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider"
                style={{ color: "var(--text-tertiary)" }}>
              Rubric Breakdown
            </h2>
          </div>

          {gradeScores && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3" data-tabular>
              {Object.entries(RUBRIC_LABELS).map(([key, label]) => {
                const val = gradeScores[key];
                if (val === undefined) return null;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
                      <span className="font-mono tabular" style={{ color: "var(--accent-blue)" }}>
                        {val}/5
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden"
                         style={{ background: "var(--bg-inset)" }}>
                      <div className="h-full rounded-full"
                           style={{
                             width: `${(val / 5) * 100}%`,
                             background:
                               val >= 4 ? "var(--accent-green)" :
                               val >= 3 ? "var(--accent-blue)" :
                               val >= 2 ? "var(--accent-orange)" :
                               "var(--accent-red)",
                           }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {gradeStrengths.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                     style={{ color: "var(--accent-green)" }}>
                  Strengths
                </div>
                <ul className="space-y-1.5">
                  {gradeStrengths.map((s, i) => (
                    <li key={i} className="text-xs flex gap-2"
                        style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent-green)" }}>+</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {gradeImprovements.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-2"
                     style={{ color: "var(--accent-orange)" }}>
                  Areas to Improve
                </div>
                <ul className="space-y-1.5">
                  {gradeImprovements.map((s, i) => (
                    <li key={i} className="text-xs flex gap-2"
                        style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--accent-orange)" }}>−</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {signals.length > 0 && (
        <section>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-tertiary)" }}>
            Behavior Signals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {signals.map((s) => {
              const color =
                s.tone === "good"
                  ? "var(--accent-green)"
                  : s.tone === "warn"
                  ? "var(--accent-orange)"
                  : "var(--text-tertiary)";
              return (
                <div key={s.label} className="card-sm p-3">
                  <div className="text-xs font-semibold mb-0.5" style={{ color }}>
                    {s.label}
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {s.hint}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-tertiary)" }}>
          Timeline
        </h2>
        <div className="card overflow-hidden">
          {sortedEvents.length === 0 ? (
            <div className="p-4 text-xs" style={{ color: "var(--text-tertiary)" }}>
              No events recorded.
            </div>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--border-default)" }}>
              {sortedEvents.slice(0, 40).map((event) => {
                const payload = parseJsonOr<{
                  mode?: string;
                  path?: string;
                  question?: string;
                  passed?: boolean;
                }>(event.payload, {});
                let detail = "";
                if (event.type === "AI_CHAT" && payload.mode) {
                  detail = payload.mode + (payload.question ? ` · ${payload.question}` : "");
                } else if (event.type === "OPEN_FILE" && payload.path) {
                  detail = payload.path;
                } else if (event.type === "RUN_TESTS") {
                  detail = payload.passed ? "passed" : "ran";
                }
                return (
                  <li key={event.id}
                      className="flex items-center gap-3 px-4 py-2 text-xs">
                    <span className={`chip ${EVENT_CHIP_COLORS[event.type] || "chip-muted"} shrink-0`}
                          style={{ minWidth: 96, justifyContent: "center" }}>
                      {titleCase(event.type.replace(/_/g, " "))}
                    </span>
                    <span className="font-mono tabular shrink-0" style={{ color: "var(--text-tertiary)" }}>
                      {formatTime(event.createdAt)}
                    </span>
                    {detail && (
                      <span className="truncate min-w-0" style={{ color: "var(--text-secondary)" }}>
                        {detail}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {sortedEvents.length > 40 && (
            <div className="px-4 py-2 text-xs"
                 style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border-default)" }}>
              Showing first 40 of {sortedEvents.length} events.
            </div>
          )}
        </div>
      </section>

      {aiEvents.length > 0 && (
        <section>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-tertiary)" }}>
            AI Interactions
          </h2>
          <div className="space-y-3">
            {aiEvents.map((event, idx) => {
              const payload = aiPayloads[idx] || {};
              return (
                <div key={event.id} className="card p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="chip chip-purple">{payload.mode || "ai"}</span>
                      <span style={{ color: "var(--text-tertiary)" }}>#{idx + 1}</span>
                      {payload.tokensUsed ? (
                        <span style={{ color: "var(--text-tertiary)" }}>
                          · {payload.tokensUsed} tokens
                        </span>
                      ) : null}
                    </div>
                    <span className="font-mono" style={{ color: "var(--text-tertiary)" }}>
                      {formatTime(event.createdAt)}
                    </span>
                  </div>
                  {payload.question && (
                    <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {payload.question}
                    </p>
                  )}
                  {payload.response && (
                    <div className="rounded-lg p-3 text-xs whitespace-pre-wrap leading-relaxed"
                         style={{
                           background: "var(--bg-inset)",
                           color: "var(--text-secondary)",
                         }}>
                      {payload.response}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {lastTest && (
        <section>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-tertiary)" }}>
            Latest Test Run
          </h2>
          <div className="card p-4">
            <div className="text-xs mb-2 font-mono"
                 style={{ color: "var(--text-tertiary)" }}>
              {formatTime(lastTest.createdAt)}
            </div>
            <pre className="rounded-lg p-3 text-xs whitespace-pre-wrap overflow-x-auto"
                 style={{
                   background: "var(--bg-inset)",
                   color: "var(--text-primary)",
                 }}>
              {String(lastTestPayload.stdout || "(no output)")}
            </pre>
          </div>
        </section>
      )}

      {session.submissions.length > 0 && (
        <section>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-tertiary)" }}>
            Submissions
          </h2>
          <div className="space-y-4">
            {session.submissions.map((submission, idx) => (
              <div key={submission.id} className="card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="chip chip-green">Snapshot #{idx + 1}</span>
                  <span className="text-xs font-mono"
                        style={{ color: "var(--text-tertiary)" }}>
                    {formatTime(submission.createdAt)}
                  </span>
                </div>
                {submission.clarificationNotes && (
                  <div className="rounded-lg p-3 text-xs"
                       style={{
                         background: "var(--bg-inset)",
                         color: "var(--text-secondary)",
                       }}>
                    <span className="font-semibold"
                          style={{ color: "var(--accent-orange)" }}>
                      Notes:{" "}
                    </span>
                    {submission.clarificationNotes}
                  </div>
                )}
                <DiffViewer diffText={submission.diffText || ""} />
              </div>
            ))}
          </div>
        </section>
      )}

      {manualScore && (
        <section>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-tertiary)" }}>
            Interviewer Evaluation
          </h2>
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              {manualScore.decision && (
                <span className={`chip ${DECISION_COLORS[manualScore.decision as Decision] || "chip-muted"}`}>
                  {DECISION_LABELS[manualScore.decision as Decision] || manualScore.decision}
                </span>
              )}
              <span className="text-xs font-mono"
                    style={{ color: "var(--text-tertiary)" }}>
                {formatDate(manualScore.createdAt)}
              </span>
            </div>
            {manualScore.comments && (
              <p className="text-sm leading-relaxed"
                 style={{ color: "var(--text-secondary)" }}>
                {manualScore.comments}
              </p>
            )}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-sm font-semibold uppercase tracking-wider mb-3"
            style={{ color: "var(--text-tertiary)" }}>
          Scenario
        </h2>
        <div className="card p-5 space-y-3">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {session.scenario.background}
          </p>
          {scenarioTasks.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                   style={{ color: "var(--text-tertiary)" }}>
                Tasks
              </div>
              <ul className="text-sm list-disc pl-5 space-y-0.5"
                  style={{ color: "var(--text-secondary)" }}>
                {scenarioTasks.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          )}
          {scenarioEvalPoints.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
                   style={{ color: "var(--text-tertiary)" }}>
                Evaluation Criteria
              </div>
              <ul className="text-sm list-disc pl-5 space-y-0.5"
                  style={{ color: "var(--text-secondary)" }}>
                {scenarioEvalPoints.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
          {allowedModes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-tertiary)" }}>
                AI modes allowed:
              </span>
              {allowedModes.map((m) => (
                <span key={m} className="chip chip-cyan">
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="pt-6 text-center text-xs"
              style={{ color: "var(--text-tertiary)", borderTop: "1px solid var(--border-default)" }}>
        {variant === "public"
          ? "Read-only session report · generated by "
          : "Generated by "}
        <span translate="no" className="font-semibold" style={{ color: "var(--text-secondary)" }}>
          Buildscore
        </span>
        {shareUrl && variant === "public" && (
          <span className="ml-2 font-mono tabular">{shareUrl}</span>
        )}
      </footer>
    </div>
  );
}
