# AI-native: The RAG pipeline is returning the wrong docs

You're on-call for a docs chatbot. Customers are complaining that:

- "How do I get a refund?" → the bot cites the **shipping** doc.
- "Where do I download the SDK?" → the bot cites the **refund** doc.
- Every question returns the same top-1 hit, regardless of what we ask.

Retrieval is broken. The generation layer (the model) is fine — it just
has nothing good to quote. You need to find and fix the bugs in the
retrieval layer.

You have:
- `lib/embed.js` — mock deterministic embedder. Do not edit.
- `lib/docs.js` — the small doc corpus.
- `lib/retrieve.js` — the retriever. Two bugs live here.
- `lib/answer.js` — stitches retrieval + a mock LLM. Don't need to edit.
- `tests/retrieve.test.js` — failing tests demonstrating the problems.
- `api/ask.js` — the HTTP handler.

Your task:
- Find both bugs in `lib/retrieve.js`.
- Fix them.
- Explain how you would evaluate retrieval quality on an ongoing basis
  (what does "good" look like, what dataset, what metric).

Helpful commands:
- `node tests/retrieve.test.js`
- `node -e "console.log(require('./api/ask').ask({ query: 'how do I get a refund?' }))"`
