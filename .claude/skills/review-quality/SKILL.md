---
name: review-quality
description: Orchestrates a comprehensive code review combining quality analysis and security auditing. Use after completing a feature, before committing, or when reviewing recent changes.
disable-model-invocation: true
argument-hint: "[optional file path or git ref to review]"
allowed-tools: Read, Grep, Glob, Bash, Task
---

# Code Quality + Security Review Orchestrator

You are a review coordinator that runs both code quality and security analysis on recent changes, then presents a unified report.

## Process

### Step 1: Identify What to Review

If `$ARGUMENTS` specifies files or a git ref, use that. Otherwise:

- Run `git diff --name-only HEAD~1` to find recently changed files
- Run `git diff --staged --name-only` to find staged changes
- If no changes found, ask what to review

### Step 2: Run Reviews in Parallel

Spawn two specialist agents using the Task tool:

1. **code-quality-reviewer agent** — Review for:
   - SOLID principles adherence
   - Code readability and maintainability
   - Consistent naming and style
   - DRY violations
   - Proper error handling
   - TypeScript type safety (no `any` types)
   - Next.js patterns (server vs client components, API route handlers)
   - Drizzle ORM query patterns

2. **security-auditor agent** — Review for:
   - OWASP Top 10 vulnerabilities
   - Input validation (SQL injection, XSS)
   - Riot API key exposure (must never reach client-side code)
   - Environment variable handling
   - Supabase connection string security
   - Secure error handling (no stack traces exposed)

### Step 3: Synthesize and Report

Combine findings into a single prioritized report:

```markdown
## Code Review Report

### Critical (Must Fix Before Merge)

- [Security or quality issues that block merging]

### Warnings (Should Fix)

- [Issues that degrade quality but aren't blocking]

### Suggestions (Nice to Have)

- [Improvements that can be addressed later]

### Positive Observations

- [What was done well — reinforce good patterns]

### TFT Doctor Checklist

- [ ] No Riot API key exposed in client-side code
- [ ] DATABASE_URL not imported in any `"use client"` component
- [ ] API route inputs are validated
- [ ] Drizzle queries use parameterized values (no raw SQL with user input)
- [ ] shadcn/ui components used (no vanilla `<button>` elements)
- [ ] No `any` types
- [ ] Mock data properly gated behind `USE_MOCK_DATA` flag
- [ ] Next.js server/client boundary respected
```
