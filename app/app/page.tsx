import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { TopBar } from "../../components/TopBar";
import { ScenarioGrid } from "../../components/ScenarioGrid";

export default async function RecruiterHome() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const scenarios = await prisma.scenario.findMany({ orderBy: { createdAt: "asc" } });
  const sessions = await prisma.interviewSession.findMany({
    where: { createdById: user.id },
    include: { scenario: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-8 py-12">
      <TopBar title="Interviewer Console" subtitle={`Signed in as ${user.email}`} />

      <div className="flex flex-wrap gap-3">
        <Link className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold" href="/api/logout">
          Sign out
        </Link>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Scenario Library</h2>
        <ScenarioGrid scenarios={scenarios} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Recent Sessions</h2>
        {sessions.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">No sessions yet.</div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="card p-5 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-ink">{session.scenario.title}</div>
                <div className="text-xs text-slate-500">Token: {session.publicToken}</div>
              </div>
              <Link className="text-sm font-semibold text-accent" href={`/app/sessions/${session.id}`}>
                View
              </Link>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
