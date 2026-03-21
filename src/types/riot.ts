/** Raw Riot API response types for TFT endpoints */

/** Response from tft-match-v1/matches/{matchId} */
export interface RiotMatchResponse {
  metadata: {
    data_version: string;
    match_id: string;
    participants: string[]; // PUUIDs
  };
  info: {
    game_datetime: number; // epoch ms
    game_length: number; // seconds
    game_version: string; // e.g., "Version 14.23.123.456"
    queue_id: number;
    tft_game_type: string;
    tft_set_core_name: string;
    tft_set_number: number;
    participants: RiotParticipant[];
  };
}

export interface RiotParticipant {
  puuid: string;
  placement: number; // 1-8
  level: number;
  gold_left: number;
  last_round: number;
  players_eliminated: number;
  augments: string[]; // e.g., ["TFT9_Augment_CyberneticImplants1"]
  traits: RiotTrait[];
  units: RiotUnit[];
  companion: {
    content_ID: string;
    skin_ID: number;
    species: string;
  };
}

export interface RiotTrait {
  name: string; // e.g., "Set13_Yordle"
  num_units: number;
  style: number; // 0 = inactive, 1+ = bronze/silver/gold/chromatic
  tier_current: number;
  tier_total: number;
}

export interface RiotUnit {
  character_id: string; // e.g., "TFT13_Jinx"
  items: number[]; // item IDs as numbers
  itemNames: string[]; // item IDs as strings
  name: string;
  rarity: number; // champion cost tier (0-indexed: 0=1cost, 4=5cost)
  tier: number; // star level (1-3)
}

/** Response from tft-league-v1/challenger (or grandmaster/master) */
export interface RiotLeagueResponse {
  tier: string;
  leagueId: string;
  queue: string;
  name: string;
  entries: RiotLeagueEntry[];
}

export interface RiotLeagueEntry {
  summonerId: string;
  puuid: string;
  leaguePoints: number;
  rank: string;
  wins: number;
  losses: number;
}

/** Response from tft-match-v1/matches/by-puuid/{puuid}/ids */
export type RiotMatchIdList = string[];

/** Regions for Riot API routing */
export type RiotRegion = "na1" | "euw1" | "kr" | "jp1" | "oc1" | "br1" | "la1" | "la2" | "tr1" | "ru" | "ph2" | "sg2" | "th2" | "tw2" | "vn2";

/** Regional routing values for match endpoints */
export type RiotRoutingRegion = "americas" | "europe" | "asia" | "sea";
