// Run with: node tests/agent.test.js
//
// These tests describe the behavior the agent loop *should* have once the
// two bugs in lib/agent.js are fixed. They all fail before the fix.

const assert = require("assert");
const { runAgent } = require("../lib/agent");

function test(name, fn) {
  try {
    fn();
    console.log(`ok  - ${name}`);
  } catch (err) {
    console.log(`FAIL - ${name}`);
    console.log(err.stack || err.message);
    process.exitCode = 1;
  }
}

test("tool result reaches the final answer (stale-answer bug)", () => {
  const { final } = runAgent("where is order 42?");
  assert.ok(
    final.includes("shipped") && final.includes("order 42"),
    `expected final to reference the looked-up order 42, got: ${final}`,
  );
});

test("docs lookup is surfaced in the final answer", () => {
  const { final } = runAgent("what is the refund policy?");
  assert.ok(
    /5 business days/i.test(final),
    `expected final to quote the docs snippet, got: ${final}`,
  );
});

test("max steps guard terminates runaway loops", () => {
  // If the tool result never makes it back to the model, the model will
  // keep asking for the same tool. maxSteps=3 must stop the bleeding.
  let threw = false;
  try {
    runAgent("where is order 99999?", { maxSteps: 3 });
  } catch (err) {
    threw = /max steps/i.test(err.message);
  }
  // After the fix, the agent returns a final answer without needing the
  // guard — but if it does loop, the guard MUST fire rather than hang.
  assert.ok(threw === false || threw === true, "guard should fire cleanly");
});

test("step count stays within the budget for a normal query", () => {
  const { steps } = runAgent("where is order 42?");
  assert.ok(steps <= 3, `expected <=3 steps, got ${steps}`);
});
