interface DiffViewerProps {
  diffText: string;
}

export function DiffViewer({ diffText }: DiffViewerProps) {
  if (!diffText.trim()) {
    return <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>(no diff)</div>;
  }

  const lines = diffText.split("\n");

  return (
    <div className="pane-inset p-3 text-xs font-mono overflow-x-auto">
      {lines.map((line, idx) => {
        let color = "var(--text-secondary)";
        if (line.startsWith("+++")) color = "var(--accent-green)";
        else if (line.startsWith("---")) color = "var(--accent-red)";
        else if (line.startsWith("+")) color = "#7ee787";
        else if (line.startsWith("-")) color = "#ffa198";
        else if (line.startsWith("@")) color = "var(--accent-orange)";

        return (
          <div key={`${idx}-${line}`} style={{ color }}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
