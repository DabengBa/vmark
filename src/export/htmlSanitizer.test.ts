import { sanitizeExportHtml } from "./htmlSanitizer";

describe("sanitizeExportHtml", () => {
  it("returns original html when input produces no element children", () => {
    const input = "<!-- only comments -->";
    expect(sanitizeExportHtml(input)).toBe(input);
  });

  it("returns original html for empty string input", () => {
    expect(sanitizeExportHtml("")).toBe("");
  });

  it("removes ProseMirror separator elements", () => {
    const html = '<p>Hello<span class="ProseMirror-separator"></span> World</p>';
    const result = sanitizeExportHtml(html);
    expect(result).not.toContain("ProseMirror-separator");
    expect(result).toContain("Hello");
  });

  it("removes contenteditable attributes", () => {
    const html = '<div contenteditable="true"><p>Text</p></div>';
    const result = sanitizeExportHtml(html);
    expect(result).not.toContain("contenteditable");
  });
});
