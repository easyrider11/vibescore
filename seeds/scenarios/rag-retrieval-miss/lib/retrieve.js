// Nearest-neighbor retriever over the doc corpus.
//
// TWO bugs live in this file. Both are described in notes.md.

const { embed } = require("./embed");
const { DOCS } = require("./docs");

// Pre-compute doc embeddings once.
const INDEX = DOCS.map((doc) => ({
  id: doc.id,
  title: doc.title,
  body: doc.body,
  vector: embed(`${doc.title} ${doc.body}`),
}));

// BUG #1: this is not cosine similarity — it's only the dot product.
// Docs with more matching tokens overall always win, regardless of how
// well they actually match the query.
function similarity(a, b) {
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) dot += a[i] * b[i];
  return dot;
}

function retrieve(query, k = 3) {
  const qvec = embed(query);
  const scored = INDEX.map((doc) => ({ doc, score: similarity(qvec, doc.vector) }));

  // BUG #2: sorted ascending, so the lowest-score doc lands at position 0.
  scored.sort((a, b) => a.score - b.score);

  return scored.slice(0, k).map(({ doc, score }) => ({
    id: doc.id,
    title: doc.title,
    body: doc.body,
    score,
  }));
}

module.exports = { retrieve, similarity, INDEX };
