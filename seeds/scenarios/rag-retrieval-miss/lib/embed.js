// Deterministic mock embedder. Maps a small vocabulary of topic words to
// fixed unit-ish vectors. Tokens not in the vocabulary contribute nothing.
//
// Do NOT edit — this is the reference embedding model both the indexer
// and the query path are supposed to use identically.

const TOPIC_VECTORS = {
  refund:   [4, 0, 0, 0, 0, 0],
  refunds:  [4, 0, 0, 0, 0, 0],
  shipping: [0, 4, 0, 0, 0, 0],
  ship:     [0, 3, 0, 0, 0, 0],
  sdk:      [0, 0, 4, 0, 0, 0],
  download: [0, 0, 3, 0, 0, 0],
  password: [0, 0, 0, 4, 0, 0],
  reset:    [0, 0, 0, 3, 0, 0],
  billing:  [0, 0, 0, 0, 4, 0],
  invoice:  [0, 0, 0, 0, 3, 0],
  status:   [0, 0, 0, 0, 0, 4],
  order:    [0, 0, 0, 0, 0, 3],
};

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function embed(text) {
  const vec = new Array(6).fill(0);
  for (const token of tokenize(text)) {
    const topic = TOPIC_VECTORS[token];
    if (!topic) continue;
    for (let i = 0; i < vec.length; i += 1) vec[i] += topic[i];
  }
  // Always add a small constant so no vector is the zero vector (cosine
  // would otherwise be undefined).
  vec[0] += 0.01;
  return vec;
}

module.exports = { embed, tokenize };
