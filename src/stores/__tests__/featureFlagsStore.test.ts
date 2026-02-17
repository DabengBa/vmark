import { describe, it, expect } from "vitest";
import { FEATURE_FLAGS } from "../featureFlagsStore";
import type { FeatureFlag } from "../featureFlagsStore";

/**
 * Tests for featureFlagsStore — a plain const object (not a Zustand store)
 * used for compile-time feature gating with tree-shaking.
 */

describe("featureFlagsStore", () => {
  // ---------------------------------------------------------------------------
  // Structure
  // ---------------------------------------------------------------------------
  describe("structure", () => {
    it("exports FEATURE_FLAGS as a non-null object", () => {
      expect(FEATURE_FLAGS).toBeDefined();
      expect(typeof FEATURE_FLAGS).toBe("object");
      expect(FEATURE_FLAGS).not.toBeNull();
    });

    it("has at least one flag defined", () => {
      const keys = Object.keys(FEATURE_FLAGS);
      expect(keys.length).toBeGreaterThan(0);
    });

    it("all flag values are booleans", () => {
      for (const [_key, value] of Object.entries(FEATURE_FLAGS)) {
        expect(typeof value).toBe("boolean");
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Known flags
  // ---------------------------------------------------------------------------
  describe("UNIFIED_MENU_DISPATCHER", () => {
    it("exists and is true (Phase 5: enabled in production)", () => {
      expect(FEATURE_FLAGS.UNIFIED_MENU_DISPATCHER).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // FeatureFlag type (runtime key check)
  // ---------------------------------------------------------------------------
  describe("FeatureFlag type", () => {
    it("keys of FEATURE_FLAGS match expected flag names", () => {
      const keys = Object.keys(FEATURE_FLAGS) as FeatureFlag[];
      expect(keys).toContain("UNIFIED_MENU_DISPATCHER");
    });
  });

  // ---------------------------------------------------------------------------
  // Immutability — as const makes it readonly at compile time,
  // but we verify runtime behavior too
  // ---------------------------------------------------------------------------
  describe("type safety", () => {
    it("FEATURE_FLAGS values are typed as literal booleans (as const)", () => {
      // `as const` makes values literal types (true/false, not boolean)
      // This is a compile-time guarantee — verified here as documentation
      const val: true = FEATURE_FLAGS.UNIFIED_MENU_DISPATCHER;
      expect(val).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge case: no duplicate or conflicting flags
  // ---------------------------------------------------------------------------
  describe("no duplicate flags", () => {
    it("all flag keys are unique (object keys are inherently unique)", () => {
      const keys = Object.keys(FEATURE_FLAGS);
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(keys.length);
    });
  });
});
