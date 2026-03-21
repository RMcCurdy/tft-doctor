# TFT Doctor — Remaining TODO

> Last updated: 2026-03-21
> Reference the plan at `.claude/plans/resilient-hugging-meerkat.md` for architecture details.

---

## Phase 1: Infrastructure Setup (Manual)

These are external services you need to set up outside the codebase.

### Supabase
- [ ] Create a Supabase account at https://supabase.com
- [ ] Create a new project (free tier, choose a region close to you)
- [ ] Go to Settings → Database → Connection string
- [ ] Copy the **Transaction (port 6543)** connection string (required for serverless)
- [ ] Add to `.env.local`: `DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:6543/postgres`
- [ ] Run `pnpm db:push` to create all 10 tables in Supabase
- [ ] Verify tables exist in Supabase dashboard → Table Editor

### Vercel
- [ ] Create a Vercel account at https://vercel.com (if not already)
- [ ] Import the `tft-doctor` GitHub repo as a new Vercel project
- [ ] Set environment variables in Vercel dashboard:
  - `DATABASE_URL` (same as above)
  - `RIOT_API_KEY` (once you have it)
  - `USE_MOCK_DATA=true` (keep mock mode until pipeline is running)
- [ ] Connect your Spaceship domain to Vercel (Vercel dashboard → Domains)
- [ ] Verify the site deploys and works at your domain

