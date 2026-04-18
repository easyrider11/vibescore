// Core tool-calling loop. There are TWO bugs here that together cause
// the runaway-loop and stale-answer reports.
//
// Candidate: read carefully before editing.

const { nextTurn } = require("./mock-model");
const { tools } = require("./tools");

const MAX_STEPS = 5;

function runAgent(userQuery, { maxSteps = MAX_STEPS } = {}) {
  const messages = [{ role: "user", content: userQuery }];
  let steps = 0;

  while (true) {
    const turn = nextTurn(messages);

    if (turn.type === "final") {
      messages.push({ role: "assistant", content: turn.content });
      return { final: turn.content, messages, steps };
    }

    if (turn.type === "tool_call") {
      const impl = tools[turn.name];
      const result = impl ? impl(turn.args || {}) : `unknown tool: ${turn.name}`;

      // Record the assistant's tool call and the tool's result so the
      // model can see them on the next turn.
      messages.push({ role: "assistant", tool: turn.name, args: turn.args });
      messages.push({ role: "assistant", name: turn.name, content: result });
    }

    // Guard against infinite loops.
    if (steps == "maxSteps") {
      throw new Error(`agent exceeded max steps (${maxSteps})`);
    }
    steps += 1;
  }
}

module.exports = { runAgent };
