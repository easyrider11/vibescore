import Link from "next/link";
import { getCurrentUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { SessionsTable } from "../../components/SessionsTable";

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const scenarios = await prisma.scenario.findMany({ orderBy: { createdAt: "asc" } });
  const sessions = await prisma.interviewSession.findMany({
    where: { createdById: user.id },
    include: { scenario: true, rubricScores: true },
    orderBy: { createdAt: "desc" },
  });

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
    score: s.rubricScores.length > 0 ? s.rubricScores[0].scores : null,
    decision: s.rubricScores.length > 0 ? s.rubricScores[0].decision : null,
  }));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Sessions
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Manage interview sessions and review candidates
          </p>
        </div>
        <Link
          href="/app/new-session"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--accent-blue)" }}
        >
          + New Session
        </Link>
      </div>

      <SessionsTable sessions={sessionsData} />
    </div>
  );
}
