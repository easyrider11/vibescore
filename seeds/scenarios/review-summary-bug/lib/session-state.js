function endSession(session) {
  if (!session) throw new Error("Session is required");
  if (session.status !== "in_progress") {
    return session;
  }

  return {
    ...session,
    status: "completed",
    endedAt: new Date().toISOString(),
  };
}

module.exports = { endSession };
