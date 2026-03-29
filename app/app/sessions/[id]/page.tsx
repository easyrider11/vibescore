import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { TopBar } from "../../../../components/TopBar";
import { RubricForm } from "../../../../components/RubricForm";
import { DiffViewer } from "../../../../components/DiffViewer";
import { parseJsonOr } from "../../../../lib/json";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const session = await prisma.interviewSession.findFirst({
    where: { id, createdById: user.id },
    include: { scenario: true, events: true, submissions: true, rubricScores: true },
  });

  if (!session) return <main className="p-10">Session not found.</main>;

  const sortedEvents = session.events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const aiEvents = sortedEvents.filter((event) => event.type === "AI_CHAT");
  const lastTest = [...sortedEvents].reverse().find((event) => event.type === "RUN_TESTS");
  const aiPolicy = parseJsonOr<{ allowedModes?: string[] }>(session.scenario.aiPolicy, {});
  const aiModes = aiPolicy.allowedModes || [];
  const scenarioTasks = parseJsonOr<string[]>(session.scenario.tasks, []);
  const scenarioHints = parseJsonOr<string[]>(session.scenario.hints, []);
  const scenarioEvaluationPoints = parseJsonOr<string[]>(session.scenario.evaluationPoints, []);
  const lastTestPayload = parseJsonOr<{ stdout?: string }>(lastTest?.payload, {});

  // AI Analytics
  const aiModeBreakdown: Record<string, number> = {};
  const aiPayloads = aiEvents.map((e) => parseJsonOr<{ mode?: string; question?: string; response?: string; tokensUsed?: number; responseTimeMs?: number }>(e.payload, {}));
  for (const p of aiPayloads) {
    const mode = p.mode || "unknown";
    aiModeBreakdown[mode] = (aiModeBreakdown[mode] || 0) + 1;
  }
  const totalTokens = aiPayloads.reduce((sum, p) => sum + (p.tokensUsed || 0), 0);
  const avgResponseTime = aiPayloads.length > 0
    ? Math.round(aiPayloads.reduce((sum, p) => sum + (p.responseTimeMs || 0), 0) / aiPayloads.length)
    : 0;
  const fileOpenEvents = sortedEvents.filter((e) => e.type === "OPEN_FILE");
  const uniqueFilesViewed = new Set(fileOpenEvents.map((e) => parseJsonOr<{ path?: string }>(e.payload, {}).path)).size;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-8 py-12">
      <TopBar title={session.scenario.title} subtitle={`Candidate link: /s/${session.publicToken}`} />

      <div className="flex flex-wrap gap-3">
        <Link className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors" href="/app">
          Back
        </Link>
        <Link className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity" href={`/app/sessions/${session.id}/live`}>
          Live Observation
        </Link>
        <Link className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/90 transition-colors" href={`/s/${session.publicToken}`}>
          Open Candidate Link
        </Link>
        <a className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50 transition-colors" href={`/api/export?sessionId=${session.id}`}>
          Export JSON
        </a>
      </div>

      {/* AI Analytics Summary */}
      <section className="card p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold">AI Usage Analytics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total AI Queries", value: aiEvents.length, accent: "text-purple-600" },
            { label: "Files Explored", value: uniqueFilesViewed, accent: "text-blue-600" },
            { label: "Total Tokens", value: totalTokens > 0 ? totalTokens.toLocaleString() : "N/A", accent: "text-orange-600" },
            { label: "Avg Response (ms)", value: avgResponseTime > 0 ? avgResponseTime : "N/A", accent: "text-green-600" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-slate-50 p-3">
              <div className={`text-2xl font-semibold font-mono ${stat.accent}`}>{stat.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
        {Object.keys(aiModeBreakdown).length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Mode Breakdown</h3>
            <div className="flex gap-2">
              {Object.entries(aiModeBreakdown).map(([mode, count]) => (
                <span key={mode} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                  {mode}: {count}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="card p-6 space-y-2">
        <h2 className="font-display text-lg font-semibold">Scenario Context</h2>
        <p className="text-sm text-slate-600">{session.scenario.background}</p>
        <div className="text-xs text-slate-500">Time limit: {session.scenario.timeLimitMin || "N/A"} min</div>
        <h3 className="text-sm font-semibold">Tasks</h3>
        <ul className="text-sm text-slate-600 list-disc pl-4">
          {scenarioTasks.map((task) => <li key={task}>{task}</li>)}
        </ul>
        <h3 className="text-sm font-semibold">Hints</h3>
        <ul className="text-sm text-slate-600 list-disc pl-4">
          {scenarioHints.map((hint) => <li key={hint}>{hint}</li>)}
        </ul>
        <h3 className="text-sm font-semibold">Evaluation Points</h3>
        <ul className="text-sm text-slate-600 list-disc pl-4">
          {scenarioEvaluationPoints.map((point) => <li key={point}>{point}</li>)}
        </ul>
        <div className="text-xs text-slate-500">AI policy: {aiModes.join(", ") || "N/A"}</div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Timeline ({sortedEvents.length} events)</h2>
        {sortedEvents.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">No events yet.</div>
        ) : (
          <div className="card p-6 space-y-2 text-sm text-slate-600 max-h-96 overflow-auto">
            {sortedEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between">
                <span>
                  <span className="inline-block w-32 font-semibold text-xs font-mono">{event.type}</span>
                  <span className="text-xs text-slate-400 ml-2">{event.createdAt.toLocaleString()}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">AI Chat History ({aiEvents.length})</h2>
        {aiEvents.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">No AI interactions yet.</div>
        ) : (
          <div className="card p-6 space-y-4 text-sm max-h-[500px] overflow-auto">
            {aiEvents.map((event) => {
              const payload = parseJsonOr<{ mode?: string; question?: string; response?: string }>(event.payload, {});
              return (
                <div key={event.id} className="rounded-lg bg-slate-50 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                      {String(payload.mode || "")}
                    </span>
                    <span className="text-xs text-slate-400">{event.createdAt.toLocaleString()}</span>
                  </div>
                  <div className="font-medium text-slate-800">Q: {String(payload.question || "")}</div>
                  <div className="text-slate-600 whitespace-pre-wrap text-xs leading-relaxed border-t border-slate-200 pt-2">
                    {String(payload.response || "")}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Test Output</h2>
        {lastTest ? (
          <div className="card p-6 text-xs text-slate-600 whitespace-pre-wrap font-mono">
            {String(lastTestPayload.stdout || "")}
          </div>
        ) : (
          <div className="card p-6 text-sm text-slate-600">No test runs yet.</div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Submissions ({session.submissions.length})</h2>
        {session.submissions.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">No submissions yet.</div>
        ) : (
          session.submissions.map((submission) => (
            <div key={submission.id} className="card p-6 space-y-3">
              <div className="text-sm text-slate-600">Submitted: {submission.createdAt.toLocaleString()}</div>
              {submission.clarificationNotes ? (
                <div className="text-xs text-slate-500 whitespace-pre-wrap bg-amber-50 rounded-lg p-3 border border-amber-200">
                  Notes: {submission.clarificationNotes}
                </div>
              ) : null}
              <DiffViewer diffText={submission.diffText || ""} />
            </div>
          ))
        )}
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold">Evaluation</h2>
        <RubricForm sessionId={session.id} />
        {session.rubricScores.length > 0 ? (
          <div className="text-xs text-slate-500">Evaluation saved ({session.rubricScores.length}).</div>
        ) : null}
      </section>
    </main>
  );
}
