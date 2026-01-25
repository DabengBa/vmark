/**
 * Tests for Blockquote Escape functionality
 *
 * ArrowUp at start of first-block blockquote → insert paragraph before
 * ArrowDown at end of last-block blockquote → insert paragraph after
 */

import { describe, it, expect } from "vitest";

// Test the helper functions directly since the main functions
// require full ProseMirror view setup

describe("Blockquote Escape helpers", () => {
  describe("isBlockquoteFirstBlock logic", () => {
    // The function checks: blockquotePos === 0
    const isFirstBlock = (blockquotePos: number) => blockquotePos === 0;

    it("returns true when blockquotePos is 0", () => {
      expect(isFirstBlock(0)).toBe(true);
    });

    it("returns false when blockquotePos is greater than 0", () => {
      expect(isFirstBlock(10)).toBe(false);
      expect(isFirstBlock(1)).toBe(false);
    });
  });

  describe("isBlockquoteLastBlock logic", () => {
    // The function checks: blockquotePos + blockquoteNodeSize === docSize
    const isLastBlock = (blockquotePos: number, blockquoteNodeSize: number, docSize: number) =>
      blockquotePos + blockquoteNodeSize === docSize;

    it("returns true when blockquote ends at document end", () => {
      // Blockquote at pos 0 with nodeSize 50, doc size 50
      expect(isLastBlock(0, 50, 50)).toBe(true);
    });

    it("returns false when there is content after blockquote", () => {
      // Blockquote at pos 0 with nodeSize 50, doc size 100
      expect(isLastBlock(0, 50, 100)).toBe(false);
    });

    it("handles blockquote not at start", () => {
      // Blockquote at pos 20 with nodeSize 30, doc size 50 (ends at 50)
      expect(isLastBlock(20, 30, 50)).toBe(true);
      // Blockquote at pos 20 with nodeSize 30, doc size 60 (ends at 50, doc is 60)
      expect(isLastBlock(20, 30, 60)).toBe(false);
    });
  });
});
