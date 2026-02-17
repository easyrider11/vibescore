import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { TopBar } from "../../../../components/TopBar";
import { RubricForm } from "../../../../components/RubricForm";
import { DiffViewer } from "../../../../components/DiffViewer";

export default async function SessionDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const session = await prisma.interviewSession.findFirst({
    where: { id: params.id, createdById: user.id },
    include: { scenario: true, events: true, submissions: true, rubricScores: true },
  });

  if (!session) return <main className="p-10">Session not found.</main>;

  const sortedEvents = session.events.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const aiEvents = sortedEvents.filter((event) => event.type === "AI_CHAT");

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-8 py-12">
      <TopBar title={session.scenario.title} subtitle={`Candidate link: /s/${session.publicToken}`} />

      <div className="flex flex-wrap gap-3">
        <Link className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold" href="/app">
          Back
        </Link>
        <Link className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white" href={`/s/${session.publicToken}`}>
          Open Candidate Link
        </Link>
      </div>

      <section className="card p-6 space-y-2">
        <h2 className="font-display text-lg font-semibold">Scenario Tasks</h2>
        <ul className="text-sm text-slate-600 list-disc pl-4">
          {(session.scenario.tasks as string[]).map((task) => (
            <li key={task}>{task}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Timeline</h2>
        {sortedEvents.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">No events yet.</div>
        ) : (
          <div className="card p-6 space-y-2 text-sm text-slate-600">
            {sortedEvents.map((event) => (
              <div key={event.id}>
                <span className="font-semibold">{event.type}</span> — {event.createdAt.toLocaleString()}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">AI Chat History</h2>
        {aiEvents.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">No AI interactions yet.</div>
        ) : (
          <div className="card p-6 space-y-3 text-sm">
            {aiEvents.map((event) => (
              <div key={event.id}>
                <div className="font-semibold">Q: {String((event.payload as any).question)}</div>
                <div className="text-slate-600">A: {String((event.payload as any).response)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Submissions</h2>
        {session.submissions.length === 0 ? (
          <div className="card p-6 text-sm text-slate-600">No submissions yet.</div>
        ) : (
          session.submissions.map((submission) => (
            <div key={submission.id} className="card p-6 space-y-3">
              <div className="text-sm text-slate-600">Submitted: {submission.createdAt.toLocaleString()}</div>
              <DiffViewer diffText={submission.diffText || ""} />
            </div>
          ))
        )}
      </section>

      <section className="card p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold">Rubric Scoring</h2>
        <RubricForm sessionId={session.id} />
        {session.rubricScores.length > 0 ? (
          <div className="text-xs text-slate-500">Rubric saved ({session.rubricScores.length}).</div>
        ) : null}
      </section>
    </main>
  );
}
