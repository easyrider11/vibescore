const { runAgent } = require("../lib/agent");

async function run({ query }) {
  if (!query || typeof query !== "string") {
    return { error: "query is required" };
  }
  try {
    const { final, steps } = runAgent(query);
    return { final, steps };
  } catch (err) {
    return { error: err.message };
  }
}

module.exports = { run };
