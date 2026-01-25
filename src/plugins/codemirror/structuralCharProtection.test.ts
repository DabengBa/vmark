/**
 * Tests for Structural Character Protection
 *
 * Prevents backspace/delete from accidentally removing:
 * - Table pipes (|)
 * - List markers (-, *, +, 1.)
 * - Blockquote markers (>)
 */

import { describe, it, expect } from "vitest";

describe("Structural Character Protection", () => {
  // Test the regex patterns used for detection

  describe("TABLE_ROW_PATTERN", () => {
    const TABLE_ROW_PATTERN = /^\s*\|/;

    it("matches lines starting with pipe", () => {
      expect(TABLE_ROW_PATTERN.test("| cell")).toBe(true);
      expect(TABLE_ROW_PATTERN.test("|cell")).toBe(true);
    });

    it("matches lines with leading whitespace before pipe", () => {
      expect(TABLE_ROW_PATTERN.test("  | cell")).toBe(true);
      expect(TABLE_ROW_PATTERN.test("\t| cell")).toBe(true);
    });

    it("does not match lines without leading pipe", () => {
      expect(TABLE_ROW_PATTERN.test("text | more")).toBe(false);
      expect(TABLE_ROW_PATTERN.test("hello")).toBe(false);
    });
  });

  describe("LIST_ITEM_PATTERN", () => {
    const LIST_ITEM_PATTERN = /^(\s*)(-|\*|\+|\d+\.)\s/;

    it("matches unordered list markers", () => {
      expect(LIST_ITEM_PATTERN.test("- item")).toBe(true);
      expect(LIST_ITEM_PATTERN.test("* item")).toBe(true);
      expect(LIST_ITEM_PATTERN.test("+ item")).toBe(true);
    });

    it("matches ordered list markers", () => {
      expect(LIST_ITEM_PATTERN.test("1. item")).toBe(true);
      expect(LIST_ITEM_PATTERN.test("10. item")).toBe(true);
      expect(LIST_ITEM_PATTERN.test("123. item")).toBe(true);
    });

    it("matches indented list markers", () => {
      expect(LIST_ITEM_PATTERN.test("  - item")).toBe(true);
      expect(LIST_ITEM_PATTERN.test("    * item")).toBe(true);
      expect(LIST_ITEM_PATTERN.test("  1. item")).toBe(true);
    });

    it("requires space after marker", () => {
      expect(LIST_ITEM_PATTERN.test("-item")).toBe(false);
      expect(LIST_ITEM_PATTERN.test("1.item")).toBe(false);
    });

    it("captures indentation and marker correctly", () => {
      const match = "  - item".match(LIST_ITEM_PATTERN);
      expect(match).not.toBeNull();
      expect(match![1]).toBe("  "); // indentation
      expect(match![2]).toBe("-"); // marker
    });
  });

  describe("BLOCKQUOTE_PATTERN", () => {
    const BLOCKQUOTE_PATTERN = /^(\s*)(>+)\s?/;

    it("matches single blockquote marker", () => {
      expect(BLOCKQUOTE_PATTERN.test("> quote")).toBe(true);
      expect(BLOCKQUOTE_PATTERN.test(">quote")).toBe(true);
    });

    it("matches nested blockquote markers", () => {
      expect(BLOCKQUOTE_PATTERN.test(">> nested")).toBe(true);
      expect(BLOCKQUOTE_PATTERN.test(">>> deep")).toBe(true);
    });

    it("matches indented blockquote markers", () => {
      expect(BLOCKQUOTE_PATTERN.test("  > quote")).toBe(true);
    });

    it("captures depth correctly", () => {
      let match = "> quote".match(BLOCKQUOTE_PATTERN);
      expect(match).not.toBeNull();
      expect(match![2]).toBe(">"); // single >
      expect(match![2].length).toBe(1);

      match = ">> nested".match(BLOCKQUOTE_PATTERN);
      expect(match).not.toBeNull();
      expect(match![2]).toBe(">>"); // double >
      expect(match![2].length).toBe(2);

      match = ">>> deep".match(BLOCKQUOTE_PATTERN);
      expect(match).not.toBeNull();
      expect(match![2]).toBe(">>>"); // triple >
      expect(match![2].length).toBe(3);
    });
  });

  describe("Cell start pipe detection", () => {
    // Pattern to check if cursor is right after a pipe with optional whitespace
    const CELL_START_PATTERN = /\|\s*$/;

    it("matches cursor right after pipe", () => {
      expect(CELL_START_PATTERN.test("|")).toBe(true);
      expect(CELL_START_PATTERN.test("| ")).toBe(true);
      expect(CELL_START_PATTERN.test("|  ")).toBe(true);
    });

    it("matches text before pipe", () => {
      expect(CELL_START_PATTERN.test("cell |")).toBe(true);
      expect(CELL_START_PATTERN.test("cell | ")).toBe(true);
    });

    it("does not match without trailing pipe", () => {
      expect(CELL_START_PATTERN.test("text")).toBe(false);
      expect(CELL_START_PATTERN.test("| text")).toBe(false);
    });
  });
});
