# TFT Situational Advisor — Project Specification

> **Purpose of this document:** This is a complete project specification for an AI/data-driven web application that helps Teamfight Tactics (TFT) players make better decisions during games by recommending optimal team compositions based on the unique situation they've been dealt (emblems, augments, items, artifacts). Hand this document to Claude Code (or any development assistant) to begin architecting and building the project.

---

## 1. Product Vision

### 1.1 Problem Statement

Teamfight Tactics (TFT) by Riot Games is an auto-battler with an enormous amount of in-game variation. Each game presents players with:

- **Augments:** Three choices offered at stages 2-1, 3-2, and 4-2 (player picks 1 of 3 each time)
- **Emblems:** Spatula-based items that grant a champion an additional trait (e.g., Yordle emblem, Bruiser emblem)
- **Items:** Component items that combine into completed items, each with different stat profiles
- **Artifacts/Radiant items:** Special powerful items with unique effects
- **Random champion shop rolls:** 5 champions offered each round from a shared pool

Existing tools (tftactics.gg, mobalytics.gg/tft, metatft.com) primarily show "here are the best comps this patch ranked by average placement." They do NOT adequately address the question: **"Given my specific game state (these emblems, these augments, these items), what comp should I pivot toward?"**

### 1.2 Product Goal

Build a web application where a TFT player can:

1. **Input their current game state** — selected augments, available emblems, key items, and optionally their current champions
2. **Receive ranked comp recommendations** — a "Top 3 (or more) comps that fit your current situation," ranked by statistical confidence from real match data
3. **See WHY each comp fits** — e.g., "Your Yordle emblem lets you hit 6 Yordles without Veigar, and your omnivamp augment synergizes with the sustain this comp relies on"
4. **Update inputs as the game progresses** — as new augment choices appear or items drop, the user refines their inputs and gets updated recommendations

### 1.3 Key Differentiator

Unlike existing sites that show static "best comps" lists, this tool:

- Accepts a **wide input range** of situational variables (emblems, augments, items, artifacts)
- **Cross-references** those inputs against real match outcome data
- **Infers emblem/item applications** — e.g., "if you apply this emblem to champion X in comp Y, it historically improves placement by Z"
- Uses **fallback logic** for rare combinations — when exact combo data is sparse, it decomposes into sub-combinations and infers from known strong comps

---

## 2. Riot Games API & Data Sources

### 2.1 APIs Required

