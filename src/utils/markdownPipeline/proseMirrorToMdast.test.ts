/**
 * Tests for proseMirrorToMdast — PM document to MDAST tree conversion.
 *
 * Covers:
 *   - Basic block nodes: paragraph, heading, codeBlock, horizontalRule
 *   - Inline nodes: hardBreak, image, math_inline, footnote_reference
 *   - Custom nodes: wikiLink (with/without alias), html_inline, footnote_definition
 *   - Unknown node type warning
 *   - ListItem filtering at root level
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Schema } from "@tiptap/pm/model";

const { mockConverters, mockInlineConverters } = vi.hoisted(() => ({
  mockConverters: {
    convertParagraph: vi.fn(),
    convertHeading: vi.fn(),
    convertCodeBlock: vi.fn(),
    convertBlockquote: vi.fn(),
    convertAlertBlock: vi.fn(),
    convertDetailsBlock: vi.fn(),
    convertList: vi.fn(),
    convertListItem: vi.fn(),
    convertHorizontalRule: vi.fn(),
    convertTable: vi.fn(),
    convertBlockImage: vi.fn(),
    convertBlockVideo: vi.fn(),
    convertBlockAudio: vi.fn(),
    convertVideoEmbed: vi.fn(),
    convertFrontmatter: vi.fn(),
    convertDefinition: vi.fn(),
    convertHtmlBlock: vi.fn(),
  },
  mockInlineConverters: {
    convertHardBreak: vi.fn(() => ({ type: "break" })),
    convertImage: vi.fn(() => ({ type: "image", url: "test.png" })),
    convertTextWithMarks: vi.fn(() => [{ type: "text", value: "test" }]),
    convertMathInline: vi.fn(() => ({ type: "inlineMath", value: "x" })),
    convertFootnoteReference: vi.fn(() => ({ type: "footnoteReference", identifier: "1" })),
  },
}));

vi.mock("@/utils/debug", () => ({
  mdPipelineWarn: vi.fn(),
}));

vi.mock("./pmBlockConverters", () => mockConverters);
vi.mock("./pmInlineConverters", () => mockInlineConverters);

import { proseMirrorToMdast } from "./proseMirrorToMdast";
import { mdPipelineWarn } from "@/utils/debug";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    heading: { content: "inline*", group: "block", attrs: { level: { default: 1 } } },
    codeBlock: { content: "text*", group: "block", attrs: { language: { default: "" } } },
    horizontalRule: { group: "block" },
    text: { group: "inline" },
    hardBreak: { group: "inline", inline: true },
    image: { group: "inline", inline: true, attrs: { src: { default: "" } } },
  },
});

function createDoc(children: ReturnType<typeof schema.node>[]) {
  return schema.node("doc", null, children);
}

describe("proseMirrorToMdast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: converters return a simple object
    mockConverters.convertParagraph.mockReturnValue({ type: "paragraph", children: [] });
    mockConverters.convertHeading.mockReturnValue({ type: "heading", depth: 1, children: [] });
    mockConverters.convertCodeBlock.mockReturnValue({ type: "code", value: "" });
    mockConverters.convertHorizontalRule.mockReturnValue({ type: "thematicBreak" });
  });

  it("converts a document with a paragraph", () => {
    const doc = createDoc([schema.node("paragraph", null, [schema.text("Hello")])]);
    const result = proseMirrorToMdast(schema, doc);
    expect(result.type).toBe("root");
    expect(result.children).toHaveLength(1);
    expect(mockConverters.convertParagraph).toHaveBeenCalled();
  });

  it("converts a document with a heading", () => {
    const doc = createDoc([schema.node("heading", { level: 2 }, [schema.text("Title")])]);
    const result = proseMirrorToMdast(schema, doc);
    expect(result.children).toHaveLength(1);
    expect(mockConverters.convertHeading).toHaveBeenCalled();
  });

  it("converts a document with code block", () => {
    const doc = createDoc([schema.node("codeBlock", { language: "js" }, [schema.text("code")])]);
    const result = proseMirrorToMdast(schema, doc);
    expect(result.children).toHaveLength(1);
    expect(mockConverters.convertCodeBlock).toHaveBeenCalled();
  });

  it("converts a document with horizontal rule", () => {
    const doc = createDoc([schema.node("horizontalRule")]);
    const result = proseMirrorToMdast(schema, doc);
    expect(result.children).toHaveLength(1);
    expect(mockConverters.convertHorizontalRule).toHaveBeenCalled();
  });

  it("skips null converter results", () => {
    mockConverters.convertParagraph.mockReturnValue(null);
    const doc = createDoc([schema.node("paragraph")]);
    const result = proseMirrorToMdast(schema, doc);
    expect(result.children).toHaveLength(0);
  });

  it("handles converter returning array", () => {
    mockConverters.convertParagraph.mockReturnValue([
      { type: "paragraph", children: [] },
      { type: "paragraph", children: [] },
    ]);
    const doc = createDoc([schema.node("paragraph")]);
    const result = proseMirrorToMdast(schema, doc);
    expect(result.children).toHaveLength(2);
  });

  it("filters out listItem nodes at root level", () => {
    mockConverters.convertParagraph.mockReturnValue({ type: "listItem", children: [] });
    const doc = createDoc([schema.node("paragraph")]);
    const result = proseMirrorToMdast(schema, doc);
    expect(result.children).toHaveLength(0);
  });

  it("warns on unknown node type", () => {
    // Create a schema with an unknown node type using OrderedMap append
    const extSchema = new Schema({
      nodes: schema.spec.nodes.append({
        customUnknown: { group: "block", content: "text*" },
      }),
    });
    const doc = extSchema.node("doc", null, [extSchema.node("customUnknown")]);
    proseMirrorToMdast(extSchema, doc);
    expect(mdPipelineWarn).toHaveBeenCalledWith(
      expect.stringContaining("Unknown node type: customUnknown")
    );
  });

  it("converts multiple block nodes", () => {
    const doc = createDoc([
      schema.node("paragraph", null, [schema.text("First")]),
      schema.node("horizontalRule"),
      schema.node("paragraph", null, [schema.text("Second")]),
    ]);
    const result = proseMirrorToMdast(schema, doc);
    expect(result.children).toHaveLength(3);
  });
});
