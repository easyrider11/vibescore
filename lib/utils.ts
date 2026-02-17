export function createPublicId(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function calcOverallScore(rubric: {
  code_quality: number;
  problem_solving_efficiency: number;
  architecture_thinking: number;
  communication_clarity: number;
}) {
  return Math.round(
    (rubric.code_quality +
      rubric.problem_solving_efficiency +
      rubric.architecture_thinking +
      rubric.communication_clarity) /
      4 *
      10
  );
}
