# Feature Task

Reviewers can see raw statuses like `pending`, `in_progress`, and `completed`.
But they still cannot quickly tell which completed sessions are waiting on manual review.

Your task:
- add a derived status called `needs_review`
- show it in the session list
- keep the existing raw status model intact

Helpful commands:
- `node tests/session-list.test.js`
- `node tests/render-sessions-table.test.js`