All APIs are accessed via the Riot Developer Portal (https://developer.riotgames.com/).

#### TFT Match History API (`tft-match-v1`)
- **Endpoint:** `GET /tft/match/v1/matches/{matchId}`
- **Returns per participant:**
  - `augments` — array of augment IDs chosen (e.g., `["TFT9_Augment_CyberneticImplants1"]`)
  - `traits` — array of active traits with tier_current, tier_total, num_units
  - `units` — array of champions with `character_id`, `items` (array of item IDs), `tier` (star level), `rarity`
  - `placement` — final placement (1-8)
  - `level` — player level at end of game
  - `gold_left` — remaining gold
  - `last_round` — round eliminated
- **Limitation:** Only captures final board state at elimination, not round-by-round progression
- **Limitation:** Does not capture what augments/items were OFFERED, only what was CHOSEN
- **Regional routing:** Match IDs use regional routing (americas, europe, asia, sea)

#### TFT Summoner/Account APIs
- `tft-summoner-v1` — convert summoner name to PUUID
- `riot-account-v1` — account lookups by Riot ID
- `tft-league-v1` — ranked ladder data (Challenger, Grandmaster, Master tiers)

#### TFT League API (`tft-league-v1`)
- Used to discover high-elo players to scrape match data from
- **Endpoints:**
  - `GET /tft/league/v1/challenger` — all Challenger players
  - `GET /tft/league/v1/grandmaster` — all Grandmaster players
  - `GET /tft/league/v1/master` — all Master players

### 2.2 Static Data Sources

#### Data Dragon (ddragon)
- **Champions:** `https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/tft-champion.json`
- **Items:** `https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/tft-item.json`
- **Augments:** `https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/tft-augments.json`
- **Traits:** `https://ddragon.leagueoflegends.com/cdn/{version}/data/en_US/tft-trait.json`
- **Images:** Available under `img/tft-champion/`, `img/tft-item/`, `img/tft-augment/`, etc.
- **Version discovery:** `https://ddragon.leagueoflegends.com/realms/na.json`

#### Community Dragon (cdragon)
- Fills gaps in Data Dragon (e.g., more detailed augment descriptions, emblem data, artifact data)
- **Base URL:** `https://raw.communitydragon.org/latest/cdragon/tft/`
- More frequently updated than official Data Dragon

### 2.3 API Key Strategy

| Phase | Key Type | Rate Limit | Notes |
|-------|----------|------------|-------|
| Development | Development Key | ~20 req/sec, ~100 req/2min | Expires every 24 hours, must regenerate daily |
| Closed Testing | Personal Key | Similar to dev | Does not expire; for private/small community use only |
| Production Launch | Production Key | ~300+ req/sec/region | Requires approved application with working prototype, ToS, Privacy Policy, and website |

**Critical policy notes:**
- You CANNOT use a development key in production, even temporarily during the approval process
- Production key approval takes ~2-3 weeks (sometimes longer)
- One API key per product per game — you need a separate TFT-specific application
- Your app must be registered on the Developer Portal regardless of whether it uses the API

### 2.4 Riot Policy Compliance (TFT-Specific)

**MUST follow these rules:**

1. **Show multiple options, never single prescriptions** — "Top 3 comps for your situation" is allowed. "Play THIS comp" as a single directive is not.
2. **Only use pre-game knowledge** — Augment statistics, trait synergies, item data are all public metadata. This is allowed.
3. **Do not bypass skill tests** — The tool should help players make INFORMED decisions, not remove the decision entirely.
4. **Highlight important decisions and present choices** — This is explicitly allowed by Riot's TFT policy.
5. **No real-time scouting of opponents** — Our tool only helps the user with THEIR inputs, not tracking what opponents are playing live.
6. **Product must be free (with optional ads)** — A free tier with advertising is explicitly permitted. Paid premium features are allowed if they are "transformative" (adding new insights).

---

## 3. System Architecture

### 3.1 High-Level Components

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Web App)                     │
│  Next.js / React                                         │
│  - Situational Input UI (emblems, augments, items)       │
│  - Comp Recommendation Display (ranked list)             │
│  - Comp Detail Views (champions, items, positioning)     │
│  - Patch notes / meta overview                           │
│  - Google AdSense integration                            │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API / tRPC
┌──────────────────────▼──────────────────────────────────┐
│                   BACKEND API SERVER                      │
│  Node.js (Express/Fastify) or Python (FastAPI)           │
│  - /api/recommend — accepts game state, returns comps    │
│  - /api/comps — list current meta comps                  │
│  - /api/augments — augment stats and synergies           │
│  - /api/items — item stats and build paths               │
│  - /api/patch — current patch info and data freshness    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                     DATABASE                             │
│  PostgreSQL                                              │
│  - matches (raw match records)                           │
│  - participants (per-player match data)                  │
│  - comp_clusters (identified meta comps)                 │
│  - augment_stats (aggregated augment performance)        │
│  - emblem_stats (emblem usage and placement data)        │
│  - item_stats (item combinations and performance)        │
│  - recommendations_cache (pre-computed recommendations)  │
│  - static_data (champions, traits, items — per patch)    │
│  - patches (patch version tracking and data boundaries)  │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                DATA INGESTION PIPELINE                    │
│  Scheduled workers (cron / queue-based)                  │
│  - Player Discovery: pull Challenger/GM/Master ladders   │
│  - Match Ingestion: fetch recent matches for those       │
│    players, parse and store participant data              │
│  - Static Data Sync: pull Data Dragon / CDragon on       │
│    patch days                                            │
│  - Aggregation Jobs: compute comp clusters, augment      │
│    stats, emblem stats after each ingestion batch        │
│  - Patch Detection: detect new patches and mark data     │
│    boundaries                                            │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Data Ingestion Pipeline — Detailed Design

