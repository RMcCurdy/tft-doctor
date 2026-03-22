"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { GameIcon } from "@/components/shared/GameIcon";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StaticChampion, StaticEntity } from "@/hooks/useStaticData";

const COST_BORDER: Record<number, string> = {
  1: "ring-zinc-400",
  2: "ring-emerald-600",
  3: "ring-sky-600",
  4: "ring-pink-500",
  5: "ring-amber-400",
};

/* ── Trait categorization ── */

const ORIGIN_IDS = new Set([
  "TFT16_Bilgewater",
  "TFT16_DarkinWeapon",
  "TFT16_Demacia",
  "TFT16_Freljord",
  "TFT16_Ionia",
  "TFT16_Explorer",    // Ixtal
  "TFT16_Noxus",
  "TFT16_Piltover",
  "TFT16_ShadowIsles",
  "TFT16_Shurima",
  "TFT16_Targon",
  "TFT16_Void",
  "TFT16_Yordle",
  "TFT16_Zaun",
]);

const CLASS_IDS = new Set([
  "TFT16_Sorcerer",    // Arcanist
  "TFT16_Brawler",     // Bruiser
  "TFT16_Defender",
  "TFT16_Magus",       // Disruptor
  "TFT16_Gunslinger",
  "TFT16_Invoker",
  "TFT16_Juggernaut",
  "TFT16_Longshot",
  "TFT16_Rapidfire",   // Quickstriker
  "TFT16_Slayer",
  "TFT16_Vanquisher",
  "TFT16_Warden",
]);

type TraitCategory = "origin" | "class" | "unique";

function getTraitCategory(id: string): TraitCategory {
  if (ORIGIN_IDS.has(id)) return "origin";
  if (CLASS_IDS.has(id)) return "class";
  return "unique";
}

/* ── Types ── */

export interface FilterSelection {
  id: string;
  name: string;
  icon: string;
  type: "champion" | "trait";
}

interface FilterBarProps {
  champions: StaticChampion[];
  traits: StaticEntity[];
  selections: FilterSelection[];
  onAdd: (selection: FilterSelection) => void;
  onRemove: (id: string) => void;
}

/* ── Shared dropdown shell ── */

