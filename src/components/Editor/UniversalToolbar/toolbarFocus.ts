/**
 * Toolbar Focus - Simple first-enabled focus
 *
 * Returns the first enabled button index when toolbar opens.
 *
 * @module components/Editor/UniversalToolbar/toolbarFocus
 */

interface ToolbarButtonState {
  disabled: boolean;
  notImplemented: boolean;
  active: boolean;
}

interface FocusOptions {
  states: ToolbarButtonState[];
}

/**
 * Get initial focus index when toolbar opens.
 * Simply returns the first enabled button.
 *
 * Returns -1 if no enabled buttons (caller should not open toolbar).
 */
export function getInitialFocusIndex(options: FocusOptions): number {
  const { states } = options;
  const index = states.findIndex((state) => !state.disabled);
  return index >= 0 ? index : -1;
}
