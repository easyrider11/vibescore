// Run with: node tests/retrieve.test.js
//
// These tests fail before the fix. They describe the retrieval
// behavior the pipeline MUST have after you fix lib/retrieve.js.

const assert = require("assert");
const { retrieve } = require("../lib/retrieve");

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

test("a refund query retrieves the refunds doc first", () => {
  const hits = retrieve("how do I get a refund?", 3);
  assert.strictEqual(
    hits[0].id,
    "refunds",
    `expected refunds first, got ${hits.map((h) => h.id).join(", ")}`,
  );
});

test("a shipping query retrieves the shipping doc first", () => {
  const hits = retrieve("when will my order ship?", 3);
  assert.strictEqual(
    hits[0].id,
    "shipping",
    `expected shipping first, got ${hits.map((h) => h.id).join(", ")}`,
  );
});

test("an SDK query retrieves the sdk doc first", () => {
  const hits = retrieve("where do I download the SDK?", 3);
  assert.strictEqual(
    hits[0].id,
    "sdk",
    `expected sdk first, got ${hits.map((h) => h.id).join(", ")}`,
  );
});

test("different queries return different top hits", () => {
  const a = retrieve("refund policy", 1)[0]?.id;
  const b = retrieve("shipping times", 1)[0]?.id;
  const c = retrieve("password reset", 1)[0]?.id;
  assert.notStrictEqual(a, b, `refund vs shipping should differ, both=${a}`);
  assert.notStrictEqual(b, c, `shipping vs password should differ, both=${b}`);
  assert.notStrictEqual(a, c, `refund vs password should differ, both=${a}`);
});

test("scores are between 0 and 1 after using cosine similarity", () => {
  const hits = retrieve("refund policy", 6);
  for (const h of hits) {
    assert.ok(
      h.score >= 0 && h.score <= 1.0001,
      `cosine score should be in [0, 1], got ${h.score} for ${h.id}`,
    );
  }
});
