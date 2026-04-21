const { answer } = require("../lib/answer");

function ask({ query }) {
  if (typeof query !== "string" || !query.trim()) {
    return { error: "query is required" };
  }
  return answer(query);
}

module.exports = { ask };
