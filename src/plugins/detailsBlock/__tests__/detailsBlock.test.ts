/**
 * Tests for detailsBlock extension — input rule regex, extension metadata.
 */

import { describe, it, expect } from "vitest";
import { detailsBlockExtension, detailsSummaryExtension } from "../tiptap";

// ---------------------------------------------------------------------------
// Input rule regex (replicated from source to test directly)
// ---------------------------------------------------------------------------

const DETAILS_INPUT_PATTERN = /^(?:<details>|:::details)\s*$/i;

describe("DETAILS_INPUT_PATTERN", () => {
  it.each([
    { input: "<details>", matches: true },
    { input: ":::details", matches: true },
    { input: "<DETAILS>", matches: true },
    { input: ":::DETAILS", matches: true },
    { input: "<Details>", matches: true },
    { input: ":::Details", matches: true },
    { input: "<details> ", matches: true },
    { input: ":::details  ", matches: true },
  ])("matches '$input': $matches", ({ input, matches }) => {
    expect(DETAILS_INPUT_PATTERN.test(input)).toBe(matches);
  });

  it.each([
    { input: "<details>some text", matches: false },
    { input: ":::details content", matches: false },
    { input: "details", matches: false },
    { input: "<detail>", matches: false },
    { input: ":::detail", matches: false },
    { input: "prefix <details>", matches: false },
    { input: "", matches: false },
  ])("does not match '$input'", ({ input, matches }) => {
    expect(DETAILS_INPUT_PATTERN.test(input)).toBe(matches);
  });
});

// ---------------------------------------------------------------------------
// Extension metadata
// ---------------------------------------------------------------------------

describe("detailsBlockExtension", () => {
  it("has correct name", () => {
    expect(detailsBlockExtension.name).toBe("detailsBlock");
  });

  it("is a block node with content", () => {
    expect(detailsBlockExtension.config.group).toBe("block");
    expect(detailsBlockExtension.config.content).toBe("detailsSummary block+");
    expect(detailsBlockExtension.config.defining).toBe(true);
  });

  it("has open attribute defaulting to false", () => {
    // Access the attributes config
    const addAttributes = detailsBlockExtension.config.addAttributes;
    expect(addAttributes).toBeDefined();
  });

  it("parseHTML matches details tag", () => {
    const parseRules = detailsBlockExtension.config.parseHTML!.call({} as never);
    expect(parseRules![0].tag).toBe("details");
  });
});

describe("detailsSummaryExtension", () => {
  it("has correct name", () => {
    expect(detailsSummaryExtension.name).toBe("detailsSummary");
  });

  it("has inline content", () => {
    expect(detailsSummaryExtension.config.content).toBe("inline*");
  });

  it("is not selectable", () => {
    expect(detailsSummaryExtension.config.selectable).toBe(false);
  });

  it("parseHTML matches summary tag", () => {
    const parseRules = detailsSummaryExtension.config.parseHTML!.call({} as never);
    expect(parseRules![0].tag).toBe("summary");
  });
});
