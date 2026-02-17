export function simpleDiff(before: string, after: string) {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const max = Math.max(beforeLines.length, afterLines.length);
  const out: string[] = [];
  for (let i = 0; i < max; i += 1) {
    const b = beforeLines[i];
    const a = afterLines[i];
    if (b === a) {
      out.push(` ${b ?? ""}`);
    } else {
      if (b !== undefined) out.push(`-${b}`);
      if (a !== undefined) out.push(`+${a}`);
    }
  }
  return out.join("\n");
}

export function diffFiles(beforeMap: Record<string, string>, afterMap: Record<string, string>) {
  const paths = new Set([...Object.keys(beforeMap), ...Object.keys(afterMap)]);
  const chunks: string[] = [];
  for (const p of Array.from(paths).sort()) {
    const before = beforeMap[p] ?? "";
    const after = afterMap[p] ?? "";
    if (before === after) continue;
    chunks.push(`--- ${p}`);
    chunks.push(`+++ ${p}`);
    chunks.push(simpleDiff(before, after));
  }
  return chunks.join("\n");
}
