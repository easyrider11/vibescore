const sessions = [
  {
    id: "s1",
    candidateName: "Alice",
    status: "completed",
    rubricSubmittedAt: null,
    aiGradeCompletedAt: "2026-04-14T12:00:00.000Z",
  },
  {
    id: "s2",
    candidateName: "Bob",
    status: "completed",
    rubricSubmittedAt: "2026-04-14T12:10:00.000Z",
    aiGradeCompletedAt: "2026-04-14T12:05:00.000Z",
  },
  {
    id: "s3",
    candidateName: "Cara",
    status: "in_progress",
    rubricSubmittedAt: null,
    aiGradeCompletedAt: null,
  },
];

function getSessions() {
  return sessions.map((session) => ({ ...session }));
}

module.exports = { getSessions, sessions };