This is the backbone of the entire product. Without a robust data pipeline, there's nothing to recommend.

#### 3.2.1 Player Discovery
- **Frequency:** Every 6-12 hours
- **Process:**
  1. Call `tft-league-v1/challenger`, `/grandmaster`, `/master` for each region (NA, EUW, KR, etc.)
  2. Extract summoner IDs and PUUIDs
  3. Store/update in `players` table with rank and region
- **Target:** ~2,000-5,000 high-elo players across regions
- **Why high-elo only:** Their gameplay represents "optimal" play patterns; lower-elo data introduces noise from suboptimal builds

#### 3.2.2 Match Ingestion
- **Frequency:** Every 2-6 hours (configurable; start with every 6 hours and increase)
- **Process:**
  1. For each tracked player, call `tft-match-v1/matches/by-puuid/{puuid}` to get recent match IDs
  2. Deduplicate match IDs (each match appears for 8 players)
  3. For each new match ID, call `tft-match-v1/matches/{matchId}` to get full match data
  4. Parse all 8 participants and store: augments, traits, units (with items), placement, level, gold_left, last_round
  5. Tag each match with patch version (extracted from `game_version` field)
- **Rate limit management:** Queue-based with backoff; respect per-method and per-app limits
- **Deduplication:** Track ingested match IDs in a `seen_matches` set (Redis or DB table)
- **Expected volume:** ~10,000-50,000 matches per day across all regions

#### 3.2.3 Static Data Sync
- **Frequency:** On patch day (check daily; TFT patches are typically every 2 weeks)
- **Process:**
  1. Check `https://ddragon.leagueoflegends.com/realms/na.json` for version changes
  2. If new version detected, download all TFT JSON files (champions, items, augments, traits)
  3. Store versioned static data in DB or local cache
  4. Download and cache all champion/item/augment images
  5. Cross-reference with CommunityDragon for any missing data

#### 3.2.4 Aggregation & Comp Detection
- **Frequency:** After each ingestion batch completes
- **Process:**
  1. **Comp Clustering:** Group matches by trait combinations to identify distinct "comps" (e.g., 6 Yordles + 2 Sorcerer is a "comp cluster")
  2. **Comp Statistics:** For each identified comp, calculate: average placement, play rate, top-4 rate, win rate, sample size
  3. **Augment Statistics:** For each augment, calculate: average placement overall, average placement per comp, pick rate
  4. **Emblem Statistics:** For each emblem (spatula item), calculate: which comps use it, which champion it's placed on, placement impact
  5. **Item Statistics:** For each item, calculate: which comps use it, which champion carries it, placement correlation
  6. **Cross-Reference Stats:** For augment+comp combos, emblem+comp combos, etc.
- **Patch boundaries:** Only aggregate data from the current patch (or include previous patch with decay weighting if current patch data is still sparse)

### 3.3 Recommendation Engine — Detailed Design

This is the core IP/logic of the product.

#### 3.3.1 Input Schema

```typescript
interface GameStateInput {
  // What the user currently has or has chosen
  augments: string[];           // IDs of augments already chosen (0-3)
  emblems: string[];            // IDs of emblems/spatula items available (0-3+)
  items: string[];              // IDs of completed items or components held
  artifacts?: string[];         // IDs of any special artifacts (Radiant, Ornn, etc.)

  // Optional refinements
  currentChampions?: string[];  // Champions currently on board (for mid-game updates)
  level?: number;               // Current player level (affects available champion pool)
  stage?: string;               // Current game stage (e.g., "3-2") — affects how much pivoting is realistic

  // Filtering preferences
  augmentChoices?: string[];    // If currently on augment selection screen, the 3 options offered
  preferredTraits?: string[];   // Optional: user wants to lean toward certain traits
}
```

