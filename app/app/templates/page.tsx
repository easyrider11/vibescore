import { prisma } from "../../../lib/prisma";
import { parseJsonOr } from "../../../lib/json";

export default async function TemplatesPage() {
  const scenarios = await prisma.scenario.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Templates
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Interview scenario templates for your assessments
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((sc) => {
          const aiPolicy = parseJsonOr<{ allowedModes?: string[] }>(sc.aiPolicy, {});
          const tasks = parseJsonOr<string[]>(sc.tasks, []);
          return (
            <div
              key={sc.id}
              className="rounded-xl p-5 space-y-3 transition-colors"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {sc.title}
                </h3>
                {sc.timeLimitMin && (
                  <span
                    className="text-[10px] rounded-full px-2 py-0.5 font-medium"
                    style={{ background: "rgba(59,130,246,0.1)", color: "var(--accent-blue)" }}
                  >
                    {sc.timeLimitMin}m
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "var(--text-secondary)" }}>
                {sc.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{ background: "rgba(163,113,247,0.1)", color: "var(--accent-purple)" }}>
                  {sc.slug}
                </span>
                {tasks.length > 0 && (
                  <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{ background: "var(--bg-surface-alt)", color: "var(--text-tertiary)" }}>
                    {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                  </span>
                )}
                {aiPolicy.allowedModes && (
                  <span className="text-[10px] rounded-full px-2 py-0.5 font-medium" style={{ background: "rgba(63,185,80,0.1)", color: "var(--accent-green)" }}>
                    AI: {aiPolicy.allowedModes.length} modes
                  </span>
                )}
              </div>

              <div className="pt-2" style={{ borderTop: "1px solid var(--border-default)" }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-tertiary)" }}>
                  Tasks
                </div>
                <ul className="space-y-1">
                  {tasks.slice(0, 3).map((task, i) => (
                    <li key={i} className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>
                      <span className="text-accent-blue mr-1">{i + 1}.</span>
                      {typeof task === "string" ? task : String(task)}
                    </li>
                  ))}
                  {tasks.length > 3 && (
                    <li className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      +{tasks.length - 3} more...
                    </li>
                  )}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {scenarios.length === 0 && (
        <div className="text-center py-16" style={{ color: "var(--text-tertiary)" }}>
          <p className="text-sm">No templates found. Seed the database to add templates.</p>
        </div>
      )}
    </div>
  );
}
