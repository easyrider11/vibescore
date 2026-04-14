const assert = require("assert");
const { endSessionByToken } = require("../api/end-session");
const { resetData } = require("../lib/mock-data");
const { getReviewerSummary } = require("../lib/reviewer-summary");

resetData();
endSessionByToken("token-123");

const summary = getReviewerSummary("session-1");

assert.equal(summary.currentStatus, "completed");
assert.equal(summary.readyForReview, true);
assert.equal(summary.aiUsageCount, 2);
assert.ok(summary.endedAt);

console.log("reviewer summary test passed");