#### 3.3.2 Recommendation Logic (Prioritized Approach)

**Tier 1 — Exact Match (highest confidence):**
- Query aggregated data for the EXACT combination of augments + emblems
- If sample size >= threshold (e.g., 200+ games), return comps ranked by average placement
- This handles common/popular combinations

**Tier 2 — Partial Match / Decomposition (medium confidence):**
- If exact combo data is sparse, decompose into sub-queries:
  - "Comps that work well with augment A" ∩ "Comps that work well with emblem B"
  - Score comps by how well they match EACH input independently, then combine scores
- Also consider: "Strong meta comps where applying emblem X to champion Y would enable a higher trait breakpoint"

**Tier 3 — Inference from Meta Comps (lower confidence, but still useful):**
- Start from the current top meta comps
- For each, calculate a "fit score" based on how well the user's items/emblems/augments align
- E.g., "Comp A is ranked #2 this patch, and your Bloodthirster + omnivamp augment give its carry 40% more sustain than average"
- This is the fallback for truly rare combinations

**Augment Selection Mode:**
- When the user provides `augmentChoices` (the 3 options on screen), evaluate each option against:
  1. The comp they're currently building toward (if `currentChampions` is set)
  2. General augment performance stats
  3. Synergy with their existing augments and items
- Return a ranked evaluation of each augment choice with reasoning

#### 3.3.3 Output Schema

```typescript
interface RecommendationResponse {
  recommendations: CompRecommendation[];  // Ranked list, typically top 3-5
  meta: {
    patchVersion: string;
    dataFreshness: string;         // ISO timestamp of last aggregation
    totalMatchesAnalyzed: number;
    confidence: "high" | "medium" | "low";  // Based on sample sizes
  };
}

interface CompRecommendation {
  rank: number;
  compName: string;                // Human-readable name (e.g., "6 Yordle Sorcerers")
  traits: TraitBreakdown[];        // Trait names and breakpoints
  champions: ChampionSlot[];       // Recommended champions with positions
  items: ItemRecommendation[];     // Best items for each carry
  stats: {
    avgPlacement: number;          // e.g., 3.2
    top4Rate: number;              // e.g., 0.68
    winRate: number;               // e.g., 0.18
    playRate: number;              // e.g., 0.05
    sampleSize: number;            // e.g., 1,247 games
  };
  fitScore: number;                // 0-100, how well this fits the user's inputs
  fitExplanation: string[];        // Array of reasons why this comp fits
  // e.g., ["Your Yordle emblem enables 6 Yordle without needing Veigar",
  //        "Omnivamp augment synergizes with Lulu's shield-heavy playstyle"]
  emblemApplication?: {
    emblem: string;
    bestChampion: string;
    reasoning: string;
  };
}
```

### 3.4 Frontend — Detailed Design

#### 3.4.1 Core Pages

1. **Home / Advisor Page** (primary feature)
   - Multi-step or sidebar input panel:
     - Augment selector (searchable, with icons)
     - Emblem selector (searchable, with icons)
     - Item selector (drag-and-drop component combining, or direct selection)
     - Optional: champion board input
   - Results panel: ranked comp cards with expandable details
   - "Update" flow: as user gets new augment choices, they can add to inputs and re-query

2. **Meta Overview Page**
   - Current patch's top comps (similar to existing sites, but as a baseline)
   - Augment tier list with per-comp breakdowns
   - Item tier list
   - Trend data: comps rising/falling in play rate and win rate

3. **Comp Detail Page**
   - Full breakdown of a specific comp: champions, items, positioning guide
   - Augment synergies ranked
   - Emblem options ranked
   - Matchup data (if available): how this comp performs against other popular comps

4. **Patch Notes / Data Status Page**
   - Current patch info
   - Data collection status (how many games analyzed this patch)
   - Known limitations or data gaps

