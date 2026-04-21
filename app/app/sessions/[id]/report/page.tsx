import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { SessionReport } from "../../../../../components/SessionReport";
import { ShareReportButton } from "../../../../../components/ShareReportButton";

export default async function SessionReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const session = await prisma.interviewSession.findFirst({
    where: { id, createdById: user.id },
    include: {
      scenario: true,
      events: true,
      submissions: true,
      rubricScores: true,
      aiGrade: true,
    },
  });

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Session not found
          </h2>
          <Link href="/app" className="btn btn-ghost btn-sm mt-4">
            Back to sessions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div
        className="sticky top-0 z-10 border-b"
        style={{
          background: "var(--bg-canvas)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3 px-6 lg:px-10 py-3">
          <div className="flex items-center gap-2 text-xs">
            <Link
              href={`/app/sessions/${session.id}`}
              style={{ color: "var(--text-tertiary)" }}
            >
              ← Back to session
            </Link>
            <span style={{ color: "var(--text-tertiary)" }}>/</span>
            <span style={{ color: "var(--text-secondary)" }}>Report</span>
          </div>
          <ShareReportButton
            sessionId={session.id}
            initialToken={session.publicReportToken}
          />
        </div>
      </div>

      <SessionReport session={session} variant="authenticated" />
    </div>
  );
}
