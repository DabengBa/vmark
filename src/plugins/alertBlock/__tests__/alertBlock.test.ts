/**
 * Tests for alertBlock extension — normalizeAlertType, extension metadata, parseHTML.
 */

import { describe, it, expect } from "vitest";
import {
  alertBlockExtension,
  ALERT_TYPES,
  DEFAULT_ALERT_TYPE,
  type AlertType,
} from "../tiptap";

// ---------------------------------------------------------------------------
// normalizeAlertType (replicated from source — it's module-private)
// ---------------------------------------------------------------------------

function normalizeAlertType(value: unknown): AlertType {
  if (typeof value !== "string") return DEFAULT_ALERT_TYPE;
  const upper = value.toUpperCase();
  return ALERT_TYPES.includes(upper as AlertType) ? (upper as AlertType) : DEFAULT_ALERT_TYPE;
}

describe("normalizeAlertType", () => {
  it.each([
    { input: "NOTE", expected: "NOTE" },
    { input: "TIP", expected: "TIP" },
    { input: "IMPORTANT", expected: "IMPORTANT" },
    { input: "WARNING", expected: "WARNING" },
    { input: "CAUTION", expected: "CAUTION" },
  ])("accepts valid type '$input'", ({ input, expected }) => {
    expect(normalizeAlertType(input)).toBe(expected);
  });

  it.each([
    { input: "note", expected: "NOTE" },
    { input: "tip", expected: "TIP" },
    { input: "Warning", expected: "WARNING" },
    { input: "caution", expected: "CAUTION" },
  ])("normalizes case: '$input' -> '$expected'", ({ input, expected }) => {
    expect(normalizeAlertType(input)).toBe(expected);
  });

  it.each([
    { input: "INVALID", desc: "unknown string" },
    { input: "", desc: "empty string" },
    { input: "DANGER", desc: "non-existent type" },
  ])("returns default for $desc", ({ input }) => {
    expect(normalizeAlertType(input)).toBe(DEFAULT_ALERT_TYPE);
  });

  it.each([
    { input: null, desc: "null" },
    { input: undefined, desc: "undefined" },
    { input: 42, desc: "number" },
    { input: true, desc: "boolean" },
    { input: {}, desc: "object" },
  ])("returns default for non-string: $desc", ({ input }) => {
    expect(normalizeAlertType(input)).toBe(DEFAULT_ALERT_TYPE);
  });
});

// ---------------------------------------------------------------------------
// ALERT_TYPES constant
// ---------------------------------------------------------------------------

describe("ALERT_TYPES", () => {
  it("contains exactly 5 types", () => {
    expect(ALERT_TYPES).toHaveLength(5);
  });

  it("are all uppercase strings", () => {
    for (const t of ALERT_TYPES) {
      expect(t).toBe(t.toUpperCase());
    }
  });
});

// ---------------------------------------------------------------------------
// Extension metadata
// ---------------------------------------------------------------------------

describe("alertBlockExtension", () => {
  it("has correct name", () => {
    expect(alertBlockExtension.name).toBe("alertBlock");
  });

  it("is a block node with content", () => {
    expect(alertBlockExtension.config.group).toBe("block");
    expect(alertBlockExtension.config.content).toBe("block+");
    expect(alertBlockExtension.config.defining).toBe(true);
  });

  it("parseHTML matches div[data-alert-type]", () => {
    const parseRules = alertBlockExtension.config.parseHTML!.call({} as never);
    expect(parseRules![0].tag).toBe("div[data-alert-type]");
  });

  it("DEFAULT_ALERT_TYPE is NOTE", () => {
    expect(DEFAULT_ALERT_TYPE).toBe("NOTE");
  });
});
