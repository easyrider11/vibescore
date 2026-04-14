const { listSessions } = require("../lib/session-list");

function getSessionsResponse(filter) {
  return {
    sessions: listSessions(filter),
  };
}

module.exports = { getSessionsResponse };
