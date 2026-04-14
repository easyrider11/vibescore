const assert = require("assert");
const { listSessions } = require("../lib/session-list");

const rows = listSessions("all");
const alice = rows.find((row) => row.id === "s1");
const bob = rows.find((row) => row.id === "s2");
const cara = rows.find((row) => row.id === "s3");

assert.equal(alice.displayStatus, "needs_review");
assert.equal(bob.displayStatus, "completed");
assert.equal(cara.displayStatus, "in_progress");

console.log("session list test passed");
