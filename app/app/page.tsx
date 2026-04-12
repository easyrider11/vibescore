import Link from "next/link";
import { getCurrentUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { SessionsTable } from "../../components/SessionsTable";
import { parseJsonOr } from "../../lib/json";

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const scenarios = await prisma.scenario.findMany({ orderBy: { createdAt: "asc" } });
  const sessions = await prisma.interviewSession.findMany({
    where: { createdById: user.id },
    include: { scenario: true, rubricScores: true },
    orderBy: { createdAt: "desc" },
  });

  const activeCount = sessions.filter(s => s.status === "active").length;
  const pendingCount = sessions.filter(s => s.status === "pending").length;

  const sessionsData = sessions.map((s) => ({
    id: s.id,
    candidateName: s.candidateName || "Anonymous",
    candidateEmail: s.candidateEmail || "",
    position: s.position || "",
    scenarioTitle: s.scenario.title,
    scenarioSlug: s.scenario.slug,
    status: s.status,
    publicToken: s.publicToken,
    durationMinutes: s.durationMinutes,
    createdAt: s.createdAt.toISOString(),
    startedAt: s.startedAt?.toISOString() || null,
    endedAt: s.endedAt?.toISOString() || null,
    score: s.rubricScores.length > 0 ? JSON.stringify(s.rubricScores[0].scores) : null,
    decision: s.rubricScores.length > 0 ? s.rubricScores[0].decision : null,
  }));

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Header band */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Sessions
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {sessions.length} total
            </span>
            {activeCount > 0 && (
              <span className="chip chip-green">{activeCount} active</span>
            )}
            {pendingCount > 0 && (
              <span className="chip chip-blue">{pendingCount} pending</span>
            )}
          </div>
        </div>
        <Link href="/app/new-session" className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Session
        </Link>
      </div>

      {/* Sessions table — primary content */}
      <SessionsTable sessions={sessionsData} />

      {/* Scenario library — secondary */}
      <section>
        <div className="section-header">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Scenario Library</h2>
          <span className="section-count">{scenarios.length}</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => {
            const aiPolicy = parseJsonOr<{ allowedModes?: string[] }>(scenario.aiPolicy, {});
            const aiModes = aiPolicy.allowedModes || [];
            const scenarioSessions = sessions.filter(s => s.scenarioId === scenario.id).length;

            return (
              <div key={scenario.id} className="card p-4 flex flex-col gap-3">
                <div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                    {scenario.title}
                  </h3>
                  <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {scenario.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {scenario.timeLimitMin && (
                    <span className="chip chip-muted">
                      <svg className="w-3 h-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {scenario.timeLimitMin}m
                    </span>
                  )}
                  {aiModes.map((mode) => (
                    <span key={mode} className="chip chip-cyan">{mode}</span>
                  ))}
                  {scenarioSessions > 0 && (
                    <span className="chip chip-muted">{scenarioSessions} used</span>
                  )}
                </div>

                <Link href="/app/new-session" className="btn btn-ghost btn-xs mt-auto self-start">
                  Use Template
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
