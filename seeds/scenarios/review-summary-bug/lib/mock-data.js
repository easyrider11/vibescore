const initialSessions = [
  {
    id: "session-1",
    token: "token-123",
    status: "in_progress",
    candidateName: "Alice",
    endedAt: null,
  },
];

const initialEvents = [
  { type: "session_started", sessionId: "session-1", createdAt: "2026-04-14T12:00:00.000Z" },
  { type: "ai_request", sessionId: "session-1", createdAt: "2026-04-14T12:05:00.000Z" },
  { type: "ai_request", sessionId: "session-1", createdAt: "2026-04-14T12:09:00.000Z" },
  { type: "file_opened", sessionId: "session-1", createdAt: "2026-04-14T12:10:00.000Z" },
];

const sessions = clone(initialSessions);
const events = clone(initialEvents);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function resetData() {
  sessions.length = 0;
  events.length = 0;
  sessions.push(...clone(initialSessions));
  events.push(...clone(initialEvents));
}

function getSessionByToken(token) {
  return sessions.find((session) => session.token === token);
}

function getSessionById(id) {
  return sessions.find((session) => session.id === id);
}

function saveSession(nextSession) {
  const index = sessions.findIndex((session) => session.id === nextSession.id);
  if (index === -1) throw new Error("Session not found");
  sessions[index] = nextSession;
}

module.exports = {
  events,
  getSessionById,
  getSessionByToken,
  resetData,
  saveSession,
  sessions,
};
