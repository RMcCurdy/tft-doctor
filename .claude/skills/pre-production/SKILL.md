---
name: pre-production
description: Master pre-production validation orchestrator. Runs automated checks (lint, type-check, build) then launches review agents in parallel. Produces a go/no-go verdict. Use before merging to main or deploying to production.
disable-model-invocation: true
argument-hint: "[optional file path or git ref to review]"
allowed-tools: Read, Grep, Glob, Bash, Task
---

# Pre-Production Validation Orchestrator

You are the final gate before code reaches production. You run every automated check and every AI review agent, then produce a single go/no-go verdict.

## Process

### Phase 1: Identify Scope

If `$ARGUMENTS` specifies files or a git ref, use that. Otherwise:

1. Run `git diff --name-only HEAD~1` to find recently changed files
2. Run `git diff --staged --name-only` to find staged changes
3. Combine all results into the review scope
4. If no changes found, ask the user what to review

Categorize changed files:
- **Frontend**: files under `src/app/`, `src/components/`, `src/hooks/`
- **API Routes**: files under `src/app/api/`
- **Shared Logic**: files under `src/lib/`, `src/types/`
- **Pipeline**: files under `pipeline/`
- **Config**: `*.config.*`, `tsconfig.*`, `package.json`
- **Database**: `src/lib/db/schema.ts`, `drizzle/`

### Phase 2: Automated Checks (Sequential)

Run these checks. If any FAIL, report immediately but continue.

```bash
# Lint
pnpm lint 2>&1 | tail -50

# TypeScript
npx tsc --noEmit 2>&1 | tail -50

# Build
pnpm build 2>&1 | tail -50
```

Record each as PASS / FAIL / WARN.

### Phase 3: AI Review Agents (Parallel)

Launch applicable agents in parallel using the Task tool:

**Always launch:**
1. **code-quality-reviewer** — SOLID, readability, TypeScript type safety
2. **security-auditor** — OWASP, input validation, API key exposure, env vars

**If frontend files changed, also launch:**
3. **performance-reviewer** — React re-renders, bundle impact, data fetching
4. **accessibility-reviewer** — WCAG 2.1 AA, keyboard, screen reader, contrast

**If database/architecture files changed:**
5. **architecture-reviewer** — Schema design, query patterns, type safety

### Phase 4: TFT Doctor Checklist

Verify these project conventions against the changed files:

- [ ] **No API key exposure**: `RIOT_API_KEY` never in client-side code
- [ ] **No DB in client**: `DATABASE_URL` and `src/lib/db` never imported in `"use client"` components
- [ ] **Input validation**: All API route POST bodies are validated
- [ ] **shadcn/ui components**: No vanilla HTML elements where shadcn equivalents exist
- [ ] **Proper TypeScript**: No `any` types, no eslint-disable without justification
- [ ] **Server/client boundary**: `"use client"` only where needed, server components by default
- [ ] **Mock data gating**: Mock data imports gated behind `USE_MOCK_DATA` when real data path exists
- [ ] **Image handling**: External images use `next/image` with `unoptimized` for DDragon CDN

### Phase 5: Synthesize Verdict

```markdown
# Pre-Production Validation Report

**Date**: [date]
**Files reviewed**: [count]

---

## Verdict: [PASS | FAIL | WARN]

[One sentence summary]

---

## Automated Checks

| Check | Status | Details |
|-------|--------|---------|
| Lint | PASS/FAIL | [summary] |
| TypeScript | PASS/FAIL | [summary] |
| Build | PASS/FAIL | [summary] |

## AI Review Findings

### CRITICAL (Must Fix Before Merge)
[Findings from ALL agents that are Critical severity]

### HIGH (Should Fix Before Merge)
[High-severity findings]

### MEDIUM (Fix Soon)
[Medium findings]

## TFT Doctor Checklist
[Results of each checklist item — PASS/FAIL/N/A]

## Positive Observations
[What was done well]

---

## Action Items

### Blocking (must fix):
1. [item]

### Recommended (should fix):
1. [item]
```

## Verdict Rules

- **FAIL**: Any automated check fails OR any Critical finding OR any checklist item fails
- **WARN**: No critical issues, but High-severity findings exist
- **PASS**: All checks pass, no Critical or High findings, checklist clean
