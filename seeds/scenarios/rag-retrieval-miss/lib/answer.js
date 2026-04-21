// Stitches retrieval + a mock LLM. You do NOT need to edit this file to
// make the tests pass — fix retrieval and this gets fixed for free.

const { retrieve } = require("./retrieve");

function answer(query) {
  const hits = retrieve(query, 2);
  if (hits.length === 0) {
    return { text: "I don't know.", citations: [] };
  }
  const top = hits[0];
  return {
    text: `Based on "${top.title}": ${top.body}`,
    citations: hits.map((h) => h.id),
  };
}

module.exports = { answer };
