// Deterministic mock of an LLM. Given a transcript, it returns either a
// tool call or a final answer. Candidates must NOT edit this file — it is
// the "model" and is what the agent loop must work against.

function nextTurn(messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const toolResults = messages.filter((m) => m.role === "tool");
  const text = (lastUser && lastUser.content) || "";
  const lower = text.toLowerCase();

  const orderMatch = lower.match(/order\s+(\d+)/);
  if (orderMatch) {
    const orderId = Number(orderMatch[1]);
    const already = toolResults.find(
      (m) => m.name === "get_order_status" && m.content.includes(`order ${orderId}:`),
    );
    if (!already) {
      return { type: "tool_call", name: "get_order_status", args: { orderId } };
    }
    return {
      type: "final",
      content: `Looked it up: ${already.content}`,
    };
  }

  if (lower.includes("refund") || lower.includes("shipping")) {
    const already = toolResults.find((m) => m.name === "search_docs");
    if (!already) {
      return {
        type: "tool_call",
        name: "search_docs",
        args: { query: lower.includes("refund") ? "refund" : "shipping" },
      };
    }
    return { type: "final", content: `From docs: ${already.content}` };
  }

  return { type: "final", content: "I don't know how to help with that." };
}

module.exports = { nextTurn };
