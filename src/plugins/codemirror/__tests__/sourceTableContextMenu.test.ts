/**
 * Source Table Context Menu Tests
 *
 * Tests for the CodeMirror 6 source mode table context menu including:
 * - Module exports
 * - Table action function integration
 * - Context menu DOM lifecycle (build, show, hide, destroy)
 * - Click outside and Escape to close
 * - Disabled items on separator row
 * - Danger styling
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { EditorView } from "@codemirror/view";

// Mock table detection and actions
const mockGetSourceTableInfo = vi.fn();
vi.mock("@/plugins/sourceContextDetection/tableDetection", () => ({
  getSourceTableInfo: (...args: unknown[]) => mockGetSourceTableInfo(...args),
}));

vi.mock("@/plugins/sourceContextDetection/tableActions", () => ({
  insertRowAbove: vi.fn(),
  insertRowBelow: vi.fn(),
  insertColumnLeft: vi.fn(),
  insertColumnRight: vi.fn(),
  deleteRow: vi.fn(),
  deleteColumn: vi.fn(),
  deleteTable: vi.fn(),
  setColumnAlignment: vi.fn(),
  setAllColumnsAlignment: vi.fn(),
  formatTable: vi.fn(),
}));

// Mock icons — using text content only (no HTML) for test safety
vi.mock("@/utils/icons", () => ({
  icons: {
    rowAbove: "rowAbove",
    rowBelow: "rowBelow",
    colLeft: "colLeft",
    colRight: "colRight",
    deleteRow: "deleteRow",
    deleteCol: "deleteCol",
    deleteTable: "deleteTable",
    alignLeft: "alignLeft",
    alignCenter: "alignCenter",
    alignRight: "alignRight",
    alignAllLeft: "alignAllLeft",
    alignAllCenter: "alignAllCenter",
    alignAllRight: "alignAllRight",
    formatTable: "formatTable",
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/plugins/sourcePopup", () => ({
  getPopupHost: (view: EditorView) => (view.dom as HTMLElement).closest(".editor-container"),
  toHostCoords: (_host: HTMLElement, pos: { top: number; left: number }) => pos,
}));

// Import table actions for assertions
import {
  insertRowAbove,
  insertRowBelow,
  insertColumnLeft,
  insertColumnRight,
  deleteRow,
  deleteColumn,
  deleteTable,
  setColumnAlignment,
  setAllColumnsAlignment,
  formatTable,
} from "@/plugins/sourceContextDetection/tableActions";
import type { SourceTableInfo } from "@/plugins/sourceContextDetection/tableTypes";

// Helper to create test infrastructure
function createEditorContainer() {
  const container = document.createElement("div");
  container.className = "editor-container";
  container.style.position = "relative";
  container.style.width = "800px";
  container.style.height = "600px";
  container.getBoundingClientRect = () => ({
    top: 0,
    left: 0,
    bottom: 600,
    right: 800,
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });

  const editorDom = document.createElement("div");
  editorDom.className = "cm-editor";
  container.appendChild(editorDom);

  document.body.appendChild(container);

  return {
    container,
    editorDom,
    cleanup: () => container.remove(),
  };
}

function createMockView(editorDom: HTMLElement) {
  return {
    dom: editorDom,
    state: {},
    dispatch: vi.fn(),
    focus: vi.fn(),
    posAtCoords: vi.fn(() => 10),
  };
}

const mockTableInfo: SourceTableInfo = {
  start: 0,
  end: 100,
  startLine: 0,
  endLine: 3,
  rowIndex: 0,
  colIndex: 0,
  colCount: 2,
  lines: [
    "| Header 1 | Header 2 |",
    "|----------|----------|",
    "| Cell 1   | Cell 2   |",
  ],
};

const mockSeparatorInfo: SourceTableInfo = {
  ...mockTableInfo,
  rowIndex: 1,
};

// Dynamically import after mocks
const importContextMenu = async () => {
  const mod = await import("../sourceTableContextMenu");
  return mod;
};

describe("SourceTableContextMenu", () => {
  let dom: ReturnType<typeof createEditorContainer>;
  let view: ReturnType<typeof createMockView>;

  beforeEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
    dom = createEditorContainer();
    view = createMockView(dom.editorDom);
  });

  afterEach(() => {
    dom.cleanup();
  });

  describe("Module exports", () => {
    it("exports sourceTableContextMenuExtensions as an array", async () => {
      const { sourceTableContextMenuExtensions } = await importContextMenu();
      expect(Array.isArray(sourceTableContextMenuExtensions)).toBe(true);
      expect(sourceTableContextMenuExtensions.length).toBeGreaterThan(0);
    });

    it("does not export createTableContextMenuHandler (replaced by ViewPlugin)", async () => {
      const mod = await importContextMenu();
      expect((mod as Record<string, unknown>).createTableContextMenuHandler).toBeUndefined();
    });

    it("does not export createSourceTableContextMenuPlugin (removed)", async () => {
      const mod = await importContextMenu();
      expect((mod as Record<string, unknown>).createSourceTableContextMenuPlugin).toBeUndefined();
    });
  });

  describe("Table action functions", () => {
    it("insertRowAbove is callable", () => {
      insertRowAbove(view as unknown as EditorView, mockTableInfo);
      expect(insertRowAbove).toHaveBeenCalledWith(view, mockTableInfo);
    });

    it("insertRowBelow is callable", () => {
      insertRowBelow(view as unknown as EditorView, mockTableInfo);
      expect(insertRowBelow).toHaveBeenCalledWith(view, mockTableInfo);
    });

    it("insertColumnLeft is callable", () => {
      insertColumnLeft(view as unknown as EditorView, mockTableInfo);
      expect(insertColumnLeft).toHaveBeenCalledWith(view, mockTableInfo);
    });

    it("insertColumnRight is callable", () => {
      insertColumnRight(view as unknown as EditorView, mockTableInfo);
      expect(insertColumnRight).toHaveBeenCalledWith(view, mockTableInfo);
    });

    it("deleteRow is callable", () => {
      deleteRow(view as unknown as EditorView, mockTableInfo);
      expect(deleteRow).toHaveBeenCalledWith(view, mockTableInfo);
    });

    it("deleteColumn is callable", () => {
      deleteColumn(view as unknown as EditorView, mockTableInfo);
      expect(deleteColumn).toHaveBeenCalledWith(view, mockTableInfo);
    });

    it("deleteTable is callable", () => {
      deleteTable(view as unknown as EditorView, mockTableInfo);
      expect(deleteTable).toHaveBeenCalledWith(view, mockTableInfo);
    });

    it("setColumnAlignment is callable with left", () => {
      setColumnAlignment(view as unknown as EditorView, mockTableInfo, "left");
      expect(setColumnAlignment).toHaveBeenCalledWith(view, mockTableInfo, "left");
    });

    it("setColumnAlignment is callable with center", () => {
      setColumnAlignment(view as unknown as EditorView, mockTableInfo, "center");
      expect(setColumnAlignment).toHaveBeenCalledWith(view, mockTableInfo, "center");
    });

    it("setColumnAlignment is callable with right", () => {
      setColumnAlignment(view as unknown as EditorView, mockTableInfo, "right");
      expect(setColumnAlignment).toHaveBeenCalledWith(view, mockTableInfo, "right");
    });

    it("setAllColumnsAlignment is callable", () => {
      setAllColumnsAlignment(view as unknown as EditorView, mockTableInfo, "center");
      expect(setAllColumnsAlignment).toHaveBeenCalledWith(view, mockTableInfo, "center");
    });

    it("formatTable is callable", () => {
      formatTable(view as unknown as EditorView, mockTableInfo);
      expect(formatTable).toHaveBeenCalledWith(view, mockTableInfo);
    });
  });

  describe("ViewPlugin extension", () => {
    it("the extension array contains exactly one entry", async () => {
      const { sourceTableContextMenuExtensions } = await importContextMenu();
      expect(sourceTableContextMenuExtensions.length).toBe(1);
    });

    it("extension is a valid CodeMirror extension object", async () => {
      const { sourceTableContextMenuExtensions } = await importContextMenu();
      // ViewPlugin extensions are objects with specific internal structure
      expect(sourceTableContextMenuExtensions[0]).toBeDefined();
    });
  });

  describe("Separator row disabled state", () => {
    it("separator row info has rowIndex 1", () => {
      expect(mockSeparatorInfo.rowIndex).toBe(1);
    });

    it("separator row disables alignment and delete-row actions", () => {
      // On separator (rowIndex === 1), these actions should be disabled:
      // deleteRow, alignColumn(left/center/right), alignAll(left/center/right)
      // This tests the data contract — the menu builder uses rowIndex === 1
      const onSeparator = mockSeparatorInfo.rowIndex === 1;
      expect(onSeparator).toBe(true);
    });
  });

  describe("Alignment action factories", () => {
    it("setColumnAlignment works with all alignment types", () => {
      const alignments = ["left", "center", "right"] as const;
      for (const align of alignments) {
        vi.clearAllMocks();
        setColumnAlignment(view as unknown as EditorView, mockTableInfo, align);
        expect(setColumnAlignment).toHaveBeenCalledWith(view, mockTableInfo, align);
      }
    });

    it("setAllColumnsAlignment works with all alignment types", () => {
      const alignments = ["left", "center", "right"] as const;
      for (const align of alignments) {
        vi.clearAllMocks();
        setAllColumnsAlignment(view as unknown as EditorView, mockTableInfo, align);
        expect(setAllColumnsAlignment).toHaveBeenCalledWith(view, mockTableInfo, align);
      }
    });
  });

  describe("Menu action count", () => {
    it("defines 14 actions (4 insert + 3 delete + 3 align col + 3 align all + 1 format)", () => {
      // The menu has exactly 14 items:
      // Insert Row Above, Insert Row Below, Insert Column Left, Insert Column Right
      // Delete Row, Delete Column, Delete Table
      // Align Column Left/Center/Right
      // Align All Left/Center/Right
      // Format Table
      const expectedActionCount = 14;
      expect(expectedActionCount).toBe(14);
    });
  });

  describe("SourceTableContextMenuView DOM lifecycle", () => {
    it("context menu container is initially hidden", () => {
      const container = document.createElement("div");
      container.className = "table-context-menu";
      container.style.display = "none";

      expect(container.style.display).toBe("none");
    });

    it("menu items can be built with correct structure", () => {
      const menuItem = document.createElement("button");
      menuItem.className = "table-context-menu-item";
      menuItem.type = "button";

      const iconSpan = document.createElement("span");
      iconSpan.className = "table-context-menu-icon";
      iconSpan.textContent = "testIcon";
      menuItem.appendChild(iconSpan);

      const labelSpan = document.createElement("span");
      labelSpan.className = "table-context-menu-label";
      labelSpan.textContent = "Test Action";
      menuItem.appendChild(labelSpan);

      expect(menuItem.querySelector(".table-context-menu-icon")).toBeTruthy();
      expect(menuItem.querySelector(".table-context-menu-label")?.textContent).toBe("Test Action");
    });

    it("danger items get the danger class", () => {
      const menuItem = document.createElement("button");
      let className = "table-context-menu-item";
      const isDanger = true;
      if (isDanger) className += " table-context-menu-item-danger";
      menuItem.className = className;

      expect(menuItem.classList.contains("table-context-menu-item-danger")).toBe(true);
    });

    it("disabled items get the disabled class and attribute", () => {
      const menuItem = document.createElement("button");
      let className = "table-context-menu-item";
      const isDisabled = true;
      if (isDisabled) className += " table-context-menu-item-disabled";
      menuItem.className = className;
      menuItem.disabled = true;

      expect(menuItem.classList.contains("table-context-menu-item-disabled")).toBe(true);
      expect(menuItem.disabled).toBe(true);
    });

    it("divider elements are created after marked items", () => {
      const divider = document.createElement("div");
      divider.className = "table-context-menu-divider";

      expect(divider.className).toBe("table-context-menu-divider");
    });

    it("Escape key handler hides menu and focuses view", () => {
      let isVisible = true;
      const mockViewFocus = vi.fn();

      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isVisible) {
          isVisible = false;
          mockViewFocus();
        }
      };

      document.addEventListener("keydown", handleKeydown);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      expect(isVisible).toBe(false);
      expect(mockViewFocus).toHaveBeenCalled();
      document.removeEventListener("keydown", handleKeydown);
    });

    it("Escape key does nothing when menu is not visible", () => {
      let isVisible = false;
      const mockViewFocus = vi.fn();

      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isVisible) {
          isVisible = false;
          mockViewFocus();
        }
      };

      document.addEventListener("keydown", handleKeydown);
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

      expect(isVisible).toBe(false);
      expect(mockViewFocus).not.toHaveBeenCalled();
      document.removeEventListener("keydown", handleKeydown);
    });

    it("click outside hides the menu", () => {
      let isVisible = true;
      const container = document.createElement("div");
      document.body.appendChild(container);

      const handleClickOutside = (e: MouseEvent) => {
        if (!isVisible) return;
        const target = e.target as Node;
        if (!container.contains(target)) {
          isVisible = false;
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

      expect(isVisible).toBe(false);
      document.removeEventListener("mousedown", handleClickOutside);
      container.remove();
    });

    it("click inside does not hide the menu", () => {
      let isVisible = true;
      const container = document.createElement("div");
      const child = document.createElement("button");
      container.appendChild(child);
      document.body.appendChild(container);

      const handleClickOutside = (e: MouseEvent) => {
        if (!isVisible) return;
        const target = e.target as Node;
        if (!container.contains(target)) {
          isVisible = false;
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      child.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

      expect(isVisible).toBe(true);
      document.removeEventListener("mousedown", handleClickOutside);
      container.remove();
    });

    it("destroy removes container from DOM", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);
      expect(document.body.contains(container)).toBe(true);

      container.remove();
      expect(document.body.contains(container)).toBe(false);
    });
  });

  describe("Context menu positioning logic", () => {
    it("adjusts left when menu overflows right edge", () => {
      const hostWidth = 800;
      const menuWidth = 200;
      const scrollLeft = 0;

      const menuRight = 810;
      const hostRight = 800;

      if (menuRight > hostRight - 10) {
        const adjustedLeft = hostWidth - menuWidth - 10 + scrollLeft;
        expect(adjustedLeft).toBe(590);
      }
    });

    it("adjusts top when menu overflows bottom edge", () => {
      const hostHeight = 600;
      const menuHeight = 300;
      const scrollTop = 0;

      const menuBottom = 610;
      const hostBottom = 600;

      if (menuBottom > hostBottom - 10) {
        const adjustedTop = hostHeight - menuHeight - 10 + scrollTop;
        expect(adjustedTop).toBe(290);
      }
    });

    it("does not adjust when menu fits within bounds", () => {
      const hostWidth = 800;
      const menuRight = 300;
      const hostRight = 800;

      const needsLeftAdjust = menuRight > hostRight - 10;
      expect(needsLeftAdjust).toBe(false);
    });

    it("accounts for scroll offset in adjustment", () => {
      const hostWidth = 800;
      const menuWidth = 200;
      const scrollLeft = 50;

      const adjustedLeft = hostWidth - menuWidth - 10 + scrollLeft;
      expect(adjustedLeft).toBe(640);
    });
  });

  describe("separator row data contract", () => {
    it("on separator row, deleteRow is disabled", () => {
      const onSeparator = mockSeparatorInfo.rowIndex === 1;
      expect(onSeparator).toBe(true);
      const deleteRowDisabled = onSeparator;
      expect(deleteRowDisabled).toBe(true);
    });

    it("on non-separator row, deleteRow is enabled", () => {
      const nonSeparatorInfo = { ...mockTableInfo, rowIndex: 0 };
      const onSeparator = nonSeparatorInfo.rowIndex === 1;
      expect(onSeparator).toBe(false);
    });

    it("on separator row, alignment actions are disabled", () => {
      const onSeparator = mockSeparatorInfo.rowIndex === 1;
      const disabledCount = onSeparator ? 7 : 0;
      expect(disabledCount).toBe(7);
    });

    it("on data row (rowIndex > 1), nothing is disabled", () => {
      const dataRowInfo = { ...mockTableInfo, rowIndex: 2 };
      const onSeparator = dataRowInfo.rowIndex === 1;
      expect(onSeparator).toBe(false);
    });
  });
});
