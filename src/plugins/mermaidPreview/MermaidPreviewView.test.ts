/**
 * Tests for MermaidPreviewView — floating Mermaid diagram preview.
 *
 * Covers:
 *   - Constructor, buildContainer elements
 *   - show/hide/isVisible lifecycle
 *   - updatePosition (no-op after drag)
 *   - updateContent (mermaid debounce, SVG immediate)
 *   - Zoom controls (in, out, clamping)
 *   - Drag and resize state
 *   - destroy cleanup
 *   - getMermaidPreviewView singleton
 */

vi.mock("@/plugins/shared/diagramCleanup", () => ({
  cleanupDescendants: vi.fn(),
}));

vi.mock("@/utils/popupPosition", () => ({
  calculatePopupPosition: vi.fn(() => ({ top: 50, left: 100 })),
  getBoundaryRects: vi.fn(() => ({
    horizontal: { left: 0, right: 800 },
    vertical: { top: 0, bottom: 600 },
  })),
  getViewportBounds: vi.fn(() => ({
    horizontal: { left: 0, right: 800 },
    vertical: { top: 0, bottom: 600 },
  })),
}));

vi.mock("@/plugins/sourcePopup", () => ({
  getPopupHostForDom: vi.fn(() => null),
  toHostCoordsForDom: vi.fn(
    (_host: unknown, pos: { top: number; left: number }) => pos
  ),
}));

const mockRenderPreview = vi.fn(() => 1);
vi.mock("./mermaidPreviewRender", () => ({
  renderPreview: (...args: unknown[]) => mockRenderPreview(...args),
}));

vi.mock("./mermaidPreviewDOM", () => ({
  buildContainer: vi.fn(() => {
    const container = document.createElement("div");
    container.className = "mermaid-preview";

    const header = document.createElement("div");
    header.className = "mermaid-preview-header";
    container.appendChild(header);

    const zoomControls = document.createElement("div");
    zoomControls.className = "mermaid-preview-zoom";
    const zoomIn = document.createElement("button");
    zoomIn.className = "mermaid-preview-zoom-btn";
    zoomIn.dataset.action = "in";
    const zoomOut = document.createElement("button");
    zoomOut.className = "mermaid-preview-zoom-btn";
    zoomOut.dataset.action = "out";
    const zoomValue = document.createElement("span");
    zoomValue.className = "mermaid-preview-zoom-value";
    zoomValue.textContent = "100%";
    zoomControls.appendChild(zoomOut);
    zoomControls.appendChild(zoomValue);
    zoomControls.appendChild(zoomIn);
    header.appendChild(zoomControls);

    const content = document.createElement("div");
    content.className = "mermaid-preview-content";
    container.appendChild(content);

    const error = document.createElement("div");
    error.className = "mermaid-preview-error";
    container.appendChild(error);

    // Resize handles
    for (const corner of ["nw", "ne", "sw", "se"]) {
      const handle = document.createElement("div");
      handle.className = "mermaid-preview-resize";
      handle.dataset.corner = corner;
      container.appendChild(handle);
    }

    return container;
  }),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MermaidPreviewView, getMermaidPreviewView } from "./MermaidPreviewView";

const ANCHOR = { top: 100, left: 200, bottom: 120, right: 250 };

describe("MermaidPreviewView", () => {
  let preview: MermaidPreviewView;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    preview = new MermaidPreviewView();
  });

  afterEach(() => {
    preview.destroy();
    vi.useRealTimers();
  });

  it("starts hidden", () => {
    expect(preview.isVisible()).toBe(false);
  });

  it("becomes visible after show()", () => {
    preview.show("graph LR; A-->B", ANCHOR);
    expect(preview.isVisible()).toBe(true);
  });

  it("calls renderPreview on show", () => {
    preview.show("graph LR; A-->B", ANCHOR);
    expect(mockRenderPreview).toHaveBeenCalled();
  });

  it("hides and resets state", () => {
    preview.show("graph LR; A-->B", ANCHOR);
    preview.hide();
    expect(preview.isVisible()).toBe(false);
  });

  it("debounces mermaid updateContent", () => {
    preview.show("graph LR; A-->B", ANCHOR);
    mockRenderPreview.mockClear();

    preview.updateContent("graph LR; A-->C");
    expect(mockRenderPreview).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(mockRenderPreview).toHaveBeenCalled();
  });

  it("renders SVG content immediately without debounce", () => {
    preview.show("<svg></svg>", ANCHOR, undefined, "svg");
    mockRenderPreview.mockClear();

    preview.updateContent("<svg><rect/></svg>", "svg");
    // SVG should render immediately
    expect(mockRenderPreview).toHaveBeenCalled();
  });

  it("updatePosition is no-op after drag", () => {
    preview.show("graph LR; A-->B", ANCHOR);

    // Simulate drag via header mousedown + mousemove > 5px
    const header = document.querySelector(".mermaid-preview-header") as HTMLElement;
    const mousedown = new MouseEvent("mousedown", { clientX: 100, clientY: 100, bubbles: true });
    header.dispatchEvent(mousedown);

    const mousemove = new MouseEvent("mousemove", { clientX: 200, clientY: 200, bubbles: true });
    document.dispatchEvent(mousemove);

    const mouseup = new MouseEvent("mouseup", { bubbles: true });
    document.dispatchEvent(mouseup);

    // After dragging, updatePosition should be a no-op
    const container = document.querySelector(".mermaid-preview") as HTMLElement;
    const topBefore = container?.style.top;
    preview.updatePosition(ANCHOR);
    expect(container?.style.top).toBe(topBefore);
  });

  it("destroy removes event listeners", () => {
    const removeSpy = vi.spyOn(document, "removeEventListener");
    preview.destroy();
    // Should remove mousemove and mouseup for both drag and resize
    expect(removeSpy).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("mouseup", expect.any(Function));
    removeSpy.mockRestore();
  });

  it("destroy clears debounce timer", () => {
    preview.show("graph LR; A-->B", ANCHOR);
    preview.updateContent("graph LR; A-->C");
    // Timer is pending — destroy should clear it
    preview.destroy();
    mockRenderPreview.mockClear();
    vi.advanceTimersByTime(500);
    expect(mockRenderPreview).not.toHaveBeenCalled();
  });

  it("zoom buttons change zoom level", () => {
    preview.show("graph LR; A-->B", ANCHOR);
    const zoomControls = document.querySelector(".mermaid-preview-zoom") as HTMLElement;
    const zoomIn = zoomControls.querySelector('[data-action="in"]') as HTMLElement;
    const zoomOut = zoomControls.querySelector('[data-action="out"]') as HTMLElement;
    const zoomValue = document.querySelector(".mermaid-preview-zoom-value") as HTMLElement;

    // Click zoom in
    zoomIn.click();
    expect(zoomValue.textContent).toBe("110%");

    // Click zoom out
    zoomOut.click();
    expect(zoomValue.textContent).toBe("100%");
  });
});

describe("getMermaidPreviewView", () => {
  it("returns singleton instance", () => {
    const a = getMermaidPreviewView();
    const b = getMermaidPreviewView();
    expect(a).toBe(b);
  });
});
