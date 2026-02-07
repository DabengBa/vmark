/**
 * Genie Item
 *
 * A single genie entry in the GeniePicker list.
 */

import type { GenieDefinition } from "@/types/aiGenies";

interface GenieItemProps {
  genie: GenieDefinition;
  index: number;
  selected: boolean;
  onSelect: (genie: GenieDefinition) => void;
  onHover: (index: number) => void;
}

export function GenieItem({
  genie,
  index,
  selected,
  onSelect,
  onHover,
}: GenieItemProps) {
  return (
    <div
      className={`prompt-picker-item ${selected ? "prompt-picker-item--selected" : ""}`}
      data-index={index}
      onClick={() => onSelect(genie)}
      onMouseEnter={() => onHover(index)}
    >
      <div className="prompt-picker-item-name">
        {formatName(genie.metadata.name)}
      </div>
      <div className="prompt-picker-item-meta">
        {genie.metadata.description && (
          <span className="prompt-picker-item-desc">
            {genie.metadata.description}
          </span>
        )}
        <span className="prompt-picker-item-scope">
          {genie.metadata.scope}
        </span>
      </div>
    </div>
  );
}

export function formatName(name: string): string {
  return name.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
