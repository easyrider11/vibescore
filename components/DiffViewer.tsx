interface DiffViewerProps {
  diffText: string;
}

export function DiffViewer({ diffText }: DiffViewerProps) {
  if (!diffText.trim()) {
    return <div className="text-xs text-slate-500">(no diff)</div>;
  }

  const lines = diffText.split("\n");

  return (
    <div className="rounded-md border border-slate-200 bg-slate-900 p-3 text-xs font-mono text-white">
      {lines.map((line, idx) => {
        let className = "text-slate-200";
        if (line.startsWith("+++")) className = "text-emerald-300";
        else if (line.startsWith("---")) className = "text-rose-300";
        else if (line.startsWith("+")) className = "text-emerald-200";
        else if (line.startsWith("-")) className = "text-rose-200";
        else if (line.startsWith("@")) className = "text-amber-200";

        return (
          <div key={`${idx}-${line}`} className={className}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