#### 3.4.2 UX Priorities

- **Speed:** Recommendations should return in < 500ms (use pre-computed caches)
- **Mobile-friendly:** Many players will use this on their phone while playing on PC
- **Visual:** Use champion/item/augment icons from Data Dragon throughout
- **Transparency:** Always show sample sizes and confidence levels so users know how reliable a recommendation is

### 3.5 Tech Stack Recommendation (Claude Code should confirm/adjust)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js (React) + TypeScript | SSR for SEO (important for organic traffic), React ecosystem, TypeScript for type safety |
| Styling | Tailwind CSS | Rapid iteration, responsive design, good for utility-first approach |
| Backend API | Next.js API routes or separate FastAPI (Python) | If recommendation logic is Python-heavy (data science), FastAPI is better; if keeping it simple, Next.js API routes work |
| Database | PostgreSQL | Relational model fits comp/trait/item relationships well; good aggregation query support |
| Cache | Redis | Cache pre-computed recommendations, hot comp data, rate limit tracking |
| Data Pipeline | Python scripts + cron (or Bull queue for Node) | Python has best Riot API libraries (riotwatcher); scheduled workers for ingestion |
| ORM | Prisma (if Node) or SQLAlchemy (if Python) | Type-safe database access |
| Hosting | Vercel (frontend) + Railway/Render/AWS (backend + DB + workers) | Vercel for Next.js is excellent; separate compute for data pipeline workers |
| Image CDN | Serve from Data Dragon URLs directly, or cache in Cloudflare | Avoid hosting thousands of champion/item images yourself |
| Ads | Google AdSense | Simplest starting point; upgrade to Venatus/Playwire at scale |

---

## 4. Database Schema (Initial Design)

> **Note for Claude Code:** This is a starting point. Please review and suggest refinements, especially around indexing, partitioning by patch, and the comp clustering model.

### 4.1 Core Tables

