/**
 * Tests for batchOpHandlers — table_batch_modify and list_batch_modify.
 *
 * These handlers are the most complex MCP bridge handlers (660+ lines).
 * Tests focus on argument validation, error handling, and edge cases.
 * Deep ProseMirror integration is tested at the handler boundary.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock utils
const mockRespond = vi.fn();
const mockGetEditor = vi.fn();
const mockIsAutoApproveEnabled = vi.fn().mockReturnValue(true);
vi.mock("../utils", () => ({
  respond: (response: unknown) => mockRespond(response),
  getEditor: () => mockGetEditor(),
  isAutoApproveEnabled: () => mockIsAutoApproveEnabled(),
}));

// Mock revision tracker
const mockValidateBaseRevision = vi.fn();
const mockGetCurrentRevision = vi.fn().mockReturnValue("rev-new");
vi.mock("../revisionTracker", () => ({
  validateBaseRevision: (...args: unknown[]) =>
    mockValidateBaseRevision(...args),
  getCurrentRevision: () => mockGetCurrentRevision(),
}));

// Mock markdown paste slice
vi.mock("@/plugins/markdownPaste/tiptap", () => ({
  createMarkdownPasteSlice: vi.fn().mockReturnValue({ content: "mock" }),
}));

import {
  handleTableBatchModify,
  handleListBatchModify,
} from "../batchOpHandlers";

describe("batchOpHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateBaseRevision.mockReturnValue(null);
    mockIsAutoApproveEnabled.mockReturnValue(true);
  });

  describe("handleTableBatchModify", () => {
    it("returns revision conflict error", async () => {
      mockValidateBaseRevision.mockReturnValue({
        error: "Revision conflict",
        currentRevision: "rev-current",
      });

      await handleTableBatchModify("req-1", {
        baseRevision: "rev-old",
        target: { tableIndex: 0 },
        operations: [],
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.data.code).toBe("conflict");
    });

    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleTableBatchModify("req-2", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [],
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-2",
        success: false,
        error: "No active editor",
      });
    });

    it("returns error when target is missing", async () => {
      mockGetEditor.mockReturnValue({
        state: { doc: { descendants: vi.fn() } },
      });

      await handleTableBatchModify("req-3", {
        baseRevision: "rev-1",
        operations: [{ action: "add_row", at: 0, cells: ["a"] }],
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-3",
        success: false,
        error: "target is required",
      });
    });

    it("returns error when operations is empty", async () => {
      mockGetEditor.mockReturnValue({
        state: { doc: { descendants: vi.fn() } },
      });

      await handleTableBatchModify("req-5", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [],
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-5",
        success: false,
        error: "At least one operation is required",
      });
    });

    it("returns not_found when table is not found", async () => {
      const editor = {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              // No table nodes
              cb(
                {
                  type: { name: "paragraph" },
                  nodeSize: 10,
                },
                0
              );
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleTableBatchModify("req-6", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [{ action: "update_cell", row: 0, col: 0, content: "x" }],
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.error).toContain("Table not found");
    });

    it("returns dryRun preview without making changes", async () => {
      // Create a minimal table mock
      const tableRow = {
        type: { name: "tableRow" },
        childCount: 2,
        child: (i: number) => ({
          type: { name: i === 0 ? "tableHeader" : "tableCell" },
          nodeSize: 5,
          textContent: `cell-${i}`,
        }),
        nodeSize: 12,
      };
      const tableNode = {
        type: { name: "table" },
        childCount: 2,
        child: () => tableRow,
        content: { size: 24 },
        nodeSize: 26,
        descendants: vi.fn(),
      };

      const editor = {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              cb(tableNode, 0);
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleTableBatchModify("req-7", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [
          { action: "update_cell", row: 0, col: 0, content: "new" },
        ],
        mode: "dryRun",
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.isDryRun).toBe(true);
    });
  });

  describe("handleListBatchModify", () => {
    it("returns revision conflict error", async () => {
      mockValidateBaseRevision.mockReturnValue({
        error: "Revision conflict",
        currentRevision: "rev-current",
      });

      await handleListBatchModify("req-8", {
        baseRevision: "rev-old",
        target: { listIndex: 0 },
        operations: [],
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.data.code).toBe("conflict");
    });

    it("returns error when no editor", async () => {
      mockGetEditor.mockReturnValue(null);

      await handleListBatchModify("req-9", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [],
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-9",
        success: false,
        error: "No active editor",
      });
    });

    it("returns error when target is missing", async () => {
      mockGetEditor.mockReturnValue({
        state: { doc: { descendants: vi.fn() } },
      });

      await handleListBatchModify("req-10", {
        baseRevision: "rev-1",
        operations: [{ action: "add_item", at: 0, text: "item" }],
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-10",
        success: false,
        error: "target is required",
      });
    });

    it("returns not_found when list is not found", async () => {
      const editor = {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              // No list nodes
              cb(
                {
                  type: { name: "paragraph" },
                  nodeSize: 10,
                },
                0
              );
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-12", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [{ action: "add_item", at: 0, text: "item" }],
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.error).toContain("List not found");
    });

    it("returns error when operations is empty", async () => {
      mockGetEditor.mockReturnValue({
        state: { doc: { descendants: vi.fn() } },
      });

      await handleListBatchModify("req-13", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [],
      });

      expect(mockRespond).toHaveBeenCalledWith({
        id: "req-13",
        success: false,
        error: "At least one operation is required",
      });
    });

    it("returns dryRun preview without making changes", async () => {
      const listNode = {
        type: { name: "bulletList" },
        nodeSize: 20,
      };

      const editor = {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              cb(listNode, 0);
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-14", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [
          { action: "add_item", at: 0, text: "new item" },
        ],
        mode: "dryRun",
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.isDryRun).toBe(true);
      expect(call.data.preview.listType).toBe("bulletList");
      expect(call.data.preview.operationCount).toBe(1);
    });

    it("returns suggest-mode warning when auto-approve disabled", async () => {
      const listNode = {
        type: { name: "orderedList" },
        nodeSize: 20,
      };

      const editor = {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              cb(listNode, 0);
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);
      mockIsAutoApproveEnabled.mockReturnValue(false);

      await handleListBatchModify("req-15", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [{ action: "add_item", at: 0, text: "item" }],
        mode: "suggest",
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.warning).toContain("suggest mode not yet supported");
    });

    it("finds list by selector (bulletlist)", async () => {
      const listNode = {
        type: { name: "bulletList" },
        nodeSize: 20,
      };

      const editor = {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              cb(listNode, 0);
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-16", {
        baseRevision: "rev-1",
        target: { selector: "ul" },
        operations: [{ action: "add_item", at: 0, text: "item" }],
        mode: "dryRun",
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.isDryRun).toBe(true);
    });

    it("finds list by selector (tasklist)", async () => {
      const listNode = {
        type: { name: "taskList" },
        nodeSize: 20,
      };

      const editor = {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              cb(listNode, 0);
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-17", {
        baseRevision: "rev-1",
        target: { selector: "task" },
        operations: [{ action: "add_item", at: 0, text: "item" }],
        mode: "dryRun",
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
    });

    it("finds list by selector (orderedlist)", async () => {
      const listNode = {
        type: { name: "orderedList" },
        nodeSize: 20,
      };

      const editor = {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              cb(listNode, 0);
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-18", {
        baseRevision: "rev-1",
        target: { selector: "ol" },
        operations: [{ action: "add_item", at: 0, text: "item" }],
        mode: "dryRun",
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
    });
  });

  describe("handleTableBatchModify — suggest mode", () => {
    it("returns warning in suggest mode", async () => {
      const tableNode = {
        type: { name: "table" },
        childCount: 1,
        nodeSize: 26,
      };
      const editor = {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              cb(tableNode, 0);
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);
      mockIsAutoApproveEnabled.mockReturnValue(false);

      await handleTableBatchModify("req-20", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [{ action: "add_row", at: 0, cells: ["a"] }],
        mode: "suggest",
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.warning).toContain("suggest mode not yet supported");
    });
  });

  describe("handleTableBatchModify — afterHeading target", () => {
    it("finds table after a specific heading", async () => {
      const headingNode = {
        type: { name: "heading" },
        nodeSize: 10,
        isText: false,
        text: undefined,
        descendants: (cb: (child: unknown) => boolean) => {
          cb({ isText: true, text: "My Table" });
        },
      };
      const tableNode = {
        type: { name: "table" },
        childCount: 1,
        nodeSize: 26,
      };

      const editor = {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              cb(headingNode, 0);
              cb(tableNode, 10);
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleTableBatchModify("req-21", {
        baseRevision: "rev-1",
        target: { afterHeading: "My Table" },
        operations: [{ action: "add_row", at: 0, cells: ["a"] }],
        mode: "dryRun",
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.isDryRun).toBe(true);
    });

    it("is case-insensitive when matching headings", async () => {
      const headingNode = {
        type: { name: "heading" },
        nodeSize: 10,
        isText: false,
        text: undefined,
        descendants: (cb: (child: unknown) => boolean) => {
          cb({ isText: true, text: "Data Table" });
        },
      };
      const tableNode = {
        type: { name: "table" },
        childCount: 1,
        nodeSize: 26,
      };

      const editor = {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              cb(headingNode, 0);
              cb(tableNode, 10);
            },
          },
        },
      };
      mockGetEditor.mockReturnValue(editor);

      await handleTableBatchModify("req-22", {
        baseRevision: "rev-1",
        target: { afterHeading: "data table" },
        operations: [{ action: "add_row", at: 0, cells: ["a"] }],
        mode: "dryRun",
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
    });
  });

  describe("handleTableBatchModify — apply mode structural ops", () => {
    function makeTableEditor() {
      const cellNode = {
        type: { name: "tableCell" },
        nodeSize: 5,
        textContent: "cell",
      };
      const tableRow = {
        type: { name: "tableRow" },
        childCount: 2,
        child: () => cellNode,
        nodeSize: 12,
        firstChild: {
          type: { name: "tableHeader" },
        },
        forEach: vi.fn((cb: (node: unknown, offset: number) => void) => {
          cb(cellNode, 0);
          cb(cellNode, 5);
        }),
      };
      const tableNode = {
        type: { name: "table" },
        childCount: 2,
        child: () => tableRow,
        firstChild: tableRow,
        content: { size: 24 },
        nodeSize: 26,
        forEach: vi.fn((cb: (node: unknown, offset: number) => void) => {
          cb(tableRow, 0);
          cb(tableRow, 12);
        }),
        descendants: vi.fn(),
      };

      const chainMethods = {
        focus: vi.fn().mockReturnThis(),
        setTextSelection: vi.fn().mockReturnThis(),
        run: vi.fn(),
      };

      return {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              cb(tableNode, 0);
            },
            nodeAt: vi.fn(() => ({
              nodeSize: 5,
            })),
          },
          tr: {
            replaceWith: vi.fn().mockReturnThis(),
            get docChanged() { return true; },
          },
          schema: { nodes: { paragraph: { create: vi.fn(() => "empty-p") } } },
        },
        chain: vi.fn().mockReturnValue(chainMethods),
        commands: {
          addRowAfter: vi.fn(),
          deleteRow: vi.fn(),
          addColumnAfter: vi.fn(),
          deleteColumn: vi.fn(),
          toggleHeaderRow: vi.fn(),
        },
        view: {
          dispatch: vi.fn(),
        },
      };
    }

    it("applies delete_row operation", async () => {
      const editor = makeTableEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleTableBatchModify("req-30", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [{ action: "delete_row", at: 0 }],
      });

      expect(editor.commands.deleteRow).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.appliedCount).toBe(1);
    });

    it("applies add_column operation", async () => {
      const editor = makeTableEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleTableBatchModify("req-31", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [{ action: "add_column", at: 0, header: "Col", cells: ["a"] }],
      });

      expect(editor.commands.addColumnAfter).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
    });

    it("applies delete_column operation", async () => {
      const editor = makeTableEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleTableBatchModify("req-32", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [{ action: "delete_column", at: 0 }],
      });

      expect(editor.commands.deleteColumn).toHaveBeenCalled();
    });

    it("applies set_header operation (toggle)", async () => {
      const editor = makeTableEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleTableBatchModify("req-33", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [{ action: "set_header", row: 0, isHeader: false }],
      });

      // firstChild.firstChild is tableHeader, so isCurrentlyHeader=true, wantHeader=false → toggle
      expect(editor.commands.toggleHeaderRow).toHaveBeenCalled();
    });

    it("warns on unknown table operation", async () => {
      const editor = makeTableEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleTableBatchModify("req-34", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [{ action: "unknown_op" }],
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.warnings).toContain("Unknown table operation: unknown_op");
    });

    it("warns when operation has no action field", async () => {
      const editor = makeTableEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleTableBatchModify("req-35", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [{ noAction: true }],
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.warnings.some((w: string) => w.includes("Failed to normalize"))).toBe(true);
    });

    it("applies multiple operations in sequence", async () => {
      const editor = makeTableEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleTableBatchModify("req-36", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [
          { action: "add_row", at: 0, cells: ["a"] },
          { action: "delete_row", at: 1 },
        ],
      });

      expect(editor.commands.addRowAfter).toHaveBeenCalled();
      expect(editor.commands.deleteRow).toHaveBeenCalled();
      const call = mockRespond.mock.calls[0][0];
      expect(call.data.appliedCount).toBe(2);
    });
  });

  describe("handleListBatchModify — apply mode operations", () => {
    function makeListEditor() {
      const listItemNode = {
        type: { name: "listItem" },
        nodeSize: 8,
      };
      const listNode = {
        type: { name: "bulletList" },
        nodeSize: 20,
        forEach: vi.fn((cb: (node: unknown, offset: number) => void) => {
          cb(listItemNode, 0);
          cb(listItemNode, 8);
        }),
      };

      const chainMethods = {
        focus: vi.fn().mockReturnThis(),
        setTextSelection: vi.fn().mockReturnThis(),
        run: vi.fn(),
      };

      return {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              cb(listNode, 0);
            },
          },
          selection: {
            $from: {
              depth: 2,
              node: (d: number) => {
                if (d === 1) return { type: { name: "taskItem" }, attrs: { checked: false } };
                return { type: { name: "bulletList" } };
              },
              before: () => 5,
            },
          },
          tr: {
            replaceSelection: vi.fn().mockReturnThis(),
            setNodeMarkup: vi.fn().mockReturnThis(),
          },
        },
        chain: vi.fn().mockReturnValue(chainMethods),
        commands: {
          splitListItem: vi.fn(),
          deleteNode: vi.fn(),
          sinkListItem: vi.fn(),
          liftListItem: vi.fn(),
        },
        view: {
          dispatch: vi.fn(),
        },
      };
    }

    it("applies delete_item operation", async () => {
      const editor = makeListEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-40", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [{ action: "delete_item", at: 0 }],
      });

      expect(editor.commands.deleteNode).toHaveBeenCalledWith("listItem");
      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.appliedCount).toBe(1);
    });

    it("applies set_indent (indent > 0 = sink)", async () => {
      const editor = makeListEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-41", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [{ action: "set_indent", at: 0, indent: 1 }],
      });

      expect(editor.commands.sinkListItem).toHaveBeenCalledWith("listItem");
    });

    it("applies set_indent (indent = 0 = lift)", async () => {
      const editor = makeListEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-42", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [{ action: "set_indent", at: 0, indent: 0 }],
      });

      expect(editor.commands.liftListItem).toHaveBeenCalledWith("listItem");
    });

    it("warns on update_item (requires item selection)", async () => {
      const editor = makeListEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-43", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [{ action: "update_item", at: 0, text: "updated" }],
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.data.warnings.some((w: string) => w.includes("update_item"))).toBe(true);
    });

    it("warns on reorder operation", async () => {
      const editor = makeListEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-44", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [{ action: "reorder", order: [1, 0] }],
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.data.warnings.some((w: string) => w.includes("reorder"))).toBe(true);
    });

    it("warns on unknown list operation", async () => {
      const editor = makeListEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-45", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [{ action: "nonexistent_op" }],
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.data.warnings).toContain("Unknown list operation: nonexistent_op");
    });

    it("warns when list item at index not found", async () => {
      const editor = makeListEditor();
      // Override forEach to return no items
      const listNode = {
        type: { name: "bulletList" },
        nodeSize: 20,
        forEach: vi.fn(),
      };
      editor.state.doc.descendants = (cb: (node: unknown, pos: number) => boolean | undefined) => {
        cb(listNode, 0);
      };
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-46", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [{ action: "delete_item", at: 99 }],
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.data.warnings.some((w: string) => w.includes("not found"))).toBe(true);
    });

    it("accepts 'op' as action key alias", async () => {
      const editor = makeListEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-47", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [{ op: "delete_item", at: 0 }],
      });

      expect(editor.commands.deleteNode).toHaveBeenCalled();
    });

    it("normalizes camelCase to snake_case", async () => {
      const editor = makeListEditor();
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-48", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [{ action: "deleteItem", at: 0 }],
      });

      expect(editor.commands.deleteNode).toHaveBeenCalled();
    });

    it("handles operation errors gracefully", async () => {
      const editor = makeListEditor();
      editor.commands.splitListItem = vi.fn(() => { throw new Error("PM error"); });
      mockGetEditor.mockReturnValue(editor);

      await handleListBatchModify("req-49", {
        baseRevision: "rev-1",
        target: { listIndex: 0 },
        operations: [{ action: "add_item", at: 0, text: "item" }],
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.warnings.some((w: string) => w.includes("Failed"))).toBe(true);
    });
  });

  describe("handleTableBatchModify — normalizeOp", () => {
    it("accepts type or op as action key aliases", async () => {
      const tableRow = {
        type: { name: "tableRow" },
        childCount: 1,
        child: () => ({
          type: { name: "tableHeader" },
          nodeSize: 5,
        }),
        nodeSize: 7,
        firstChild: {
          type: { name: "tableHeader" },
          firstChild: { type: { name: "tableHeader" } },
        },
      };
      const tableNode = {
        type: { name: "table" },
        childCount: 1,
        child: () => tableRow,
        firstChild: tableRow,
        nodeSize: 9,
        forEach: vi.fn(),
      };

      const chainMethods = {
        focus: vi.fn().mockReturnThis(),
        setTextSelection: vi.fn().mockReturnThis(),
        run: vi.fn(),
      };

      const editor = {
        state: {
          doc: {
            descendants: (
              cb: (node: unknown, pos: number) => boolean | undefined
            ) => {
              cb(tableNode, 0);
            },
          },
        },
        chain: vi.fn().mockReturnValue(chainMethods),
        commands: {
          addRowAfter: vi.fn(),
        },
      };
      mockGetEditor.mockReturnValue(editor);

      // Use "type" key instead of "action"
      await handleTableBatchModify("req-23", {
        baseRevision: "rev-1",
        target: { tableIndex: 0 },
        operations: [{ type: "add_row", at: 0, cells: ["a"] }],
      });

      const call = mockRespond.mock.calls[0][0];
      expect(call.success).toBe(true);
      expect(call.data.appliedCount).toBeGreaterThanOrEqual(0);
    });
  });
});
