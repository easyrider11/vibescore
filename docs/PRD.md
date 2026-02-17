# Vbescore PRD (MVP)

## Goal
Ship a minimal AI-assisted interview platform that demonstrates the core loop: create scenario → invite candidate → candidate uses web IDE + AI assistant → interviewer reviews timeline + rubric score.

## Users
- Interviewers / hiring managers
- Candidates

## Core Flow
- Interviewer creates a session from a built-in scenario
- Candidate works in a web IDE with AI assistant and submits a snapshot
- Interviewer reviews timeline, AI chats, diffs, and scores with a 5-dimension rubric

## Requirements
- Scenario library (3 seeded scenarios)
- Candidate workspace with file tree, editor, AI chat, run tests, submit
- Server-side file ops and sandboxed workspace per session
- Event logging for timeline and AI interactions
- Rubric scoring (5 dimensions, 1–5 + comments)

## Success Criteria
- Local run works in one command
- Timeline, AI chats, diffs visible to interviewer
- Rubric saved successfully