### Riot Developer Portal
- [ ] Register at https://developer.riotgames.com
- [ ] Create a new application for TFT Doctor
- [ ] Get a **Development API Key** (expires every 24 hours, must regenerate daily)
- [ ] Add to `.env.local`: `RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- [ ] Test the key works: `npx tsx pipeline/detect-patch.ts`
- [ ] Note: Production key application comes later (Phase 4) — requires a working prototype

### GitHub Repository
- [ ] Decide: make repo public or private?
  - Public = unlimited GitHub Actions minutes (recommended)
  - Private = 2,000 minutes/month limit
- [ ] Add repository secrets (Settings → Secrets → Actions):
  - `DATABASE_URL`
  - `RIOT_API_KEY`

---

## Phase 2: Pipeline Activation

Once infrastructure is set up, activate the data pipeline.

### Bootstrap (Run Once)
- [ ] Run `npx tsx pipeline/detect-patch.ts` — creates the current patch entry
- [ ] Run `npx tsx pipeline/sync-static-data.ts` — stores champion/item/augment/trait data
- [ ] Run `npx tsx pipeline/discover-players.ts` — populates the players table
- [ ] Run `npx tsx pipeline/ingest-matches.ts` — starts collecting match data
- [ ] Check Supabase dashboard to verify data is flowing into all tables
- [ ] Monitor the 500 MB storage limit — check DB size after first ingestion run

### Remaining Pipeline Scripts to Build
- [ ] `pipeline/aggregate-comps.ts` — the core aggregation job:
  - Run carry-based clustering on all unprocessed match participants
  - Compute comp archetype stats (avg placement, top4 rate, win rate, play rate)
  - Compute augment stats (per-comp and overall)
  - Compute emblem stats (which champion, which comp, placement impact)
  - Compute item stats (which champion, which comp, placement impact)
  - Mark matches as processed
  - Purge raw match data older than 3 days

### GitHub Actions Workflows
- [ ] `.github/workflows/pipeline-static-data.yml` — daily at 06:00 UTC
- [ ] `.github/workflows/pipeline-players.yml` — every 12h (00:00, 12:00 UTC)
- [ ] `.github/workflows/pipeline-matches.yml` — every 6h
- [ ] `.github/workflows/pipeline-aggregate.yml` — triggered after match ingestion
- [ ] `.github/workflows/ci.yml` — lint + typecheck + test on PR

---

## Phase 3: Core Algorithm Implementation

### Carry-Based Comp Clustering
- [ ] `src/lib/clustering/carry-identifier.ts` — score units to find primary/secondary carry
- [ ] `src/lib/clustering/trait-signature.ts` — extract active traits from a board
- [ ] `src/lib/clustering/comp-classifier.ts` — classify boards into comp archetypes
  - Pass 1: Carry-first lookup against comp definition table
  - Pass 2: Trait-signature fallback (≥60% overlap)
  - Pass 3: New comp discovery (>10% unclassified triggers review)
- [ ] Bootstrap 15-25 comp definitions for the current Set 16 meta
- [ ] Test classifier against mock participant data

### Recommendation Engine
- [ ] `src/lib/recommendation/engine.ts` — core recommendation logic
  - Tier 1: Exact match (augment + emblem combo → comps)
  - Tier 2: Partial decomposition (score comps by individual input matches)
  - Tier 3: Meta inference (fit score against top meta comps)
- [ ] `src/lib/recommendation/fit-score.ts` — weighted scoring algorithm
  - Emblem weight, augment weight, item weight
  - Negative signal handling (bad items for a comp)
  - Stage-based flexibility (early = more flex, late = committed)
- [ ] `src/lib/recommendation/explanation.ts` — generate human-readable fit reasons

### Connect Frontend to Real Data
- [ ] Update `POST /api/recommend` to use real DB queries (fallback to mock if no data)
- [ ] Update `GET /api/comps` to query comp_archetypes table
- [ ] Update `GET /api/augments` to query augment_stats table
- [ ] Update `GET /api/items` to query item_stats table
- [ ] Update `GET /api/patch` to query patches table
- [ ] Add `USE_MOCK_DATA` toggle — when false, use DB; when true, use mock data
- [ ] Update meta page and comp detail page to use real data

---

## Phase 4: UI/UX Design Session

Dedicated design pass to make the product polished and professional.

### Pre-Session Research
- [ ] Screenshot and analyze competitor sites for inspiration:
  - metatft.com (comp tier lists, data presentation)
  - tftactics.gg (item builders, augment info)
  - mobalytics.gg/tft (comp guides, positioning)
  - tactics.tools (clean UI, good mobile experience)
  - u.gg/tft (minimal, data-focused)
- [ ] Identify what each does well and what feels clunky
- [ ] Note what differentiates TFT Doctor (situational input → personalized output)

### Design Decisions to Make
- [ ] Color palette refinement (beyond default shadcn zinc)
  - Accent color for the brand (primary)
  - Semantic colors for comp tiers (S/A/B/C)
  - Cost-based champion colors (1-5 cost)
  - Confidence indicator colors
- [ ] Typography: keep Geist or switch to something with more gaming personality?
- [ ] Advisor page layout refinement:
  - Selector UX: are comboboxes the right pattern? Consider multi-select chips, visual grids, etc.
  - Recommendation card design: how much info at a glance vs. expandable?
  - Mobile layout: stacked or tabbed (input tab / results tab)?
- [ ] Meta page design:
  - Tier list visual style (list vs. grid vs. tiered rows)
  - Augment/item presentation (icons vs. text vs. both)
- [ ] Comp detail page:
  - Champion positioning grid (hex grid visual)
  - Item build path visualization
  - Augment synergy display
- [ ] Loading states and animations
- [ ] Empty states and onboarding (first-time user experience)
- [ ] Dark mode polish (contrast, readability, icon visibility)
- [ ] Logo / wordmark for "TFT Doctor"

### Implementation After Design Session
- [ ] Apply color palette and typography changes
- [ ] Rebuild advisor selectors with chosen UX pattern
- [ ] Redesign recommendation cards
- [ ] Add champion/item/augment icons to all selectors and cards
- [ ] Build hex grid positioning component
- [ ] Mobile responsive pass (test at 375px, 390px, 428px)
- [ ] Add page transitions / loading animations
- [ ] Add SEO metadata to all pages (title, description, OG image)

---

## Phase 5: Polish & Launch Prep

### Legal & Compliance
- [ ] Write Terms of Service page (`/terms`)
- [ ] Write Privacy Policy page (`/privacy`)
- [ ] Ensure Riot Games attribution is visible on every page (already in footer)
- [ ] GDPR compliance review (if serving EU users)
- [ ] Google AdSense content policy review

### Production Readiness
- [ ] Apply for Riot Production API Key (requires working prototype + ToS + Privacy Policy)
  - Takes ~2-3 weeks for approval
  - Submit after frontend is polished and data is flowing
- [ ] Set up error monitoring (Sentry free tier or Vercel's built-in)
- [ ] Set up uptime monitoring for the pipeline (GitHub Actions failure notifications)
- [ ] Performance optimization:
  - ISR on comp detail pages (`revalidate = 3600`)
  - In-memory LRU cache on `/api/recommend`
  - Pre-computed recommendations for top input combos
- [ ] Set `USE_MOCK_DATA=false` in production env vars
- [ ] Remove mock data fallback from API routes (or keep as graceful degradation)

### Monetization
- [ ] Integrate Google AdSense
  - Sidebar ad on desktop
  - Between-content ad on mobile
  - Below recommendation results
- [ ] Ensure ads don't break the layout on mobile
- [ ] Test ad blockers don't break the site

---

## Phase 6: Post-Launch Iteration

### Feature Additions
- [ ] Augment selection mode — evaluate 3 augment choices mid-game
- [ ] Positioning guides for recommended comps (hex grid)
- [ ] Comp matchup data (how does this comp perform against others?)
- [ ] User accounts for saved preferences / history (Supabase Auth)
- [ ] "What should I have played?" — post-game analysis with match ID input
- [ ] Patch-over-patch trend data (comps rising/falling)

### Scale
- [ ] Upgrade to Supabase Pro if hitting 500 MB limit
- [ ] Upgrade to Vercel Pro if hitting bandwidth/invocation limits
- [ ] Upgrade ad network to Venatus/Playwire if traffic exceeds 50K sessions/month
- [ ] Add more regions to pipeline (JP, OCE, BR, etc.)
- [ ] Consider ML clustering (DBSCAN/k-means) as a refinement to carry-based

---

## Quick Reference: What's Already Built

| Component | Status | Files |
|-----------|--------|-------|
| Next.js + Tailwind + shadcn/ui scaffold | Done | `src/app/`, `components.json` |
| TypeScript types (game, comp, API, Riot) | Done | `src/types/` |
| Mock data (Set 16, 101 champs, 274 augments) | Done | `mock/` |
| Advisor page (input + recommendations) | Done | `src/app/advisor/`, `src/components/advisor/` |
| Meta page (tier lists) | Done | `src/app/meta/`, `src/components/meta/` |
| Comp detail page | Done | `src/app/comps/[compId]/` |
| Patch status page | Done | `src/app/patch/` |
| Navbar + Footer | Done | `src/components/shared/` |
| All API routes (mock data) | Done | `src/app/api/` |
| Drizzle schema (10 tables) | Done | `src/lib/db/schema.ts` |
| DB client + query helpers | Done | `src/lib/db/` |
| Riot API client + rate limiter | Done | `src/lib/riot/`, `pipeline/utils/` |
| Pipeline: detect-patch | Done | `pipeline/detect-patch.ts` |
| Pipeline: sync-static-data | Done | `pipeline/sync-static-data.ts` |
| Pipeline: discover-players | Done | `pipeline/discover-players.ts` |
| Pipeline: ingest-matches | Done | `pipeline/ingest-matches.ts` |
| Pipeline: aggregate-comps | **TODO** | `pipeline/aggregate-comps.ts` |
| Clustering algorithm | **TODO** | `src/lib/clustering/` |
| Recommendation engine (real) | **TODO** | `src/lib/recommendation/` |
| GitHub Actions workflows | **TODO** | `.github/workflows/` |
| UI/UX design pass | **TODO** | — |
| Legal pages (ToS, Privacy) | **TODO** | — |
| AdSense integration | **TODO** | — |
