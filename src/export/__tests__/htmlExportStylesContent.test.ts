import { describe, it, expect } from "vitest";
import { getExportOverrides } from "../exportOverrides";
import { getEditorContentCSS } from "../htmlExportStyles";

describe("getExportOverrides", () => {
  const css = getExportOverrides();

  it("includes @media print block with table-layout: fixed", () => {
    expect(css).toContain("@media print");
    expect(css).toContain("table-layout: fixed");
  });

  it("forces table scroll wrapper to visible overflow", () => {
    expect(css).toContain("overflow-x: visible");
  });

  it("enables word wrapping in table cells", () => {
    expect(css).toContain("overflow-wrap: break-word");
    expect(css).toContain("word-break: break-word");
  });

  it("constrains images in table cells", () => {
    expect(css).toMatch(/td img[^}]*max-width:\s*100%/s);
  });

  it("hides interactive elements in export", () => {
    expect(css).toContain("ProseMirror-gapcursor");
    expect(css).toContain("display: none !important");
  });

  it("includes print alert icon fallbacks", () => {
    expect(css).toContain("alert-note");
    expect(css).toContain("background-image: url(");
  });

  it("does not force line numbers visible", () => {
    // Line numbers should respect editor setting, not be forced on
    expect(css).not.toMatch(/\.export-surface .code-line-numbers\s*\{[^}]*display:\s*flex/);
  });
});

describe("getEditorContentCSS (composed)", () => {
  const css = getEditorContentCSS();

  it("returns a non-empty string", () => {
    // In test env, ?raw CSS imports may return empty strings.
    // This test verifies the composition works; the overrides portion
    // is always populated since it's a TS template string.
    expect(css.length).toBeGreaterThan(0);
  });

  it("includes export overrides in the composed output", () => {
    // The overrides portion is always present (not from ?raw imports)
    expect(css).toContain("ProseMirror-gapcursor");
    expect(css).toContain("@media print");
  });
});
