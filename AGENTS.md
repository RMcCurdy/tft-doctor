<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TFT Doctor — Agent & Skill Routing

## Product Context

TFT Doctor is a situational advisor web app for Teamfight Tactics (TFT). It helps players get ranked comp recommendations based on their in-game state (augments, emblems, items, artifacts) by cross-referencing against high-elo match data from Riot's API.

**Tech stack**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Drizzle ORM, Supabase PostgreSQL, Vercel

## Skill Routing

When the user's request matches one of these domains, invoke the corresponding skill or agent:

| Domain | Invoke | When |
|--------|--------|------|
| Code review | `/review-quality` | After completing a feature, before committing |
| Feature planning | `/plan-feature` | Starting a new feature, discussing what to build |
| Pre-production check | `/pre-production` | Before merging to main or deploying |
| UI component work | `code-quality-reviewer` agent | After writing React components |
| Security concern | `security-auditor` agent | Auth, API keys, user input, data exposure |
| Performance issue | `performance-reviewer` agent | Data-heavy pages, API latency, re-renders |
| Accessibility | `accessibility-reviewer` agent | After building UI, before production |
| Schema/architecture | `architecture-reviewer` agent | New tables, type definitions, API design |
| Code complexity | `code-simplifier` agent | Code feels over-engineered, too many files |
| Writing tests | `test-architect` agent | After implementing features, bug fixes |

## Key Conventions

- **shadcn/ui**: Always use shadcn components, never vanilla HTML equivalents
- **Server-first**: Default to server components, add `"use client"` only when needed
- **No secrets client-side**: `RIOT_API_KEY` and `DATABASE_URL` must never reach client code
- **TypeScript strict**: No `any` types, no eslint-disable without justification
- **Mock data gating**: API routes check `USE_MOCK_DATA` env var to toggle between mock and real data
