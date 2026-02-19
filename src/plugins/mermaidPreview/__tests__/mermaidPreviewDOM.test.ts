/**
 * Tests for mermaidPreviewDOM — pure DOM construction.
 */

import { describe, it, expect } from "vitest";
import { buildContainer } from "../mermaidPreviewDOM";

describe("buildContainer", () => {
  it("creates a container with mermaid-preview-popup class", () => {
    const container = buildContainer();
    expect(container.className).toBe("mermaid-preview-popup");
  });

  it("starts hidden", () => {
    const container = buildContainer();
    expect(container.style.display).toBe("none");
  });

  it("contains a header with title and zoom controls", () => {
    const container = buildContainer();
    const header = container.querySelector(".mermaid-preview-header");
    expect(header).not.toBeNull();

    const title = header!.querySelector(".mermaid-preview-title");
    expect(title).not.toBeNull();
    expect(title!.textContent).toBe("Preview");

    const zoomControls = header!.querySelector(".mermaid-preview-zoom");
    expect(zoomControls).not.toBeNull();
  });

  it("contains zoom in and zoom out buttons", () => {
    const container = buildContainer();
    const buttons = container.querySelectorAll(".mermaid-preview-zoom-btn");
    expect(buttons.length).toBe(2);

    const outBtn = container.querySelector('[data-action="out"]');
    const inBtn = container.querySelector('[data-action="in"]');
    expect(outBtn).not.toBeNull();
    expect(inBtn).not.toBeNull();
    expect(outBtn!.textContent).toBe("\u2212");
    expect(inBtn!.textContent).toBe("+");
  });

  it("contains zoom value display defaulting to 100%", () => {
    const container = buildContainer();
    const zoomValue = container.querySelector(".mermaid-preview-zoom-value");
    expect(zoomValue).not.toBeNull();
    expect(zoomValue!.textContent).toBe("100%");
  });

  it("contains preview content area", () => {
    const container = buildContainer();
    const preview = container.querySelector(".mermaid-preview-content");
    expect(preview).not.toBeNull();
  });

  it("contains error display area", () => {
    const container = buildContainer();
    const error = container.querySelector(".mermaid-preview-error");
    expect(error).not.toBeNull();
  });

  it("contains 8 resize handles for all directions", () => {
    const container = buildContainer();
    const handles = container.querySelectorAll(".mermaid-preview-resize");
    expect(handles.length).toBe(8);

    const directions = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    directions.forEach((dir) => {
      const handle = container.querySelector(`.mermaid-preview-resize-${dir}`);
      expect(handle).not.toBeNull();
      expect((handle as HTMLElement).dataset.corner).toBe(dir);
    });
  });
});