function DropdownShell({
  label,
  placeholder,
  selected,
  onClear,
  renderSelected,
  children,
  search,
  onSearchChange,
  onFocus,
  open,
  containerRef,
}: {
  label: string;
  placeholder: string;
  selected: FilterSelection | null;
  onClear: () => void;
  renderSelected: (item: FilterSelection) => React.ReactNode;
  children: React.ReactNode;
  search: string;
  onSearchChange: (v: string) => void;
  onFocus: () => void;
  open: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      <div ref={containerRef} className="relative">
        <div className="flex h-10 items-center gap-2 rounded-lg border border-border px-2.5">
          {selected ? (
            <>
              <div className="flex flex-1 items-center">
                {renderSelected(selected)}
              </div>
              <button
                type="button"
                onClick={onClear}
                className="cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </>
          ) : (
            <>
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={onFocus}
                className="h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </>
          )}
        </div>

        {open && !selected && (
          <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-border bg-popover p-1 shadow-lg">
            <div className="scrollbar-thin max-h-64 overflow-y-auto">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Champion dropdown ── */

function ChampionDropdown({
  champions,
  selected,
  onSelect,
  onClear,
}: {
  champions: StaticChampion[];
  selected: FilterSelection | null;
  onSelect: (c: StaticChampion) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return champions.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [champions, search]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <DropdownShell
      label="Champions"
      placeholder="Search champions..."
      selected={selected}
      onClear={onClear}
      search={search}
      onSearchChange={setSearch}
      onFocus={() => setOpen(true)}
      open={open}
      containerRef={containerRef}
      renderSelected={(s) => {
        const cost = champions.find((c) => c.id === s.id)?.cost ?? 1;
        return (
          <div className="flex items-center gap-2">
            <div className={cn("rounded-[4px] ring-1", COST_BORDER[cost] ?? "ring-border")}>
              <GameIcon championId={s.id} name={s.name} size={22} variant="champion" className="rounded-[4px]" />
            </div>
            <span className="text-sm">{s.name}</span>
          </div>
        );
      }}
    >
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
      ) : (
        filtered.map((champ) => (
          <button
            key={champ.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(champ);
              setSearch("");
              setOpen(false);
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-sm outline-none hover:bg-muted"
          >
            <div className={cn("rounded-[4px] ring-2", COST_BORDER[champ.cost ?? 1] ?? "ring-border")}>
              <GameIcon championId={champ.id} name={champ.name} size={28} variant="champion" />
            </div>
            <span>{champ.name}</span>
          </button>
        ))
      )}
    </DropdownShell>
  );
}

/* ── Trait dropdown (sectioned) ── */

interface TraitSection {
  label: string;
  items: StaticEntity[];
}

function TraitDropdown({
  traits,
  selected,
  onSelect,
  onClear,
}: {
  traits: StaticEntity[];
  selected: FilterSelection | null;
  onSelect: (t: StaticEntity) => void;
  onClear: () => void;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = traits.filter((t) => !q || t.name.toLowerCase().includes(q));

    const origins: StaticEntity[] = [];
    const classes: StaticEntity[] = [];
    const unique: StaticEntity[] = [];

    for (const t of filtered) {
      const cat = getTraitCategory(t.id);
      if (cat === "origin") origins.push(t);
      else if (cat === "class") classes.push(t);
      else unique.push(t);
    }

    const sortAlpha = (a: StaticEntity, b: StaticEntity) =>
      a.name.localeCompare(b.name);

    const result: TraitSection[] = [];
    if (origins.length > 0) result.push({ label: "Origins", items: origins.sort(sortAlpha) });
    if (classes.length > 0) result.push({ label: "Classes", items: classes.sort(sortAlpha) });
    if (unique.length > 0) result.push({ label: "Unique", items: unique.sort(sortAlpha) });
    return result;
  }, [traits, search]);

  const isEmpty = sections.length === 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <DropdownShell
      label="Traits"
      placeholder="Search traits..."
      selected={selected}
      onClear={onClear}
      search={search}
      onSearchChange={setSearch}
      onFocus={() => setOpen(true)}
      open={open}
      containerRef={containerRef}
      renderSelected={(s) => (
        <div className="flex items-center gap-2">
          <GameIcon iconPath={s.icon} name={s.name} size={22} variant="trait" />
          <span className="text-sm">{s.name}</span>
        </div>
      )}
    >
      {isEmpty ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No results found.</p>
      ) : (
        sections.map((section) => (
          <div key={section.label}>
            <div className="sticky top-0 z-10 bg-popover px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {section.label}
            </div>
            {section.items.map((trait) => (
              <button
                key={trait.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(trait);
                  setSearch("");
                  setOpen(false);
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-sm outline-none hover:bg-muted"
              >
                <GameIcon
                  iconPath={trait.icon}
                  name={trait.name}
                  size={28}
                  variant="trait"
                  className="rounded-[4px]"
                />
                <span>{trait.name}</span>
              </button>
            ))}
          </div>
        ))
      )}
    </DropdownShell>
  );
}

/* ── FilterBar ── */

export function FilterBar({
  champions,
  traits,
  selections,
  onAdd,
  onRemove,
}: FilterBarProps) {
  const championSelection = selections.find((s) => s.type === "champion") ?? null;
  const traitSelection = selections.find((s) => s.type === "trait") ?? null;

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
          <ChampionDropdown
            champions={champions}
            selected={championSelection}
            onClear={() => championSelection && onRemove(championSelection.id)}
            onSelect={(c) =>
              onAdd({ id: c.id, name: c.name, icon: c.icon, type: "champion" })
            }
          />
          <TraitDropdown
            traits={traits}
            selected={traitSelection}
            onClear={() => traitSelection && onRemove(traitSelection.id)}
            onSelect={(t) =>
              onAdd({ id: t.id, name: t.name, icon: t.icon, type: "trait" })
            }
          />
        </div>
      </div>
    </div>
  );
}
