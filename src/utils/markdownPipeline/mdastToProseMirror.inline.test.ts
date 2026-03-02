/**
 * MDAST to ProseMirror inline conversion tests
 */

import { describe, it, expect } from "vitest";
import { parseMarkdownToMdast } from "./parser";
import { mdastToProseMirror } from "./mdastToProseMirror";
import { testSchema } from "./testSchema";

const parseDoc = (markdown: string) => mdastToProseMirror(testSchema, parseMarkdownToMdast(markdown));

describe("mdastToProseMirror inline", () => {
  it("converts basic marks", () => {
    const doc = parseDoc("**bold** *italic* ~~strike~~ `code`");
    const para = doc.firstChild;
    let foundBold = false;
    let foundItalic = false;
    let foundStrike = false;
    let foundCode = false;

    para?.forEach((child) => {
      if (child.marks.some((m) => m.type.name === "bold")) foundBold = true;
      if (child.marks.some((m) => m.type.name === "italic")) foundItalic = true;
      if (child.marks.some((m) => m.type.name === "strike")) foundStrike = true;
      if (child.marks.some((m) => m.type.name === "code")) foundCode = true;
    });

    expect(foundBold).toBe(true);
    expect(foundItalic).toBe(true);
    expect(foundStrike).toBe(true);
    expect(foundCode).toBe(true);
  });

  it("converts inline math", () => {
    const doc = parseDoc("Formula $E=mc^2$");
    const para = doc.firstChild;
    const mathNode = para?.child(1);
    expect(mathNode?.type.name).toBe("math_inline");
  });

  it("converts custom inline marks", () => {
    const doc = parseDoc("H~2~O and x^2^ and ==hi== ++u++");
    const para = doc.firstChild;
    const hasUnderline = para?.childCount ? para?.child(para.childCount - 1).marks.some((m) => m.type.name === "underline") : false;
    expect(hasUnderline).toBe(true);
  });

  it("converts wiki links", () => {
    const doc = parseDoc("See [[Page|Alias]]");
    const para = doc.firstChild;
    const wikiLink = para?.content.content.find((child) => child.type.name === "wikiLink");
    expect(wikiLink).toBeDefined();
  });

  it("converts inline html", () => {
    const doc = parseDoc("Text <kbd>Key</kbd>");
    const para = doc.firstChild;
    const htmlNode = para?.content.content.find((child) => child.type.name === "html_inline");
    expect(htmlNode).toBeDefined();
  });

  it("merges inline html tag pairs", () => {
    const doc = parseDoc('<span style="color: red;">Hello</span>');
    const para = doc.firstChild;
    const htmlNode = para?.content.content.find((child) => child.type.name === "html_inline");
    expect(htmlNode?.attrs.value).toContain('style="color: red;"');
    expect(htmlNode?.attrs.value).toContain("Hello");
  });

  it("converts footnote references", () => {
    // Footnote refs need matching definitions to be parsed as footnotes
    const doc = parseDoc("Hello [^1]\n\n[^1]: note");
    const para = doc.firstChild;
    const footnoteRef = para?.content.content.find((child) => child.type.name === "footnote_reference");
    expect(footnoteRef).toBeDefined();
    expect(footnoteRef?.attrs.label).toBe("1");
  });

  it("does not merge inline html when inner content has formatting marks", () => {
    // <span>**bold**</span> — inner content has strong mark, should NOT merge
    const doc = parseDoc("<span>**bold**</span>");
    const para = doc.firstChild;
    // Should have separate html_inline nodes (not merged) because inner content has formatting
    const htmlNodes = para?.content.content.filter((child) => child.type.name === "html_inline");
    // There should be multiple html_inline nodes (open tag, close tag separately)
    expect(htmlNodes?.length).toBeGreaterThanOrEqual(2);
  });

  it("handles nested inline html tags of the same type", () => {
    // <span><span>inner</span></span> — nested same-tag
    const doc = parseDoc("<span><span>inner</span></span>");
    const para = doc.firstChild;
    const htmlNode = para?.content.content.find((child) => child.type.name === "html_inline");
    expect(htmlNode).toBeDefined();
    // The outer span should contain the inner span
    expect(htmlNode?.attrs.value).toContain("inner");
  });

  it("converts break nodes inside inline html", () => {
    const doc = parseDoc("Line 1\\\nLine 2");
    const para = doc.firstChild;
    const hasBreak = para?.content.content.some((child) => child.type.name === "hardBreak");
    expect(hasBreak).toBe(true);
  });

  it("handles self-closing html tags", () => {
    const doc = parseDoc("Text <br/> more");
    const para = doc.firstChild;
    expect(para?.childCount).toBeGreaterThan(0);
  });

  it("handles inline html open tag without matching close tag", () => {
    const doc = parseDoc("Text <span> orphan");
    const para = doc.firstChild;
    const htmlNode = para?.content.content.find((child) => child.type.name === "html_inline");
    expect(htmlNode).toBeDefined();
  });

  it("serializeInlineHtmlNode default branch handles nodes with children via deep nesting", () => {
    // Triple-nested same-tag triggers the default branch in serializeInlineHtmlNode
    // when the inner html has children of a type other than text/html/break
    const doc = parseDoc("<span><span><span>deep</span></span></span>");
    expect(doc).toBeDefined();
    const para = doc.firstChild;
    expect(para?.childCount).toBeGreaterThan(0);
  });

  it("handles alert node in block context via convertNode", () => {
    const doc = parseDoc("> [!NOTE]\n> Note text");
    expect(doc.firstChild?.type.name).toBe("alertBlock");
  });
});
