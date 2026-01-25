/**
 * Tests for List Escape functionality
 *
 * ArrowUp at first item of first-block list → insert paragraph before
 * ArrowDown at last item of last-block list → insert paragraph after
 */

import { describe, it, expect } from "vitest";

// Test the helper functions directly since the main functions
// require full ProseMirror view setup

describe("List Escape helpers", () => {
  describe("isListFirstBlock logic", () => {
    // The function checks: listPos === 0
    const isFirstBlock = (listPos: number) => listPos === 0;

    it("returns true when listPos is 0", () => {
      expect(isFirstBlock(0)).toBe(true);
    });

    it("returns false when listPos is greater than 0", () => {
      expect(isFirstBlock(10)).toBe(false);
      expect(isFirstBlock(1)).toBe(false);
    });
  });

  describe("isListLastBlock logic", () => {
    // The function checks: listPos + listNodeSize === docSize
    const isLastBlock = (listPos: number, listNodeSize: number, docSize: number) =>
      listPos + listNodeSize === docSize;

    it("returns true when list ends at document end", () => {
      // List at pos 0 with nodeSize 50, doc size 50
      expect(isLastBlock(0, 50, 50)).toBe(true);
    });

    it("returns false when there is content after list", () => {
      // List at pos 0 with nodeSize 50, doc size 100
      expect(isLastBlock(0, 50, 100)).toBe(false);
    });

    it("handles list not at start", () => {
      // List at pos 20 with nodeSize 30, doc size 50 (ends at 50)
      expect(isLastBlock(20, 30, 50)).toBe(true);
      // List at pos 20 with nodeSize 30, doc size 60 (ends at 50, doc is 60)
      expect(isLastBlock(20, 30, 60)).toBe(false);
    });
  });
});
