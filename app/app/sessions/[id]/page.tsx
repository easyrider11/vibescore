import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { RubricForm } from "../../../../components/RubricForm";
import { DiffViewer } from "../../../../components/DiffViewer";
import { AIGradePanel } from "../../../../components/AIGradePanel";
import { parseJsonOr } from "../../../../lib/json";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const session = await prisma.interviewSession.findFirst({
    where: { id, createdById: user.id },
    include: { scenario: true, events: true, submissions: true, rubricScores: true, aiGrade: true },
  });

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Session not found</h2>
          <Link href="/app" className="btn btn-ghost btn-sm mt-4">Back to sessions</Link>
        </div>
      </div>
    );
  }

  const sortedEvents = session.events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const aiEvents = sortedEvents.filter((event) => event.type === "AI_CHAT");
  const lastTest = [...sortedEvents].reverse().find((event) => event.type === "RUN_TESTS");
  const aiPolicy = parseJsonOr<{ allowedModes?: string[] }>(session.scenario.aiPolicy, {});
  const aiModes = aiPolicy.allowedModes || [];
  const scenarioTasks = parseJsonOr<string[]>(session.scenario.tasks, []);
  const scenarioEvaluationPoints = parseJsonOr<string[]>(session.scenario.evaluationPoints, []);
  const lastTestPayload = parseJsonOr<{ stdout?: string }>(lastTest?.payload, {});

  // AI Analytics
  const aiPayloads = aiEvents.map((e) => parseJsonOr<{ mode?: string; question?: string; response?: string; tokensUsed?: number; responseTimeMs?: number; mocked?: boolean }>(e.payload, {}));
  const aiModeBreakdown: Record<string, number> = {};
  for (const p of aiPayloads) {
    const mode = p.mode || "unknown";
    aiModeBreakdown[mode] = (aiModeBreakdown[mode] || 0) + 1;
  }
  const totalTokens = aiPayloads.reduce((sum, p) => sum + (p.tokensUsed || 0), 0);
  const fileOpenEvents = sortedEvents.filter((e) => e.type === "OPEN_FILE");
  const uniqueFilesViewed = new Set(fileOpenEvents.map((e) => parseJsonOr<{ path?: string }>(e.payload, {}).path)).size;

  const statusChip = {
    pending: "chip-blue",
    active: "chip-green",
    completed: "chip-muted",
    cancelled: "chip-red",
  }[session.status] || "chip-muted";

  const duration = session.startedAt && session.endedAt
    ? Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000)
    : null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* ── Summary band ── */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/app" className="text-xs" style={{ color: "var(--text-tertiary)" }}>Sessions</Link>
            <span style={{ color: "var(--text-tertiary)" }}>/</span>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{session.candidateName || "Unnamed"}</span>
          </div>
          <h1 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {session.scenario.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`chip ${statusChip}`}>{session.status}</span>
            {session.candidateName && (
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{session.candidateName}</span>
            )}
            {session.candidateEmail && (
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{session.candidateEmail}</span>
            )}
            {session.position && (
              <span className="chip chip-muted">{session.position}</span>
            )}
            {duration !== null && (
              <span className="chip chip-muted">{duration}m spent</span>
            )}
            <span className="chip chip-muted">{session.durationMinutes}m limit</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/app/sessions/${session.id}/live`} className="btn btn-ghost btn-sm">Live View</Link>
          <Link href={`/app/sessions/${session.id}/report`} className="btn btn-primary btn-sm">View Report</Link>
          <Link href={`/s/${session.publicToken}`} className="btn btn-ghost btn-sm">Candidate Link</Link>
          <a href={`/api/export?sessionId=${session.id}`} className="btn btn-ghost btn-sm">Export JSON</a>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Events", value: sortedEvents.length, cls: "chip-muted" },
          { label: "AI Queries", value: aiEvents.length, cls: "chip-purple" },
          { label: "Files Viewed", value: uniqueFilesViewed, cls: "chip-blue" },
          { label: "Submissions", value: session.submissions.length, cls: "chip-green" },
          { label: "Tokens Used", value: totalTokens > 0 ? totalTokens.toLocaleString() : "N/A", cls: "chip-orange" },
        ].map((stat) => (
          <div key={stat.label} className="card p-3">
            <div className="text-lg font-semibold font-mono" style={{ color: "var(--text-primary)" }}>{stat.value}</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Main content: Evidence + Rubric ── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Evidence blocks */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* ─ Behavioral Evidence ─ */}
          <div className="section-header">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Behavioral Evidence</h2>
          </div>

          {/* Timeline */}
          <div className="evidence-block">
            <div className="evidence-block-header">
              <span>Timeline</span>
              <span className="chip chip-muted">{sortedEvents.length} events</span>
            </div>
            <div className="evidence-block-body max-h-64 overflow-auto ide-scrollbar">
              {sortedEvents.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No events recorded.</p>
              ) : (
                <div className="space-y-1">
                  {sortedEvents.map((event) => {
                    const typeColor: Record<string, string> = {
                      AI_CHAT: "chip-purple",
                      RUN_TESTS: "chip-orange",
                      SUBMIT: "chip-green",
                      START_SESSION: "chip-blue",
                      OPEN_FILE: "chip-cyan",
                      CLARIFICATION_NOTES: "chip-muted",
                    };
                    return (
                      <div key={event.id} className="flex items-center gap-3 py-1">
                        <span className={`chip ${typeColor[event.type] || "chip-muted"} shrink-0`} style={{ minWidth: 90, justifyContent: "center" }}>
                          {event.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                        </span>
                        <span className="text-xs font-mono tabular" style={{ color: "var(--text-tertiary)" }}>
                          {event.createdAt.toLocaleTimeString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* AI History */}
          <div className="evidence-block">
            <div className="evidence-block-header">
              <span>AI Interactions</span>
              <div className="flex items-center gap-2">
                {Object.entries(aiModeBreakdown).map(([mode, count]) => (
                  <span key={mode} className="chip chip-purple">{mode}: {count}</span>
                ))}
              </div>
            </div>
            <div className="evidence-block-body max-h-[500px] overflow-auto ide-scrollbar">
              {aiEvents.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No AI interactions recorded.</p>
              ) : (
                <div className="space-y-3">
                  {aiEvents.map((event, idx) => {
                    const payload = parseJsonOr<{ mode?: string; question?: string; response?: string }>(event.payload, {});
                    return (
                      <div key={event.id} className="pane-surface p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="chip chip-purple">{String(payload.mode || "")}</span>
                          <span className="text-[10px] font-mono" style={{ color: "var(--text-tertiary)" }}>
                            #{idx + 1} &middot; {event.createdAt.toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                          {String(payload.question || "")}
                        </p>
                        <div className="pane-inset p-3 text-xs whitespace-pre-wrap leading-relaxed"
                             style={{ color: "var(--text-secondary)" }}>
                          {String(payload.response || "")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ─ Delivery Evidence ─ */}
          <div className="section-header mt-6">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Delivery Evidence</h2>
          </div>

          {/* Test Output */}
          <div className="evidence-block">
            <div className="evidence-block-header">
              <span>Test Output</span>
              {lastTest && (
                <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                  {lastTest.createdAt.toLocaleTimeString()}
                </span>
              )}
            </div>
            <div className="evidence-block-body">
              {lastTest ? (
                <div className="pane-inset p-3 text-xs font-mono whitespace-pre-wrap"
                     style={{ color: "var(--text-primary)" }}>
                  {String(lastTestPayload.stdout || "(no output)")}
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No test runs recorded.</p>
              )}
            </div>
          </div>

          {/* Submissions */}
          <div className="evidence-block">
            <div className="evidence-block-header">
              <span>Submissions</span>
              <span className="chip chip-muted">{session.submissions.length}</span>
            </div>
            <div className="evidence-block-body space-y-4">
              {session.submissions.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No submissions yet.</p>
              ) : (
                session.submissions.map((submission, idx) => (
                  <div key={submission.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="chip chip-green">Snapshot #{idx + 1}</span>
                      <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                        {submission.createdAt.toLocaleTimeString()}
                      </span>
                    </div>
                    {submission.clarificationNotes && (
                      <div className="pane-surface p-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                        <span className="font-semibold" style={{ color: "var(--accent-orange)" }}>Notes: </span>
                        {submission.clarificationNotes}
                      </div>
                    )}
                    <DiffViewer diffText={submission.diffText || ""} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Scenario context (collapsed reference) */}
          <details className="evidence-block">
            <summary className="evidence-block-header cursor-pointer select-none">
              <span>Scenario Reference</span>
              <div className="flex items-center gap-1.5">
                {aiModes.map((m) => <span key={m} className="chip chip-cyan">{m}</span>)}
                {session.scenario.timeLimitMin && <span className="chip chip-muted">{session.scenario.timeLimitMin}m</span>}
              </div>
            </summary>
            <div className="evidence-block-body space-y-3">
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{session.scenario.background}</p>
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Tasks</h4>
                <ul className="text-xs list-disc pl-4 space-y-0.5" style={{ color: "var(--text-secondary)" }}>
                  {scenarioTasks.map((t) => <li key={t}>{t}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-tertiary)" }}>Evaluation Criteria</h4>
                <ul className="text-xs list-disc pl-4 space-y-0.5" style={{ color: "var(--text-secondary)" }}>
                  {scenarioEvaluationPoints.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
            </div>
          </details>
        </div>

        {/* ── Sticky rubric sidebar (wide) / below (narrow) ── */}
        <div className="w-full lg:w-[360px] shrink-0">
          <div className="sticky-rubric space-y-4">

            {/* AI Grade panel */}
            <AIGradePanel sessionId={session.id} aiGrade={session.aiGrade} />

            {/* Manual evaluation */}
            <div className="evidence-block">
              <div className="evidence-block-header">
                <span>Manual Evaluation</span>
                {session.rubricScores.length > 0 && (
                  <span className="chip chip-green">Scored</span>
                )}
              </div>
              <div className="evidence-block-body">
                <RubricForm sessionId={session.id} />
                {session.rubricScores.length > 0 && (
                  <p className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>
                    {session.rubricScores.length} evaluation{session.rubricScores.length !== 1 ? "s" : ""} saved.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
