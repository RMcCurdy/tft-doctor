import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ─── Patches ────────────────────────────────────────────────────────────────

export const patches = pgTable("patches", {
  id: serial("id").primaryKey(),
  patchVersion: varchar("patch_version", { length: 20 }).notNull().unique(),
  setNumber: integer("set_number").notNull(),
  releaseDate: timestamp("release_date"),
  isCurrent: boolean("is_current").default(false),
  dataSufficient: boolean("data_sufficient").default(false),
  matchCount: integer("match_count").default(0),
});

// ─── Players ────────────────────────────────────────────────────────────────

export const players = pgTable(
  "players",
  {
    puuid: varchar("puuid", { length: 128 }).primaryKey(),
    summonerName: varchar("summoner_name", { length: 64 }),
    region: varchar("region", { length: 10 }).notNull(),
    tier: varchar("tier", { length: 20 }),
    leaguePoints: integer("league_points"),
    lastFetchedAt: timestamp("last_fetched_at"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [index("idx_players_region").on(table.region)]
);

// ─── Matches ────────────────────────────────────────────────────────────────

export const matches = pgTable(
  "matches",
  {
    matchId: varchar("match_id", { length: 64 }).primaryKey(),
    patchId: integer("patch_id").references(() => patches.id),
    gameVersion: varchar("game_version", { length: 64 }),
    gameDatetime: timestamp("game_datetime"),
    gameLengthSeconds: integer("game_length_seconds"),
    queueId: integer("queue_id"),
    setNumber: integer("set_number"),
    processedAt: timestamp("processed_at"), // Set after aggregation; enables purge
    ingestedAt: timestamp("ingested_at").defaultNow(),
  },
  (table) => [
    index("idx_matches_patch").on(table.patchId),
    index("idx_matches_datetime").on(table.gameDatetime),
    index("idx_matches_processed").on(table.processedAt),
  ]
);

// ─── Participants ───────────────────────────────────────────────────────────

export const participants = pgTable(
  "participants",
  {
    id: serial("id").primaryKey(),
    matchId: varchar("match_id", { length: 64 })
      .notNull()
      .references(() => matches.matchId, { onDelete: "cascade" }),
    puuid: varchar("puuid", { length: 128 }),
    placement: integer("placement").notNull(),
    level: integer("level"),
    goldLeft: integer("gold_left"),
    lastRound: integer("last_round"),
    playersEliminated: integer("players_eliminated"),
    augments: jsonb("augments").notNull(), // string[]
    traits: jsonb("traits").notNull(), // RiotTrait[]
    units: jsonb("units").notNull(), // RiotUnit[]
  },
  (table) => [
    uniqueIndex("idx_participants_match_puuid").on(table.matchId, table.puuid),
    index("idx_participants_match_id").on(table.matchId),
    index("idx_participants_placement").on(table.placement),
  ]
);

// ─── Comp Archetypes ────────────────────────────────────────────────────────

export const compArchetypes = pgTable(
  "comp_archetypes",
  {
    id: serial("id").primaryKey(),
    patchId: integer("patch_id").references(() => patches.id),
    compName: varchar("comp_name", { length: 128 }),
    traitSignature: jsonb("trait_signature").notNull(), // key traits defining this comp
    coreChampions: jsonb("core_champions").notNull(), // must-have champions
    flexSlots: jsonb("flex_slots"), // variable champion slots
    primaryCarry: varchar("primary_carry", { length: 128 }),
    secondaryCarry: varchar("secondary_carry", { length: 128 }),
    isReroll: boolean("is_reroll").default(false),
    requiresEmblem: varchar("requires_emblem", { length: 128 }),
    avgPlacement: decimal("avg_placement", { precision: 4, scale: 2 }),
    top4Rate: decimal("top4_rate", { precision: 4, scale: 3 }),
    winRate: decimal("win_rate", { precision: 4, scale: 3 }),
    playRate: decimal("play_rate", { precision: 4, scale: 3 }),
    sampleSize: integer("sample_size"),
    lastUpdated: timestamp("last_updated").defaultNow(),
  },
  (table) => [index("idx_comp_archetypes_patch").on(table.patchId)]
);

// ─── Augment Stats ──────────────────────────────────────────────────────────

export const augmentStats = pgTable(
  "augment_stats",
  {
    id: serial("id").primaryKey(),
    patchId: integer("patch_id").references(() => patches.id),
    augmentId: varchar("augment_id", { length: 128 }).notNull(),
    compArchetypeId: integer("comp_archetype_id").references(
      () => compArchetypes.id
    ), // NULL = overall stats
    avgPlacement: decimal("avg_placement", { precision: 4, scale: 2 }),
    pickRate: decimal("pick_rate", { precision: 4, scale: 3 }),
    sampleSize: integer("sample_size"),
  },
  (table) => [
    uniqueIndex("idx_augment_stats_unique").on(
      table.patchId,
      table.augmentId,
      table.compArchetypeId
    ),
    index("idx_augment_stats_patch_augment").on(
      table.patchId,
      table.augmentId
    ),
  ]
);

// ─── Emblem Stats ───────────────────────────────────────────────────────────

export const emblemStats = pgTable(
  "emblem_stats",
  {
    id: serial("id").primaryKey(),
    patchId: integer("patch_id").references(() => patches.id),
    emblemItemId: varchar("emblem_item_id", { length: 128 }).notNull(),
    compArchetypeId: integer("comp_archetype_id").references(
      () => compArchetypes.id
    ),
    appliedToChampion: varchar("applied_to_champion", { length: 128 }),
    avgPlacement: decimal("avg_placement", { precision: 4, scale: 2 }),
    usageRate: decimal("usage_rate", { precision: 4, scale: 3 }),
    sampleSize: integer("sample_size"),
  },
  (table) => [
    index("idx_emblem_stats_patch_emblem").on(
      table.patchId,
      table.emblemItemId
    ),
  ]
);

// ─── Item Stats ─────────────────────────────────────────────────────────────

export const itemStats = pgTable(
  "item_stats",
  {
    id: serial("id").primaryKey(),
    patchId: integer("patch_id").references(() => patches.id),
    itemId: varchar("item_id", { length: 128 }).notNull(),
    compArchetypeId: integer("comp_archetype_id").references(
      () => compArchetypes.id
    ),
    carriedByChampion: varchar("carried_by_champion", { length: 128 }),
    avgPlacement: decimal("avg_placement", { precision: 4, scale: 2 }),
    usageRate: decimal("usage_rate", { precision: 4, scale: 3 }),
    sampleSize: integer("sample_size"),
  },
  (table) => [
    index("idx_item_stats_patch_item").on(table.patchId, table.itemId),
  ]
);

// ─── Static Data ────────────────────────────────────────────────────────────

export const staticData = pgTable(
  "static_data",
  {
    id: serial("id").primaryKey(),
    patchVersion: varchar("patch_version", { length: 20 }).notNull(),
    dataType: varchar("data_type", { length: 20 }).notNull(), // champions, items, augments, traits
    data: jsonb("data").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("idx_static_data_unique").on(
      table.patchVersion,
      table.dataType
    ),
  ]
);

// ─── Recommendation Cache ───────────────────────────────────────────────────

export const recommendationCache = pgTable(
  "recommendation_cache",
  {
    id: serial("id").primaryKey(),
    cacheKey: varchar("cache_key", { length: 512 }).notNull().unique(),
    patchId: integer("patch_id").references(() => patches.id),
    inputSignature: jsonb("input_signature").notNull(),
    recommendations: jsonb("recommendations").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (table) => [index("idx_rec_cache_patch").on(table.patchId)]
);
