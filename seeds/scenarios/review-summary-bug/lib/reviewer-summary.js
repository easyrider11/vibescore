const { getSessionById } = require("./mock-data");
const { listEventsForSession } = require("./session-events");

function getReviewerSummary(sessionId) {
  const session = getSessionById(sessionId);
  if (!session) throw new Error("Session not found");

  const events = listEventsForSession(sessionId);
  const endEvent = events.find((event) => event.type === "session_submitted");
  const endEventIndex = events.findIndex((event) => event.type === "session_submitted");
  const aiUsageCount =
    endEventIndex === -1
      ? 0
      : events.slice(0, endEventIndex).filter((event) => event.type === "ai_request").length;

  return {
    currentStatus: endEvent ? "completed" : "in_progress",
    endedAt: endEvent ? endEvent.createdAt : null,
    aiUsageCount,
    readyForReview: Boolean(endEvent),
  };
}

module.exports = { getReviewerSummary };
