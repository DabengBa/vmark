/**
 * Tests for blockImage tiptap extension — node definition, attributes,
 * parseHTML, renderHTML, and keyboard shortcuts.
 */

import { describe, it, expect, vi } from "vitest";

// Mock CSS and node view
vi.mock("./block-image.css", () => ({}));
vi.mock("./BlockImageNodeView", () => ({
  BlockImageNodeView: vi.fn(),
}));
vi.mock("../shared/sourceLineAttr", () => ({
  sourceLineAttr: {},
}));

import { blockImageExtension } from "./tiptap";

describe("blockImageExtension", () => {
  it("has name 'block_image'", () => {
    expect(blockImageExtension.name).toBe("block_image");
  });

  it("is a block node", () => {
    expect(blockImageExtension.config.group).toBe("block");
  });

  it("is an atom node", () => {
    expect(blockImageExtension.config.atom).toBe(true);
  });

  it("is isolating", () => {
    expect(blockImageExtension.config.isolating).toBe(true);
  });

  it("is selectable", () => {
    expect(blockImageExtension.config.selectable).toBe(true);
  });

  it("is draggable", () => {
    expect(blockImageExtension.config.draggable).toBe(true);
  });

  it("does not allow marks", () => {
    expect(blockImageExtension.config.marks).toBe("");
  });

  it("is a defining node", () => {
    expect(blockImageExtension.config.defining).toBe(true);
  });

  describe("attributes", () => {
    it("defines src, alt, title attributes", () => {
      const attrs = blockImageExtension.config.addAttributes!.call({} as never);
      expect(attrs.src).toBeDefined();
      expect(attrs.src.default).toBe("");
      expect(attrs.alt).toBeDefined();
      expect(attrs.alt.default).toBe("");
      expect(attrs.title).toBeDefined();
      expect(attrs.title.default).toBe("");
    });
  });

  describe("parseHTML", () => {
    it("matches figure[data-type='block_image']", () => {
      const rules = blockImageExtension.config.parseHTML!.call({} as never);
      expect(rules).toHaveLength(1);
      expect(rules[0].tag).toBe('figure[data-type="block_image"]');
    });

    it("extracts attrs from img child element", () => {
      const rules = blockImageExtension.config.parseHTML!.call({} as never);
      const getAttrs = rules[0].getAttrs!;
      const mockDom = {
        querySelector: (sel: string) =>
          sel === "img"
            ? {
                getAttribute: (attr: string) => {
                  const map: Record<string, string> = { src: "pic.png", alt: "desc", title: "My pic" };
                  return map[attr] ?? null;
                },
              }
            : null,
      };
      const attrs = getAttrs(mockDom as never);
      expect(attrs).toEqual({ src: "pic.png", alt: "desc", title: "My pic" });
    });

    it("defaults to empty strings when img has no attributes", () => {
      const rules = blockImageExtension.config.parseHTML!.call({} as never);
      const getAttrs = rules[0].getAttrs!;
      const mockDom = {
        querySelector: () => ({ getAttribute: () => null }),
      };
      const attrs = getAttrs(mockDom as never);
      expect(attrs).toEqual({ src: "", alt: "", title: "" });
    });

    it("handles missing img element", () => {
      const rules = blockImageExtension.config.parseHTML!.call({} as never);
      const getAttrs = rules[0].getAttrs!;
      const mockDom = { querySelector: () => null };
      const attrs = getAttrs(mockDom as never);
      expect(attrs).toEqual({ src: "", alt: "", title: "" });
    });
  });

  describe("renderHTML", () => {
    it("renders as figure with img child", () => {
      const result = blockImageExtension.config.renderHTML!.call(
        {} as never,
        {
          node: { attrs: { src: "test.png", alt: "alt text", title: "title text" } },
          HTMLAttributes: {},
        } as never
      );
      expect(result[0]).toBe("figure");
      expect(result[1]["data-type"]).toBe("block_image");
      expect(result[1].class).toBe("block-image");
      expect(result[2][0]).toBe("img");
      expect(result[2][1].src).toBe("test.png");
      expect(result[2][1].alt).toBe("alt text");
      expect(result[2][1].title).toBe("title text");
    });

    it("handles null/undefined attrs", () => {
      const result = blockImageExtension.config.renderHTML!.call(
        {} as never,
        {
          node: { attrs: { src: null, alt: undefined, title: null } },
          HTMLAttributes: {},
        } as never
      );
      expect(result[2][1].src).toBe("");
      // undefined ?? "" evaluates to "", String("") = ""
      expect(result[2][1].alt).toBe("");
      expect(result[2][1].title).toBe("");
    });
  });

  describe("keyboard shortcuts", () => {
    it("defines Enter, ArrowUp, ArrowDown shortcuts", () => {
      const shortcuts = blockImageExtension.config.addKeyboardShortcuts!.call({} as never);
      expect(shortcuts).toHaveProperty("Enter");
      expect(shortcuts).toHaveProperty("ArrowUp");
      expect(shortcuts).toHaveProperty("ArrowDown");
    });
  });

  describe("node view", () => {
    it("defines addNodeView", () => {
      expect(blockImageExtension.config.addNodeView).toBeDefined();
    });
  });
});
