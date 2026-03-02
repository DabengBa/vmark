import { describe, it, expect } from "vitest";
import { Text } from "@codemirror/state";
import { getBlockMathContentRange, getBlockMathUnwrapChanges } from "./mathActions";
import type { BlockMathInfo } from "./blockMathDetection";

function makeInfo(doc: Text, startLine: number, endLine: number): BlockMathInfo {
  return {
    from: doc.line(startLine).from,
    to: doc.line(endLine).to,
    startLine,
    endLine,
    content: "",
  };
}

describe("getBlockMathContentRange", () => {
  it("returns content range for a simple block math", () => {
    const doc = Text.of(["$$", "a + b", "$$"]);
    const range = getBlockMathContentRange(doc, makeInfo(doc, 1, 3));
    expect(range).toEqual({ from: doc.line(2).from, to: doc.line(2).to });
  });

  it("returns null when startLine < 1", () => {
    const doc = Text.of(["$$", "x", "$$"]);
    const info = { ...makeInfo(doc, 1, 3), startLine: 0 };
    expect(getBlockMathContentRange(doc, info)).toBeNull();
  });

  it("returns null when endLine > doc.lines", () => {
    const doc = Text.of(["$$", "x", "$$"]);
    const info = { ...makeInfo(doc, 1, 3), endLine: 99 };
    expect(getBlockMathContentRange(doc, info)).toBeNull();
  });

  it("returns null when startLine >= endLine", () => {
    const doc = Text.of(["$$", "x", "$$"]);
    const info = { ...makeInfo(doc, 2, 2) };
    expect(getBlockMathContentRange(doc, info)).toBeNull();
  });

  it("returns null when $$ not found on start line", () => {
    const doc = Text.of(["no marker", "x", "$$"]);
    expect(getBlockMathContentRange(doc, makeInfo(doc, 1, 3))).toBeNull();
  });

  it("returns null when $$ not found on end line", () => {
    const doc = Text.of(["$$", "x", "no marker"]);
    expect(getBlockMathContentRange(doc, makeInfo(doc, 1, 3))).toBeNull();
  });

  it("handles inline $$ markers on same line with content", () => {
    // $$content$$ on separate lines: open = "$$content", close = "$$"
    const doc = Text.of(["$$content", "$$"]);
    const range = getBlockMathContentRange(doc, makeInfo(doc, 1, 2));
    // openLineBare=false, so from = startLine.from + openIndex + 2 = 0 + 0 + 2 = 2
    // closeLineBare=true, so contentEndLine = 2-1 = 1, to = doc.line(1).to
    expect(range).not.toBeNull();
    expect(range!.from).toBe(2); // after $$
  });

  it("handles close line with inline content", () => {
    const doc = Text.of(["$$", "x + y", "$$close"]);
    const range = getBlockMathContentRange(doc, makeInfo(doc, 1, 3));
    // openLineBare=true, from = line 2 start
    // closeLineBare=false, to = endLine.from + closeIndex
    expect(range).not.toBeNull();
    expect(range!.from).toBe(doc.line(2).from);
    expect(range!.to).toBe(doc.line(3).from); // $$ at position 0
  });

  it("handles multi-line content", () => {
    const doc = Text.of(["$$", "line1", "line2", "line3", "$$"]);
    const range = getBlockMathContentRange(doc, makeInfo(doc, 1, 5));
    expect(range).not.toBeNull();
    expect(range!.from).toBe(doc.line(2).from);
    expect(range!.to).toBe(doc.line(4).to);
  });

  it("returns null when bare close and contentEndLine < 1", () => {
    // This requires endLine - 1 < 1, i.e., endLine = 1
    // But startLine < endLine, so startLine must be 0 which is already caught.
    // Actually we need startLine = 0 which returns null early.
    // Let's construct a case: endLine = 2, close on line 2 is bare,
    // contentEndLine = 1, but openLineBare and contentEndLine < startLine + 1
    const doc = Text.of(["$$", "$$"]);
    const range = getBlockMathContentRange(doc, makeInfo(doc, 1, 2));
    // openLineBare=true, closeLineBare=true
    // contentEndLine = 2-1 = 1, openLineBare && contentEndLine < startLine+1 => 1 < 2 => true
    expect(range).toBeNull();
  });
});

describe("getBlockMathUnwrapChanges", () => {
  it("returns unwrap changes that remove $$ delimiters", () => {
    const doc = Text.of(["$$", "a + b", "$$"]);
    const changes = getBlockMathUnwrapChanges(doc, makeInfo(doc, 1, 3));
    expect(changes).toEqual([
      { from: doc.line(1).from, to: doc.line(1).from + 2, insert: "" },
      { from: doc.line(3).from, to: doc.line(3).from + 2, insert: "" },
    ]);
  });

  it("returns null when startLine < 1", () => {
    const doc = Text.of(["$$", "x", "$$"]);
    const info = { ...makeInfo(doc, 1, 3), startLine: 0 };
    expect(getBlockMathUnwrapChanges(doc, info)).toBeNull();
  });

  it("returns null when endLine > doc.lines", () => {
    const doc = Text.of(["$$", "x", "$$"]);
    const info = { ...makeInfo(doc, 1, 3), endLine: 50 };
    expect(getBlockMathUnwrapChanges(doc, info)).toBeNull();
  });

  it("returns null when startLine >= endLine", () => {
    const doc = Text.of(["$$", "x", "$$"]);
    expect(getBlockMathUnwrapChanges(doc, { ...makeInfo(doc, 2, 2) })).toBeNull();
  });

  it("returns null when $$ not found on start line", () => {
    const doc = Text.of(["plain", "x", "$$"]);
    expect(getBlockMathUnwrapChanges(doc, makeInfo(doc, 1, 3))).toBeNull();
  });

  it("returns null when $$ not found on end line", () => {
    const doc = Text.of(["$$", "x", "plain"]);
    expect(getBlockMathUnwrapChanges(doc, makeInfo(doc, 1, 3))).toBeNull();
  });

  it("handles inline content after $$ on start line", () => {
    const doc = Text.of(["$$content", "more", "$$"]);
    const changes = getBlockMathUnwrapChanges(doc, makeInfo(doc, 1, 3));
    expect(changes).not.toBeNull();
    // Should remove $$ from start of line 1
    expect(changes![0]).toEqual({ from: 0, to: 2, insert: "" });
  });
});
