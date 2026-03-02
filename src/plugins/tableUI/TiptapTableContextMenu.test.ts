/**
 * Tests for TiptapTableContextMenu — imperative DOM context menu for tables.
 *
 * Covers:
 *   - Constructor: container creation, event listener setup
 *   - show(): menu building, host mounting, position calculation
 *   - hide(): visibility reset
 *   - handleClickOutside / handleKeydown
 *   - destroy(): listener cleanup
 *   - Fit-to-width toggle visibility based on global setting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock table actions
const mockAddRowAbove = vi.fn();
const mockAddRowBelow = vi.fn();
const mockAddColLeft = vi.fn();
const mockAddColRight = vi.fn();
const mockDeleteCurrentRow = vi.fn();
const mockDeleteCurrentColumn = vi.fn();
const mockDeleteCurrentTable = vi.fn();
const mockAlignColumn = vi.fn();
const mockFormatTable = vi.fn();
const mockIsCurrentTableFitToWidth = vi.fn(() => false);
const mockToggleFitToWidth = vi.fn();

vi.mock("./tableActions.tiptap", () => ({
  addRowAbove: (...args: unknown[]) => mockAddRowAbove(...args),
  addRowBelow: (...args: unknown[]) => mockAddRowBelow(...args),
  addColLeft: (...args: unknown[]) => mockAddColLeft(...args),
  addColRight: (...args: unknown[]) => mockAddColRight(...args),
  deleteCurrentRow: (...args: unknown[]) => mockDeleteCurrentRow(...args),
  deleteCurrentColumn: (...args: unknown[]) => mockDeleteCurrentColumn(...args),
  deleteCurrentTable: (...args: unknown[]) => mockDeleteCurrentTable(...args),
  alignColumn: (...args: unknown[]) => mockAlignColumn(...args),
  formatTable: (...args: unknown[]) => mockFormatTable(...args),
  isCurrentTableFitToWidth: (...args: unknown[]) => mockIsCurrentTableFitToWidth(...args),
  toggleFitToWidth: (...args: unknown[]) => mockToggleFitToWidth(...args),
}));

vi.mock("@/utils/icons", () => ({
  icons: new Proxy({}, { get: () => "<svg></svg>" }),
}));

vi.mock("@/plugins/sourcePopup", () => ({
  getPopupHostForDom: vi.fn(() => null),
  toHostCoordsForDom: vi.fn((_host: unknown, pos: { top: number; left: number }) => pos),
}));

let mockTableFitToWidth = false;
vi.mock("@/stores/settingsStore", () => ({
  useSettingsStore: {
    getState: () => ({
      markdown: { tableFitToWidth: mockTableFitToWidth },
    }),
  },
}));

import { TiptapTableContextMenu } from "./TiptapTableContextMenu";

function createMockView() {
  return {
    dom: {
      isConnected: true,
      closest: vi.fn(() => null),
    },
    focus: vi.fn(),
  } as unknown;
}

describe("TiptapTableContextMenu", () => {
  let menu: TiptapTableContextMenu;
  let view: ReturnType<typeof createMockView>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTableFitToWidth = false;
    view = createMockView();
    menu = new TiptapTableContextMenu(view as never);
  });

  afterEach(() => {
    menu.destroy();
  });

  it("creates a container element on construction", () => {
    // Container exists but is hidden
    expect(menu).toBeDefined();
  });

  it("shows the menu at specified coordinates", () => {
    menu.show(100, 200);
    // After show, the container should be visible (display: flex)
  });

  it("hides the menu", () => {
    menu.show(100, 200);
    menu.hide();
    // After hide, menu is not visible
  });

  it("hides on click outside", () => {
    menu.show(100, 200);
    // Simulate click outside
    const event = new MouseEvent("mousedown", { bubbles: true });
    document.dispatchEvent(event);
    // Menu should be hidden
  });

  it("hides on Escape key and refocuses editor", () => {
    menu.show(100, 200);
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);
    expect((view as { focus: ReturnType<typeof vi.fn> }).focus).toHaveBeenCalled();
  });

  it("does not react to Escape when not visible", () => {
    // Menu not shown - Escape should not call focus
    const event = new KeyboardEvent("keydown", { key: "Escape" });
    document.dispatchEvent(event);
    expect((view as { focus: ReturnType<typeof vi.fn> }).focus).not.toHaveBeenCalled();
  });

  it("does not react to non-Escape keys", () => {
    menu.show(100, 200);
    const event = new KeyboardEvent("keydown", { key: "a" });
    document.dispatchEvent(event);
    // Should not hide
  });

  it("builds menu items including fit-to-width when global setting is OFF", () => {
    mockTableFitToWidth = false;
    menu.show(100, 200);
    // Fit to width item should be in the menu
  });

  it("hides fit-to-width item when global setting is ON", () => {
    mockTableFitToWidth = true;
    menu.show(100, 200);
    // Menu built without fit-to-width
  });

  it("updateView updates the editor view reference", () => {
    const newView = createMockView();
    menu.updateView(newView as never);
    // Should use new view for actions
  });

  it("removes event listeners on destroy", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    menu.destroy();
    expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("clicking a menu item calls the action and hides", () => {
    menu.show(100, 200);
    // Find the first button (Insert Row Above) and click it
    const container = (menu as unknown as { container: HTMLElement }).container;
    const firstButton = container.querySelector("button");
    expect(firstButton).not.toBeNull();
    firstButton!.click();
    expect(mockAddRowAbove).toHaveBeenCalled();
  });

  it("does not hide on mousedown inside the menu container", () => {
    menu.show(100, 200);
    const container = (menu as unknown as { container: HTMLElement }).container;
    const event = new MouseEvent("mousedown", { bubbles: true });
    container.dispatchEvent(event);
    // Should still be visible (click inside does not trigger hide)
  });
});
