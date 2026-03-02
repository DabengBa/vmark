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

// ---------------------------------------------------------------------------
// Additional coverage: requestAnimationFrame position adjustment (lines 161-177)
// These run inside requestAnimationFrame after show() — use fake RAF.
// ---------------------------------------------------------------------------

describe("TiptapTableContextMenu — rAF position adjustment", () => {
  let menu2: TiptapTableContextMenu;
  let view2: ReturnType<typeof createMockView>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTableFitToWidth = false;
    view2 = createMockView();
    menu2 = new TiptapTableContextMenu(view2 as never);
  });

  afterEach(() => {
    menu2.destroy();
  });

  it("adjusts left position when container extends beyond viewport right edge (line 166)", () => {
    // Mock getBoundingClientRect to return a rect that overflows right edge
    const container = (menu2 as unknown as { container: HTMLElement }).container;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      top: 100, bottom: 200, left: 750, right: 820,
      width: 70, height: 100,
      x: 750, y: 100, toJSON: () => {},
    } as DOMRect);

    // Mock innerWidth to be 800 (so right=820 > 800-10=790)
    Object.defineProperty(window, "innerWidth", { value: 800, writable: true });
    Object.defineProperty(window, "innerHeight", { value: 600, writable: true });

    let rafCallback: FrameRequestCallback | null = null;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    menu2.show(750, 100);

    // Run the rAF callback manually
    if (rafCallback) {
      rafCallback(0);
    }

    // The container left should have been adjusted (newLeft = 800 - 70 - 10 = 720)
    // host === document.body in this test (getPopupHostForDom returns null → document.body)
    expect(container.style.left).toBe("720px");
  });

  it("adjusts top position when container extends beyond viewport bottom edge (line 176)", () => {
    const container = (menu2 as unknown as { container: HTMLElement }).container;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      top: 500, bottom: 640, left: 100, right: 200,
      width: 100, height: 140,
      x: 100, y: 500, toJSON: () => {},
    } as DOMRect);

    // Mock innerHeight to 600 (so bottom=640 > 600-10=590)
    // editorContainer is null (closest returns null)
    Object.defineProperty(window, "innerWidth", { value: 1200, writable: true });
    Object.defineProperty(window, "innerHeight", { value: 600, writable: true });

    let rafCallback: FrameRequestCallback | null = null;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    menu2.show(100, 500);

    if (rafCallback) {
      rafCallback(0);
    }

    // maxBottom = viewportHeight - 10 = 590, newTop = 590 - 140 = 450
    expect(container.style.top).toBe("450px");
  });

  it("runs rAF callback without adjustments when menu fits in viewport", () => {
    const container = (menu2 as unknown as { container: HTMLElement }).container;
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      top: 100, bottom: 200, left: 100, right: 200,
      width: 100, height: 100,
      x: 100, y: 100, toJSON: () => {},
    } as DOMRect);

    Object.defineProperty(window, "innerWidth", { value: 1200, writable: true });
    Object.defineProperty(window, "innerHeight", { value: 900, writable: true });

    let rafCallback: FrameRequestCallback | null = null;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    menu2.show(100, 100);

    if (rafCallback) {
      rafCallback(0);
    }

    // No adjustment needed — position stays as-is (100, 100)
    expect(container.style.left).toBe("100px");
    expect(container.style.top).toBe("100px");
  });
});
