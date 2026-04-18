interface DiffViewerProps {
  diffText: string;
}

export function DiffViewer({ diffText }: DiffViewerProps) {
  if (!diffText.trim()) {
    return <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>(no diff)</div>;
  }

  const lines = diffText.split("\n");
  const additions = lines.filter((line) => line.startsWith("+") && !line.startsWith("+++")).length;
  const deletions = lines.filter((line) => line.startsWith("-") && !line.startsWith("---")).length;

  return (
    <div className="pane-inset p-3 text-xs font-mono overflow-x-auto">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-sans">
        <span className="chip chip-green">{additions} addition{additions === 1 ? "" : "s"}</span>
        <span className="chip chip-red">{deletions} deletion{deletions === 1 ? "" : "s"}</span>
      </div>
      {lines.map((line, idx) => {
        let className = "";
        let color = "var(--text-secondary)";
        if (line.startsWith("+++")) {
          color = "var(--accent-green)";
          className = "text-emerald";
        } else if (line.startsWith("---")) {
          color = "var(--accent-red)";
          className = "text-rose";
        } else if (line.startsWith("+")) {
          color = "#7ee787";
          className = "text-emerald";
        } else if (line.startsWith("-")) {
          color = "#ffa198";
          className = "text-rose";
        } else if (line.startsWith("@")) {
          color = "var(--accent-orange)";
          className = "text-amber";
        }

        return (
          <div key={`${idx}-${line}`} className={className} style={{ color }}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
