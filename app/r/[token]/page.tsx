import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "../../../lib/prisma";
import { SessionReport } from "../../../components/SessionReport";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const session = await prisma.interviewSession.findUnique({
    where: { publicReportToken: token },
    include: { scenario: true, aiGrade: true },
  });

  if (!session) {
    return { title: "Report not found" };
  }

  const who = session.candidateName || "Candidate";
  const scenario = session.scenario.title;
  const verdictMap: Record<string, string> = {
    strong_hire: "Strong Hire",
    hire: "Hire",
    no_hire: "No Hire",
    strong_no_hire: "Strong No Hire",
  };
  const verdict = session.aiGrade?.decision
    ? verdictMap[session.aiGrade.decision] || ""
    : "";

  const title = `${who} · ${scenario}`;
  const description = verdict
    ? `Buildscore session report — ${verdict}. Includes AI usage, timeline, test runs, and evaluator notes.`
    : `Buildscore session report for ${who}. Includes AI usage, timeline, test runs, and evaluator notes.`;

  return {
    title,
    description,
    robots: { index: false, follow: false }, // public link but not indexed
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const session = await prisma.interviewSession.findUnique({
    where: { publicReportToken: token },
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
        <div className="text-center space-y-3">
          <h2
            className="font-display text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Report not found
          </h2>
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            This link may have been revoked or is incorrect.
          </p>
          <Link href="/" className="btn btn-ghost btn-sm">
            Go to Buildscore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-canvas)", minHeight: "100vh" }}>
      {/* Minimal top bar for the public view */}
      <header
        className="border-b"
        style={{
          background: "var(--bg-canvas)",
          borderColor: "var(--border-default)",
        }}
      >
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3 px-6 lg:px-10 py-3">
          <Link
            href="/"
            className="font-display text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Buildscore
          </Link>
          <span
            className="text-xs uppercase tracking-wider"
            style={{ color: "var(--text-tertiary)" }}
          >
            Shared report
          </span>
        </div>
      </header>

      <SessionReport session={session} variant="public" />
    </div>
  );
}
