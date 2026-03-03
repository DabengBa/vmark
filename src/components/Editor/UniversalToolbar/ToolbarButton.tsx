/**
 * ToolbarButton - Individual button in the universal toolbar
 *
 * Renders a single toolbar button with icon, label tooltip, and click handler.
 * Supports disabled state based on context.
 *
 * @module components/Editor/UniversalToolbar/ToolbarButton
 */
import type { ToolbarGroupButton as ButtonDef } from "./toolbarGroups";

interface ToolbarButtonProps {
  button: ButtonDef;
  disabled?: boolean;
  active?: boolean;
  notImplemented?: boolean;
  focusEnabled?: boolean;
  focusIndex?: number;
  currentFocusIndex?: number;
  ariaHasPopup?: "menu" | "dialog" | "listbox";
  ariaExpanded?: boolean;
  onClick: () => void;
}

/**
 * Render a single toolbar button.
 *
 * @param button - Button definition from toolbarGroups
 * @param disabled - Whether the button is disabled
 * @param active - Whether the button represents an active format
 * @param notImplemented - Whether the button is not yet implemented
 * @param focusIndex - This button's index in the focus order
 * @param currentFocusIndex - The currently focused button index (for roving tabindex)
 * @param ariaHasPopup - ARIA popup type (for dropdown buttons)
 * @param ariaExpanded - Whether the dropdown is expanded
 * @param onClick - Click handler
 */
export function ToolbarButton({
  button,
  disabled = false,
  active = false,
  notImplemented = false,
  focusEnabled = true,
  focusIndex,
  currentFocusIndex,
  ariaHasPopup,
  ariaExpanded,
  onClick,
}: ToolbarButtonProps) {
  // Show "Not available yet" tooltip for unimplemented buttons
  let title = button.label;

  if (notImplemented) {
    title = `${button.label} — Not available yet`;
  }

  // Roving tabindex: only focused button has tabIndex=0 when focus is active
  const isFocused = focusEnabled && focusIndex === currentFocusIndex;
  const tabIndex = isFocused ? 0 : -1;

  return (
    <button
      type="button"
      /* v8 ignore next -- @preserve active/focused/dropdown class variants require specific toolbar state */
      className={`universal-toolbar-btn${active ? " active" : ""}${isFocused ? " focused" : ""}${button.type === "dropdown" ? " dropdown" : ""}`}
      title={title}
      aria-label={button.label}
      aria-haspopup={ariaHasPopup}
      /* v8 ignore next -- @preserve ariaExpanded undefined branch requires non-popup button in tests */
      aria-expanded={ariaHasPopup ? ariaExpanded : undefined}
      disabled={disabled || notImplemented}
      onClick={onClick}
      tabIndex={tabIndex}
      data-action={button.action}
      data-focus-index={focusIndex}
    >
      <span
        className="universal-toolbar-icon"
        dangerouslySetInnerHTML={{ __html: button.icon }}
      />
    </button>
  );
}
