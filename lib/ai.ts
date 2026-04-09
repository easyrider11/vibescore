import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAIConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const mode = process.env.AI_MODE ?? "mock";
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
  const isReal = mode === "real" && !!apiKey;

  return { apiKey, mode, model, isReal };
}

export function getAnthropicClient(): Anthropic {
  const { apiKey, isReal } = getAIConfig();
  if (!isReal || !apiKey) {
    throw new Error("Anthropic API key not configured. Set ANTHROPIC_API_KEY and AI_MODE=real.");
  }
  if (!_client) {
    _client = new Anthropic({ apiKey });
  }
  return _client;
}
