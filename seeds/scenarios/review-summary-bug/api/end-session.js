const { getSessionByToken, saveSession } = require("../lib/mock-data");
const { endSession } = require("../lib/session-state");
const { appendEvent } = require("../lib/session-events");

function endSessionByToken(token) {
  const session = getSessionByToken(token);
  if (!session) throw new Error("Session not found");

  const updated = endSession(session);
  saveSession(updated);

  appendEvent({
    type: "session_completed",
    sessionId: updated.id,
    createdAt: updated.endedAt,
  });

  return { status: updated.status };
}

module.exports = { endSessionByToken };
