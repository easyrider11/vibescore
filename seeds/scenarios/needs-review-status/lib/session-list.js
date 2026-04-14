const { getSessions } = require("./mock-data");

function deriveDisplayStatus(session) {
  return session.status;
}

function buildSessionRow(session) {
  return {
    id: session.id,
    candidateName: session.candidateName,
    status: session.status,
    displayStatus: deriveDisplayStatus(session),
  };
}

function listSessions(filter = "all") {
  const rows = getSessions().map(buildSessionRow);

  if (filter === "all") {
    return rows;
  }

  return rows.filter((row) => row.displayStatus === filter);
}

module.exports = { buildSessionRow, deriveDisplayStatus, listSessions };
