export type Decision = "strong_hire" | "hire" | "no_hire" | "strong_no_hire";

export const DECISION_LABELS: Record<Decision, string> = {
  strong_hire: "Strong Hire",
  hire: "Hire",
  no_hire: "No Hire",
  strong_no_hire: "Strong No Hire",
};

export const DECISION_CHIP_CLASSES: Record<Decision, string> = {
  strong_hire: "chip-green",
  hire: "chip-blue",
  no_hire: "chip-orange",
  strong_no_hire: "chip-red",
};

export const DECISION_HEX: Record<Decision, string> = {
  strong_hire: "#3fb950",
  hire: "#3b82f6",
  no_hire: "#d29922",
  strong_no_hire: "#f85149",
};

export const RUBRIC_LABELS: Record<string, string> = {
  repo_understanding: "Repo Understanding",
  requirement_clarity: "Requirement Clarity",
  delivery_quality: "Delivery Quality",
  architecture_tradeoffs: "Architecture Tradeoffs",
  ai_usage_quality: "AI Usage Quality",
};