```sql
-- Track TFT patches and data boundaries
CREATE TABLE patches (
    id SERIAL PRIMARY KEY,
    patch_version VARCHAR(20) NOT NULL UNIQUE,  -- e.g., "14.23"
    set_number INTEGER NOT NULL,                 -- e.g., 13 (for Set 13)
    release_date TIMESTAMP,
    is_current BOOLEAN DEFAULT FALSE,
    data_sufficient BOOLEAN DEFAULT FALSE,       -- enough games to make recommendations?
    match_count INTEGER DEFAULT 0
);

-- Tracked high-elo players
CREATE TABLE players (
    puuid VARCHAR(128) PRIMARY KEY,
    summoner_name VARCHAR(64),
    region VARCHAR(10) NOT NULL,                 -- na1, euw1, kr, etc.
    tier VARCHAR(20),                            -- CHALLENGER, GRANDMASTER, MASTER
    league_points INTEGER,
    last_fetched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Raw match records
CREATE TABLE matches (
    match_id VARCHAR(64) PRIMARY KEY,            -- e.g., "NA1_4365831750"
    patch_id INTEGER REFERENCES patches(id),
    game_version VARCHAR(64),
    game_datetime TIMESTAMP,
    game_length_seconds INTEGER,
    queue_id INTEGER,                            -- ranked, normal, etc.
    set_number INTEGER,
    ingested_at TIMESTAMP DEFAULT NOW()
);

-- Per-participant data (8 rows per match)
CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    match_id VARCHAR(64) REFERENCES matches(match_id),
    puuid VARCHAR(128),
    placement INTEGER NOT NULL,                  -- 1-8
    level INTEGER,
    gold_left INTEGER,
    last_round INTEGER,
    players_eliminated INTEGER,
    augments JSONB NOT NULL,                     -- ["augment_id_1", "augment_id_2", "augment_id_3"]
    traits JSONB NOT NULL,                       -- [{name, num_units, tier_current, tier_total}, ...]
    units JSONB NOT NULL,                        -- [{character_id, items: [], tier, rarity}, ...]
    UNIQUE(match_id, puuid)
);

-- Pre-identified comp archetypes (updated by aggregation jobs)
CREATE TABLE comp_archetypes (
    id SERIAL PRIMARY KEY,
    patch_id INTEGER REFERENCES patches(id),
    comp_name VARCHAR(128),                      -- Human-readable: "6 Yordle Sorcerers"
    trait_signature JSONB NOT NULL,              -- Key traits that define this comp
    core_champions JSONB NOT NULL,               -- Must-have champions
    flex_slots JSONB,                            -- Champions that can vary
    avg_placement DECIMAL(4,2),
    top4_rate DECIMAL(4,3),
    win_rate DECIMAL(4,3),
    play_rate DECIMAL(4,3),
    sample_size INTEGER,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- Aggregated augment performance stats
CREATE TABLE augment_stats (
    id SERIAL PRIMARY KEY,
    patch_id INTEGER REFERENCES patches(id),
    augment_id VARCHAR(128) NOT NULL,
    comp_archetype_id INTEGER REFERENCES comp_archetypes(id),  -- NULL = overall stats
    avg_placement DECIMAL(4,2),
    pick_rate DECIMAL(4,3),
    sample_size INTEGER,
    UNIQUE(patch_id, augment_id, comp_archetype_id)
);

-- Aggregated emblem performance stats
CREATE TABLE emblem_stats (
    id SERIAL PRIMARY KEY,
    patch_id INTEGER REFERENCES patches(id),
    emblem_item_id VARCHAR(128) NOT NULL,        -- The spatula item ID
    comp_archetype_id INTEGER REFERENCES comp_archetypes(id),
    applied_to_champion VARCHAR(128),            -- Which champion carries the emblem
    avg_placement DECIMAL(4,2),
    usage_rate DECIMAL(4,3),
    sample_size INTEGER
);

-- Aggregated item performance stats
CREATE TABLE item_stats (
    id SERIAL PRIMARY KEY,
    patch_id INTEGER REFERENCES patches(id),
    item_id VARCHAR(128) NOT NULL,
    comp_archetype_id INTEGER REFERENCES comp_archetypes(id),
    carried_by_champion VARCHAR(128),
    avg_placement DECIMAL(4,2),
    usage_rate DECIMAL(4,3),
    sample_size INTEGER
);

-- Cached static game data (per patch)
CREATE TABLE static_data (
    id SERIAL PRIMARY KEY,
    patch_version VARCHAR(20) NOT NULL,
    data_type VARCHAR(20) NOT NULL,              -- 'champions', 'items', 'augments', 'traits'
    data JSONB NOT NULL,
    fetched_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(patch_version, data_type)
);

-- Pre-computed recommendation cache
CREATE TABLE recommendation_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(512) NOT NULL UNIQUE,      -- Hash of input combination
    patch_id INTEGER REFERENCES patches(id),
    input_signature JSONB NOT NULL,              -- The input that generated this cache entry
    recommendations JSONB NOT NULL,              -- The full recommendation response
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP                         -- Invalidate after new aggregation
);
```

### 4.2 Key Indexes to Consider

```sql
CREATE INDEX idx_participants_match_id ON participants(match_id);
CREATE INDEX idx_participants_placement ON participants(placement);
CREATE INDEX idx_participants_augments ON participants USING GIN(augments);
CREATE INDEX idx_participants_traits ON participants USING GIN(traits);
CREATE INDEX idx_participants_units ON participants USING GIN(units);
CREATE INDEX idx_matches_patch ON matches(patch_id);
CREATE INDEX idx_matches_datetime ON matches(game_datetime);
CREATE INDEX idx_comp_archetypes_patch ON comp_archetypes(patch_id);
CREATE INDEX idx_augment_stats_patch_augment ON augment_stats(patch_id, augment_id);
CREATE INDEX idx_emblem_stats_patch_emblem ON emblem_stats(patch_id, emblem_item_id);
```

