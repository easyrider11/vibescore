export const AI_NATIVE_SLUGS = new Set([
  "agent-loop-fix",
  "prompt-injection-defense",
  "rag-retrieval-miss",
]);

export function isAiNativeSlug(slug: string | undefined | null): boolean {
  if (!slug) return false;
  return AI_NATIVE_SLUGS.has(slug);
}
