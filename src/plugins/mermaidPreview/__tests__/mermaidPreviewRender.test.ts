/**
 * Tests for mermaidPreviewRender — render dispatch logic.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/plugins/mermaid", () => ({
  renderMermaid: vi.fn(),
}));

vi.mock("@/plugins/markmap", () => ({
  renderMarkmapToElement: vi.fn(),
}));

vi.mock("@/plugins/shared/diagramCleanup", () => ({
  cleanupDescendants: vi.fn(),
}));

vi.mock("@/plugins/svg/svgRender", () => ({
  renderSvgBlock: vi.fn(),
}));

vi.mock("@/utils/sanitize", () => ({
  sanitizeSvg: vi.fn((svg: string) => svg),
}));

import { renderPreview, type RenderContext } from "../mermaidPreviewRender";
import { renderMermaid } from "@/plugins/mermaid";
import { renderSvgBlock } from "@/plugins/svg/svgRender";
import { renderMarkmapToElement } from "@/plugins/markmap";

function createContext(overrides: Partial<RenderContext> = {}): RenderContext {
  return {
    preview: document.createElement("div"),
    error: document.createElement("div"),
    currentLanguage: "mermaid",
    renderToken: 0,
    applyZoom: vi.fn(),
    ...overrides,
  };
}

describe("renderPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears preview and adds empty class for empty content", () => {
    const ctx = createContext();
    ctx.preview.innerHTML = "<div>old</div>";

    const token = renderPreview("", ctx);

    expect(ctx.preview.innerHTML).toBe("");
    expect(ctx.preview.classList.contains("mermaid-preview-empty")).toBe(true);
    expect(token).toBe(0);
  });

  it("clears preview and adds empty class for whitespace-only content", () => {
    const ctx = createContext();

    renderPreview("   \n  ", ctx);

    expect(ctx.preview.innerHTML).toBe("");
    expect(ctx.preview.classList.contains("mermaid-preview-empty")).toBe(true);
  });

  it("clears error text on each call", () => {
    const ctx = createContext();
    ctx.error.textContent = "old error";

    renderPreview("", ctx);

    expect(ctx.error.textContent).toBe("");
  });

  it("removes empty class when content is provided", () => {
    const ctx = createContext();
    ctx.preview.classList.add("mermaid-preview-empty");
    vi.mocked(renderMermaid).mockResolvedValue("<svg></svg>");

    renderPreview("graph TD; A-->B", ctx);

    expect(ctx.preview.classList.contains("mermaid-preview-empty")).toBe(false);
  });

  describe("SVG language", () => {
    it("renders SVG synchronously when renderSvgBlock returns content", () => {
      const ctx = createContext({ currentLanguage: "svg" });
      vi.mocked(renderSvgBlock).mockReturnValue("<svg><rect/></svg>");

      const token = renderPreview("<svg><rect/></svg>", ctx);

      expect(renderSvgBlock).toHaveBeenCalledWith("<svg><rect/></svg>");
      expect(ctx.preview.innerHTML).toContain("<svg>");
      expect(ctx.preview.innerHTML).toContain("rect");
      expect(ctx.error.textContent).toBe("");
      expect(ctx.applyZoom).toHaveBeenCalled();
      expect(token).toBe(0); // Token unchanged for sync render
    });

    it("shows error for invalid SVG", () => {
      const ctx = createContext({ currentLanguage: "svg" });
      vi.mocked(renderSvgBlock).mockReturnValue(null);

      renderPreview("not svg", ctx);

      expect(ctx.preview.innerHTML).toBe("");
      expect(ctx.preview.classList.contains("mermaid-preview-error-state")).toBe(true);
      expect(ctx.error.textContent).toBe("Invalid SVG");
    });
  });

  describe("Markmap language", () => {
    it("creates SVG element and calls renderMarkmapToElement", () => {
      const ctx = createContext({ currentLanguage: "markmap" });
      vi.mocked(renderMarkmapToElement).mockResolvedValue({} as never);

      const token = renderPreview("# Hello", ctx);

      expect(renderMarkmapToElement).toHaveBeenCalled();
      const svgEl = ctx.preview.querySelector("svg");
      expect(svgEl).not.toBeNull();
      expect(token).toBe(1); // Token incremented for async render
    });
  });

  describe("Mermaid language", () => {
    it("increments render token for async render", () => {
      const ctx = createContext({ renderToken: 5 });
      vi.mocked(renderMermaid).mockResolvedValue("<svg></svg>");

      const token = renderPreview("graph TD; A-->B", ctx);

      expect(token).toBe(6);
    });

    it("shows loading state while rendering", () => {
      const ctx = createContext();
      vi.mocked(renderMermaid).mockResolvedValue("<svg></svg>");

      renderPreview("graph TD; A-->B", ctx);

      expect(ctx.preview.innerHTML).toContain("Rendering...");
    });

    it("renders mermaid SVG on success", async () => {
      const ctx = createContext();
      vi.mocked(renderMermaid).mockResolvedValue("<svg>diagram</svg>");

      renderPreview("graph TD; A-->B", ctx);

      await vi.waitFor(() => {
        expect(ctx.preview.innerHTML).toBe("<svg>diagram</svg>");
      });
      expect(ctx.applyZoom).toHaveBeenCalled();
    });

    it("shows error for null mermaid result", async () => {
      const ctx = createContext();
      vi.mocked(renderMermaid).mockResolvedValue(null);

      renderPreview("invalid mermaid", ctx);

      await vi.waitFor(() => {
        expect(ctx.error.textContent).toBe("Invalid mermaid syntax");
      });
      expect(ctx.preview.classList.contains("mermaid-preview-error-state")).toBe(true);
    });

    it("shows error on mermaid render failure", async () => {
      const ctx = createContext();
      vi.mocked(renderMermaid).mockRejectedValue(new Error("render failed"));

      renderPreview("graph TD; A-->B", ctx);

      await vi.waitFor(() => {
        expect(ctx.error.textContent).toBe("Preview failed");
      });
    });
  });
});
