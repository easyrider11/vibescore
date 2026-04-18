# AI-native debugging: agent tool loop

You are on-call for a small LLM agent product. Customers report two bugs:

1. **Runaway loop.** Some conversations keep calling tools forever — the cost
   dashboard shows sessions that spent $40 in a single request. The max-steps
   guard does not appear to fire.
2. **Stale answers.** When a tool returns fresh data, the final assistant
   message sometimes ignores it and repeats a previous turn's answer.

You have:
- `lib/agent.js` — the core tool-calling loop (the loop body is where most of
  the bugs live). The model itself is mocked in `lib/mock-model.js`.
- `lib/tools.js` — a tiny tool registry (`search_docs`, `get_order_status`).
- `tests/agent.test.js` — failing tests that describe the expected behavior.
- `api/run-agent.js` — the HTTP handler that stitches everything together.

Your task:
- Read `lib/agent.js` and diagnose both bugs.
- Fix the loop so it terminates and so tool outputs propagate into the
  final response.
- Explain the fix and what you would add next (evals, tracing, cost guard).

Helpful commands:
- `node tests/agent.test.js`
- `node -e "require('./api/run-agent').run({query:'where is order 42'}).then(console.log)"`