---

## 5. Key Technical Challenges & Open Questions

> **For Claude Code:** These are areas where I need your input. Please ask me questions about these and propose solutions.

### 5.1 Comp Clustering / Archetype Detection

**Challenge:** How do we automatically identify distinct "comps" from raw match data? Players don't always play textbook versions of comps — there's a lot of flex in the final 1-2 champion slots.

**Open questions:**
- Should we use trait-signature-based clustering (e.g., "any board with 6+ Yordle units = Yordle comp")?
- Should we use champion-based clustering (e.g., "any board with Jinx carry = Jinx carry comp")?
- Should we use a combination with some ML clustering (e.g., k-means on trait vectors)?
- How do we handle "flex comps" that can pivot between two archetypes mid-game?
- What's the minimum trait threshold to classify something as a distinct comp vs. just noise?

### 5.2 Fit Score Calculation

**Challenge:** When a user inputs their game state, how exactly do we calculate a "fit score" for each comp?

**Open questions:**
- How do we weight different input types? (Is having the right emblem more impactful than having a synergistic augment?)
- How do we handle negative signals? (e.g., user has items that are terrible for a comp)
- Should we account for "item flexibility" — some comps work with many different items, others are rigid?
- How do we factor in the current game stage? (Stage 2 = more flexibility to pivot; Stage 5 = you're committed)

### 5.3 Sparse Data & Cold Start

**Challenge:** Rare combinations (3 specific emblems + specific augment) may have very few data points.

**Open questions:**
- What's our minimum sample size threshold before we show a recommendation?
- How do we communicate confidence to the user? (e.g., "Based on 47 games" vs "Based on 3,200 games")
- What's our fallback chain? (Exact match → partial decomposition → meta comp inference)
- Should we use Bayesian averaging to smooth rare combo stats toward the overall mean?

### 5.4 Patch Transition Handling

**Challenge:** When a new patch drops, our historical data may be misleading due to champion/item/augment changes.

**Open questions:**
- How many games of data do we need before we're "confident" in a new patch's meta?
- Should we show a "low confidence" banner during the first few days of a new patch?
- Should we weight recent games more heavily than older games within the same patch?
- For minor patches (hotfixes), do we reset data or just continue accumulating?

### 5.5 Emblem Application Inference

**Challenge:** Our key IP — "given this emblem, which champion in which comp should you put it on?"

**Open questions:**
- Do we infer this purely from match data (e.g., "in games where Yordle emblem was used in comp X, it was most often on champion Y")?
- Do we also build rule-based logic (e.g., "applying this emblem to champion Z enables a trait breakpoint")?
- How do we handle cases where emblem placement varies a lot even within the same comp?

### 5.6 Rate Limit & Ingestion Scaling

**Open questions:**
- With production rate limits of ~300 req/sec/region, how many matches can we realistically ingest per hour?
- Should we prioritize certain regions (e.g., KR tends to innovate comps first)?
- How do we handle API outages or temporary rate limit reductions?
- Should we run separate workers per region to maximize throughput?

---

## 6. Development Phases

### Phase 1: Foundation (Weeks 1-3)
- [ ] Set up project repository and monorepo structure
- [ ] Set up PostgreSQL database with initial schema
- [ ] Register on Riot Developer Portal, get development API key
- [ ] Build data ingestion pipeline (player discovery + match fetching)
- [ ] Build static data sync (Data Dragon + CommunityDragon)
- [ ] Start ingesting match data from NA/EUW/KR Challenger/GM/Master
- [ ] Build basic aggregation queries to validate data quality

### Phase 2: Core Logic (Weeks 4-6)
- [ ] Implement comp archetype detection / clustering algorithm
- [ ] Build augment stats aggregation
- [ ] Build emblem stats aggregation
- [ ] Build item stats aggregation
- [ ] Implement recommendation engine (Tier 1, 2, 3 logic)
- [ ] Build fit score calculation
- [ ] Create API endpoints for recommendations

### Phase 3: Frontend (Weeks 7-9)
- [ ] Build Next.js app with core pages
- [ ] Implement situational input UI (augment/emblem/item selectors)
- [ ] Build comp recommendation display (ranked cards with stats)
- [ ] Build comp detail pages
- [ ] Build meta overview page
- [ ] Mobile responsive design
- [ ] Integrate champion/item/augment images from Data Dragon

### Phase 4: Polish & Launch Prep (Weeks 10-12)
- [ ] Write Terms of Service and Privacy Policy
- [ ] Set up production hosting (Vercel + backend infrastructure)
- [ ] Apply for Riot Production API Key (submit prototype)
- [ ] Integrate Google AdSense
- [ ] Add loading states, error handling, empty states
- [ ] Performance optimization (caching, query optimization)
- [ ] Set up monitoring and alerting for data pipeline
- [ ] Beta testing with TFT community

### Phase 5: Post-Launch Iteration
- [ ] Monitor user feedback and iterate on recommendation quality
- [ ] Add augment selection mode (evaluate 3 augment choices)
- [ ] Add positioning guides for recommended comps
- [ ] Potentially add user accounts for saved preferences / history
- [ ] Explore premium features if traffic warrants it
- [ ] Upgrade ad network to Venatus/Playwire if traffic exceeds 50k+ sessions/month

---

## 7. Monetization Plan

### 7.1 Advertising (Primary Revenue)

**Phase 1 — Google AdSense:**
- No minimum traffic requirement
- Easy setup, paste ad code into Next.js layout
- Expected eCPM: $1-5 for gaming content
- Ad placements: sidebar on desktop, between-content on mobile, below recommendation results

**Phase 2 — Gaming-Specific Ad Networks (at scale):**
- **Venatus** — specializes in gaming/entertainment publishers, direct advertiser relationships
- **Playwire** — enterprise-grade ad stack, strong gaming vertical presence
- These require application and minimum traffic thresholds (~50k-100k monthly sessions)

**Riot Policy Compliance:**
- Free access is mandatory — cannot gate core features behind a paywall
- Ads are explicitly permitted per Riot's developer monetization policy
- The product must be "transformative" (adding new insights to raw data) — our recommendation engine qualifies

### 7.2 Potential Premium Features (Optional, Future)

- Ad-free experience (subscription)
- Personal match history analysis ("here's what you should have played last game")
- Custom alerts ("notify me when a new strong comp emerges for my playstyle")
- All premium features must still have a free tier equivalent per Riot's policy

---

## 8. Legal & Compliance Checklist

- [ ] Register product on Riot Developer Portal
- [ ] Read and comply with Riot Games API Terms of Service
- [ ] Read and comply with TFT-specific game policy
- [ ] Write Terms of Service for the website
- [ ] Write Privacy Policy (especially if collecting any user data)
- [ ] Include Riot Games attribution: "This product is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties."
- [ ] Do not use Riot Games trademarks in the product name or imply official endorsement
- [ ] Ensure no GDPR violations if serving EU users (Privacy Policy must cover this)
- [ ] Google AdSense compliance (content policies, ad placement rules)

---

## 9. Questions for Claude Code

Before we start building, I'd like you to:

1. **Review this entire spec** and identify any gaps, contradictions, or areas that need more detail.
2. **Ask me clarifying questions** about my preferences on:
   - Tech stack (do I have experience with any of these technologies? preferences?)
   - Hosting budget constraints
   - Design/UX preferences or inspiration sites
   - Which phase I want to start with
   - How I want to handle the comp clustering problem
   - My experience level with databases, APIs, and frontend development
3. **Propose a project structure** (directory layout, monorepo vs separate repos, etc.)
4. **Identify the riskiest technical unknowns** and suggest spikes/prototypes to de-risk them early.
5. **Suggest any architecture changes** you think would improve the system based on your experience.

Let's build this.
