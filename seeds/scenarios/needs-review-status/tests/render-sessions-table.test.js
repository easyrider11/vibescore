const assert = require("assert");
const { listSessions } = require("../lib/session-list");
const { renderSessionsTable } = require("../ui/render-sessions-table");

const html = renderSessionsTable(listSessions("all"));

assert.ok(html.includes("Needs Review"));

console.log("render sessions table test passed");
