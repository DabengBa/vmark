/**
 * Tests for blockImage extension — extension metadata, parseHTML, renderHTML.
 */

import { describe, it, expect } from "vitest";
import { blockImageExtension } from "../tiptap";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeElement(tag: string, attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function makeFigureWithImg(imgAttrs: Record<string, string> = {}): HTMLElement {
  const figure = makeElement("figure", { "data-type": "block_image" });
  const img = makeElement("img", imgAttrs);
  figure.appendChild(img);
  return figure;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("blockImageExtension", () => {
  it("has correct name", () => {
    expect(blockImageExtension.name).toBe("block_image");
  });

  it("is a block atom node", () => {
    const config = blockImageExtension.config;
    expect(config.atom).toBe(true);
    expect(config.group).toBe("block");
    expect(config.selectable).toBe(true);
    expect(config.draggable).toBe(true);
    expect(config.isolating).toBe(true);
  });

  describe("parseHTML getAttrs", () => {
    const parseRules = blockImageExtension.config.parseHTML!.call({} as never)!;
    const getAttrs = parseRules[0].getAttrs as (el: HTMLElement) => Record<string, unknown>;

    it("extracts src, alt, title from nested img", () => {
      const figure = makeFigureWithImg({
        src: "photo.png",
        alt: "A photo",
        title: "Photo title",
      });
      expect(getAttrs(figure)).toEqual({
        src: "photo.png",
        alt: "A photo",
        title: "Photo title",
      });
    });

    it("defaults to empty strings when img has no attributes", () => {
      const figure = makeFigureWithImg();
      expect(getAttrs(figure)).toEqual({
        src: "",
        alt: "",
        title: "",
      });
    });

    it("defaults to empty strings when there is no img element", () => {
      const figure = makeElement("figure", { "data-type": "block_image" });
      expect(getAttrs(figure)).toEqual({
        src: "",
        alt: "",
        title: "",
      });
    });

    it("handles img with only src attribute", () => {
      const figure = makeFigureWithImg({ src: "image.jpg" });
      const attrs = getAttrs(figure);
      expect(attrs.src).toBe("image.jpg");
      expect(attrs.alt).toBe("");
      expect(attrs.title).toBe("");
    });

    it("handles special characters in src", () => {
      const figure = makeFigureWithImg({ src: "path/to/image (1).png" });
      expect(getAttrs(figure).src).toBe("path/to/image (1).png");
    });
  });
});
