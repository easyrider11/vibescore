# Vbescore — AI-Assisted Interview MVP

A minimal-but-real interview platform MVP. Companies create a scenario, invite a candidate, the candidate works in a web IDE with AI assistance, and the interviewer reviews the timeline, diffs, and rubric scores.

## Tech
- Next.js (App Router) + TypeScript + Tailwind
- Prisma + SQLite
- AI assistant endpoint (mock by default, optional OpenAI)

## Quick Start
```bash
npm install
cp .env.example .env
npx prisma db push
npx prisma db seed
npm run dev
```
Open http://localhost:3000

## One-Command (Docker)
```bash
docker compose up --build
```

## Environment
- `DATABASE_URL` (SQLite file), default `file:./dev.db`
- `AI_MODE` = `mock` or `real`
- `OPENAI_API_KEY` (optional)
- `OPENAI_MODEL` (default: gpt-5.2-codex)

## Smoke Workflow
1) Login: `/login`
2) Recruiter: `/app` → pick a scenario → Create Session
3) Copy candidate link: `/s/{token}`
4) Candidate:
   - Browse files, search repo, edit, save
   - Ask AI (mode: summary/explain/tests/review)
   - Run tests
   - Add clarification notes and submit snapshot
5) Interviewer:
   - `/app/sessions/{id}` view timeline + AI chats + diffs + test output
   - Score rubric (5 dimensions)

## Scenarios (seeded)
A) Bugfix scenario
B) Feature add scenario
C) Refactor scenario

## Notes
- File ops are server-side only. Paths are validated.
- “Run tests” is mocked (fails if TODO detected).
- AI assistant is mocked unless `AI_MODE=real` and `OPENAI_API_KEY` is set.
