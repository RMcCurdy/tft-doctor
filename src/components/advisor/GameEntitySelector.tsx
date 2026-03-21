"use client";

import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

export interface SelectableEntity {
  id: string;
  name: string;
  subtitle?: string; // e.g., augment tier, item components, champion cost
}

interface GameEntitySelectorProps {
  label: string;
  placeholder: string;
  entities: SelectableEntity[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  maxSelections?: number;
}

export function GameEntitySelector({
  label,
  placeholder,
  entities,
  selectedIds,
  onSelect,
  onRemove,
  maxSelections,
}: GameEntitySelectorProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const selectedEntities = entities.filter((e) => selectedIds.includes(e.id));
  const availableEntities = entities.filter((e) => !selectedIds.includes(e.id));
  const isAtMax = maxSelections !== undefined && selectedIds.length >= maxSelections;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
        {maxSelections && (
          <span className="ml-1 text-xs">
            ({selectedIds.length}/{maxSelections})
          </span>
        )}
      </label>

      {/* Selected items */}
      {selectedEntities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedEntities.map((entity) => (
            <Badge
              key={entity.id}
              variant="secondary"
              className="gap-1 pr-1 text-xs"
            >
              {entity.name}
              <button
                type="button"
                onClick={() => onRemove(entity.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search/select */}
      {!isAtMax && (
        <div className="relative">
          <Command className="rounded-lg border" shouldFilter={false}>
            <CommandInput
              placeholder={placeholder}
              value={search}
              onValueChange={setSearch}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                // Delay to allow click on items
                setTimeout(() => setOpen(false), 200);
              }}
            />
            {open && search.length > 0 && (
              <CommandList className="max-h-48">
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {availableEntities
                    .filter(
                      (e) =>
                        e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.id.toLowerCase().includes(search.toLowerCase())
                    )
                    .slice(0, 20)
                    .map((entity) => (
                      <CommandItem
                        key={entity.id}
                        value={entity.id}
                        onSelect={() => {
                          onSelect(entity.id);
                          setSearch("");
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm">{entity.name}</span>
                          {entity.subtitle && (
                            <span className="text-xs text-muted-foreground">
                              {entity.subtitle}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            )}
          </Command>
        </div>
      )}
    </div>
  );
}
