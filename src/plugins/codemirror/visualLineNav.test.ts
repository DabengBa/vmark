/**
 * Tests for Visual Line Navigation
 *
 * - Visual line navigation (Up/Down with word wrap)
 * - Smart Home key (toggles between first non-whitespace and line start)
 */

import { describe, it, expect } from "vitest";

describe("Smart Home key logic", () => {
  // Test the core algorithm that smartHome uses

  /**
   * Find first non-whitespace position in a line.
   * Returns the offset from line start.
   */
  function findFirstNonWhitespace(lineText: string): number {
    let firstNonWhitespace = 0;
    while (firstNonWhitespace < lineText.length && /\s/.test(lineText[firstNonWhitespace])) {
      firstNonWhitespace++;
    }
    return firstNonWhitespace;
  }

  /**
   * Determine target position for smart Home key.
   * @param cursorOffset - Current cursor offset in line
   * @param firstNonWhitespaceOffset - Offset of first non-whitespace char
   * @returns Target offset (0 for line start, or firstNonWhitespaceOffset)
   */
  function getSmartHomeTarget(cursorOffset: number, firstNonWhitespaceOffset: number): number {
    // If at first non-whitespace or at line start, toggle to the other
    if (cursorOffset === firstNonWhitespaceOffset) {
      return 0; // Go to line start
    }
    if (cursorOffset === 0) {
      return firstNonWhitespaceOffset; // Go to first non-whitespace
    }
    // Otherwise, go to first non-whitespace
    return firstNonWhitespaceOffset;
  }

  describe("findFirstNonWhitespace", () => {
    it("returns 0 for line starting with text", () => {
      expect(findFirstNonWhitespace("hello world")).toBe(0);
    });

    it("returns correct offset for indented line", () => {
      expect(findFirstNonWhitespace("  hello")).toBe(2);
      expect(findFirstNonWhitespace("    hello")).toBe(4);
      expect(findFirstNonWhitespace("\thello")).toBe(1);
    });

    it("returns line length for whitespace-only line", () => {
      expect(findFirstNonWhitespace("   ")).toBe(3);
      expect(findFirstNonWhitespace("")).toBe(0);
    });
  });

  describe("getSmartHomeTarget", () => {
    it("goes to line start when at first non-whitespace", () => {
      // Line: "  hello", cursor at position 2 (first 'h')
      expect(getSmartHomeTarget(2, 2)).toBe(0);
    });

    it("goes to first non-whitespace when at line start", () => {
      // Line: "  hello", cursor at position 0
      expect(getSmartHomeTarget(0, 2)).toBe(2);
    });

    it("goes to first non-whitespace when elsewhere in line", () => {
      // Line: "  hello", cursor at position 5 (middle of word)
      expect(getSmartHomeTarget(5, 2)).toBe(2);
    });

    it("handles non-indented line", () => {
      // Line: "hello", cursor at position 3
      expect(getSmartHomeTarget(3, 0)).toBe(0);
      // At first char (which is also first non-whitespace), go to 0 (same)
      expect(getSmartHomeTarget(0, 0)).toBe(0);
    });
  });
});
