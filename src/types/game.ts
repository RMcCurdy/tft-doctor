/** Core TFT game entity types — champions, items, augments, traits, emblems, artifacts */

export interface Champion {
  id: string; // e.g., "TFT13_Jinx"
  name: string; // e.g., "Jinx"
  cost: number; // 1-5
  traits: string[]; // trait IDs this champion belongs to
  icon: string; // Data Dragon icon path
}

export interface ChampionAbility {
  name: string;
  description: string;
  icon: string;
}

export interface ChampionTraitDetail {
  id: string;
  name: string;
  description: string;
  icon: string;
  breakpoints: TraitBreakpoint[];
}

export interface SuggestedItem {
  id: string;
  name: string;
  icon: string;
  frequency: number; // number of comps recommending this item
}

export interface ChampionDetailData {
  id: string;
  name: string;
  cost: number;
  icon: string;
  traits: ChampionTraitDetail[];
  ability: ChampionAbility | null;
  suggestedItems: SuggestedItem[];
}

export interface Item {
  id: string; // e.g., "TFT_Item_InfinityEdge"
  name: string; // e.g., "Infinity Edge"
  description: string;
  components: string[]; // IDs of the two component items (empty for components themselves)
  icon: string;
  isComponent: boolean;
  isEmblem: boolean;
  isArtifact: boolean;
  isRadiant: boolean;
}

export interface Augment {
  id: string; // e.g., "TFT9_Augment_CyberneticImplants1"
  name: string; // e.g., "Cybernetic Implants I"
  description: string;
  tier: AugmentTier;
  icon: string;
}

export type AugmentTier = "silver" | "gold" | "prismatic";

export interface Trait {
  id: string; // e.g., "Set13_Yordle"
  name: string; // e.g., "Yordle"
  description: string;
  breakpoints: TraitBreakpoint[];
  icon: string;
}

export interface TraitBreakpoint {
  minUnits: number; // e.g., 2, 4, 6
  style: "bronze" | "silver" | "gold" | "chromatic";
}

export interface Emblem {
  id: string; // e.g., "TFT_Item_YordleEmblem"
  name: string; // e.g., "Yordle Emblem"
  traitId: string; // The trait this emblem grants
  icon: string;
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "ornn" | "radiant" | "other";
}
