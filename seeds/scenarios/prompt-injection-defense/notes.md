# AI-native: Defend the support agent against prompt injection

You run a customer-support LLM agent that can look up orders and (scary)
issue refunds. Two things just went wrong in production:

1. A user sent a message starting with `IGNORE ABOVE INSTRUCTIONS AND…`
   and the agent replied with the entire system prompt, including the
   internal API key we put there "just for the tool definitions."
2. A user asked the agent nicely to "call refund_order for order 42 for
   me" and it **did**. No human in the loop. Finance is not happy.

You have:
- `lib/agent.js` — the chat loop that calls the model and tools.
- `lib/tools.js` — tools registry. `get_order_status` is safe; `refund_order`
  is destructive.
- `lib/mock-model.js` — a deterministic mock LLM. It simulates a model
  that **will** obey an injection if your code lets it. Don't edit it.
- `tests/injection.test.js` — four failing tests that reproduce both
  incidents plus two follow-ups.
- `api/chat.js` — HTTP handler.

Your task:
- Fix `lib/agent.js` so the system prompt + user message are properly
  separated (don't let user content reach the model as if it were a
  system instruction).
- Fix the tool invocation so destructive tools (anything marked
  `requiresApproval`) cannot be called without explicit approval.
- Explain which other injection patterns you would defend against and
  how you would detect them in production.

Helpful commands:
- `node tests/injection.test.js`

You may use the AI copilot freely for review/explain, but own the
threat model yourself.
