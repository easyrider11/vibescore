const { handleChat } = require("../lib/agent");

async function chat({ message, approvals }) {
  if (typeof message !== "string" || !message) {
    return { error: "message is required" };
  }
  return handleChat(message, { approvals: approvals || {} });
}

module.exports = { chat };
