import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await prisma.interviewSession.findMany({
    where: { createdById: user.id },
    include: {
      events: { select: { type: true } },
      submissions: { select: { id: true } },
      rubricScores: { select: { scores: true, decision: true } },
      scenario: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // ─── Aggregate stats ───
  const total = sessions.length;
  const byStatus = { pending: 0, active: 0, completed: 0, cancelled: 0 };
  const byDecision: Record<string, number> = {};
  const byScenario: Record<string, { title: string; count: number; completed: number }> = {};
  let totalDurationMin = 0;
  let completedWithDuration = 0;
  let totalAiQueries = 0;
  let totalEvents = 0;
  let totalSubmissions = 0;
  const rubricAverages: Record<string, { sum: number; count: number }> = {};

  // Weekly trend (last 8 weeks)
  const now = new Date();
  const weeklyData: { week: string; count: number; completed: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const label = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    const inWeek = sessions.filter(
      (s) => new Date(s.createdAt) >= weekStart && new Date(s.createdAt) < weekEnd,
    );
    weeklyData.push({
      week: label,
      count: inWeek.length,
      completed: inWeek.filter((s) => s.status === "completed").length,
    });
  }

  for (const s of sessions) {
    // Status
    byStatus[s.status as keyof typeof byStatus] =
      (byStatus[s.status as keyof typeof byStatus] || 0) + 1;

    // Scenario breakdown
    const slug = s.scenario.slug;
    if (!byScenario[slug]) byScenario[slug] = { title: s.scenario.title, count: 0, completed: 0 };
    byScenario[slug].count++;
    if (s.status === "completed") byScenario[slug].completed++;

    // Duration
    if (s.startedAt && s.endedAt) {
      totalDurationMin +=
        (new Date(s.endedAt).getTime() - new Date(s.startedAt).getTime()) / 60000;
      completedWithDuration++;
    }

    // Events
    totalEvents += s.events.length;
    totalAiQueries += s.events.filter((e) => e.type === "ai_query").length;

    // Submissions
    totalSubmissions += s.submissions.length;

    // Rubric scores
    for (const rs of s.rubricScores) {
      // Decision
      if (rs.decision) {
        byDecision[rs.decision] = (byDecision[rs.decision] || 0) + 1;
      }
      // Dimension averages
      const scores = rs.scores as Record<string, number> | null;
      if (scores && typeof scores === "object") {
        for (const [dim, val] of Object.entries(scores)) {
          if (typeof val === "number") {
            if (!rubricAverages[dim]) rubricAverages[dim] = { sum: 0, count: 0 };
            rubricAverages[dim].sum += val;
            rubricAverages[dim].count++;
          }
        }
      }
    }
  }

  const rubricDimensions = Object.fromEntries(
    Object.entries(rubricAverages).map(([k, v]) => [
      k,
      Math.round((v.sum / v.count) * 10) / 10,
    ]),
  );

  return NextResponse.json({
    total,
    byStatus,
    byDecision,
    byScenario: Object.values(byScenario),
    avgDurationMin: completedWithDuration > 0 ? Math.round(totalDurationMin / completedWithDuration) : null,
    totalAiQueries,
    totalEvents,
    totalSubmissions,
    rubricDimensions,
    weeklyTrend: weeklyData,
    passRate:
      (byDecision.strong_hire || 0) + (byDecision.hire || 0) > 0
        ? Math.round(
            (((byDecision.strong_hire || 0) + (byDecision.hire || 0)) /
              Object.values(byDecision).reduce((a, b) => a + b, 0)) *
              100,
          )
        : null,
  });
}
