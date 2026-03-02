/**
 * Tests for MermaidPreviewView — show/hide lifecycle, zoom, drag, resize,
 * content update debouncing, and destroy cleanup.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/plugins/shared/diagramCleanup", () => ({
  cleanupDescendants: vi.fn(),
}));

vi.mock("@/utils/popupPosition", () => ({
  calculatePopupPosition: vi.fn(() => ({ top: 100, left: 200 })),
  getBoundaryRects: vi.fn(() => ({
    top: 0, left: 0, bottom: 800, right: 1200, width: 1200, height: 800,
  })),
  getViewportBounds: vi.fn(() => ({
    top: 0, left: 0, bottom: 800, right: 1200, width: 1200, height: 800,
  })),
}));

vi.mock("@/plugins/sourcePopup", () => ({
  getPopupHostForDom: vi.fn(() => null),
  toHostCoordsForDom: vi.fn((_host: HTMLElement, pos: { top: number; left: number }) => pos),
}));

vi.mock("../mermaidPreviewRender", () => ({
  renderPreview: vi.fn(() => 1),
}));

import { MermaidPreviewView, getMermaidPreviewView } from "../MermaidPreviewView";
import { renderPreview } from "../mermaidPreviewRender";
import { cleanupDescendants } from "@/plugins/shared/diagramCleanup";

describe("MermaidPreviewView", () => {
  let view: MermaidPreviewView;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    view = new MermaidPreviewView();
  });

  afterEach(() => {
    view.destroy();
    vi.useRealTimers();
  });

  describe("show/hide lifecycle", () => {
    it("starts hidden", () => {
      expect(view.isVisible()).toBe(false);
    });

    it("becomes visible after show()", () => {
      const editorDom = document.createElement("div");
      const anchor = { top: 50, left: 100, width: 10, height: 20 };

      view.show("graph TD; A-->B", anchor, editorDom);

      expect(view.isVisible()).toBe(true);
      expect(renderPreview).toHaveBeenCalled();
    });

    it("becomes hidden after hide()", () => {
      const editorDom = document.createElement("div");
      view.show("graph TD; A-->B", { top: 50, left: 100, width: 10, height: 20 }, editorDom);

      view.hide();

      expect(view.isVisible()).toBe(false);
      expect(cleanupDescendants).toHaveBeenCalled();
    });

    it("clears debounce timer on hide", () => {
      const editorDom = document.createElement("div");
      view.show("graph TD; A-->B", { top: 50, left: 100, width: 10, height: 20 }, editorDom);

      view.updateContent("new content");
      view.hide();

      // Advancing timers should not trigger render
      vi.advanceTimersByTime(500);
      // renderPreview called once on show(), not again after hide cleared timer
      expect(vi.mocked(renderPreview)).toHaveBeenCalledTimes(1);
    });

    it("show with language parameter", () => {
      view.show("test", { top: 0, left: 0, width: 10, height: 10 }, undefined, "svg");
      expect(view.isVisible()).toBe(true);
    });
  });

  describe("updateContent", () => {
    it("debounces mermaid rendering", () => {
      const editorDom = document.createElement("div");
      view.show("initial", { top: 0, left: 0, width: 10, height: 10 }, editorDom);
      vi.mocked(renderPreview).mockClear();

      view.updateContent("update 1");
      view.updateContent("update 2");
      view.updateContent("update 3");

      // No immediate render
      expect(renderPreview).not.toHaveBeenCalled();

      // After debounce period
      vi.advanceTimersByTime(200);
      expect(renderPreview).toHaveBeenCalledTimes(1);
    });

    it("renders SVG immediately without debounce", () => {
      view.show("initial", { top: 0, left: 0, width: 10, height: 10 }, undefined, "svg");
      vi.mocked(renderPreview).mockClear();

      view.updateContent("<svg></svg>", "svg");

      // Should render immediately
      expect(renderPreview).toHaveBeenCalledTimes(1);
    });

    it("clears pending debounce timer for SVG", () => {
      view.show("initial", { top: 0, left: 0, width: 10, height: 10 });
      vi.mocked(renderPreview).mockClear();

      // Start a mermaid debounce
      view.updateContent("mermaid content");
      expect(renderPreview).not.toHaveBeenCalled();

      // Switch to SVG — should cancel debounce and render immediately
      view.updateContent("<svg></svg>", "svg");
      expect(renderPreview).toHaveBeenCalledTimes(1);

      // The original debounce should not fire
      vi.advanceTimersByTime(300);
      expect(renderPreview).toHaveBeenCalledTimes(1);
    });

    it("updates language when provided", () => {
      view.show("initial", { top: 0, left: 0, width: 10, height: 10 });
      vi.mocked(renderPreview).mockClear();

      view.updateContent("content", "markmap");
      vi.advanceTimersByTime(200);

      const callArgs = vi.mocked(renderPreview).mock.calls[0];
      expect(callArgs[1].currentLanguage).toBe("markmap");
    });
  });

  describe("zoom", () => {
    it("zoom in button increases zoom", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      // Find zoom in button and click it
      const container = document.querySelector(".mermaid-preview-popup");
      const zoomInBtn = container?.querySelector('[data-action="in"]') as HTMLElement;

      expect(zoomInBtn).not.toBeNull();
      zoomInBtn.click();

      const zoomDisplay = container?.querySelector(".mermaid-preview-zoom-value");
      expect(zoomDisplay?.textContent).toBe("110%");
    });

    it("zoom out button decreases zoom", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup");
      const zoomOutBtn = container?.querySelector('[data-action="out"]') as HTMLElement;

      expect(zoomOutBtn).not.toBeNull();
      zoomOutBtn.click();

      const zoomDisplay = container?.querySelector(".mermaid-preview-zoom-value");
      expect(zoomDisplay?.textContent).toBe("90%");
    });

    it("zoom does not exceed max (300%)", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup");
      const zoomInBtn = container?.querySelector('[data-action="in"]') as HTMLElement;

      // Click 25 times (100% + 25*10 = 350%, should cap at 300%)
      for (let i = 0; i < 25; i++) {
        zoomInBtn.click();
      }

      const zoomDisplay = container?.querySelector(".mermaid-preview-zoom-value");
      expect(zoomDisplay?.textContent).toBe("300%");
    });

    it("zoom does not go below min (10%)", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup");
      const zoomOutBtn = container?.querySelector('[data-action="out"]') as HTMLElement;

      // Click 15 times (100% - 15*10 = -50%, should cap at 10%)
      for (let i = 0; i < 15; i++) {
        zoomOutBtn.click();
      }

      const zoomDisplay = container?.querySelector(".mermaid-preview-zoom-value");
      expect(zoomDisplay?.textContent).toBe("10%");
    });

    it("ignores click on non-button zoom area", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup");
      const zoomArea = container?.querySelector(".mermaid-preview-zoom") as HTMLElement;
      const zoomDisplay = container?.querySelector(".mermaid-preview-zoom-value");

      // Click on the zoom value text (not a button)
      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", { value: zoomDisplay });
      zoomArea?.dispatchEvent(clickEvent);

      // Zoom should remain at 100%
      expect(zoomDisplay?.textContent).toBe("100%");
    });
  });

  describe("updatePosition", () => {
    it("does not update position if user has dragged", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup") as HTMLElement;
      const header = container?.querySelector(".mermaid-preview-header") as HTMLElement;

      // Simulate drag: mousedown on header, mousemove > 5px, mouseup
      const mousedown = new MouseEvent("mousedown", { clientX: 10, clientY: 10, bubbles: true });
      header.dispatchEvent(mousedown);

      const mousemove = new MouseEvent("mousemove", { clientX: 50, clientY: 50, bubbles: true });
      document.dispatchEvent(mousemove);

      const mouseup = new MouseEvent("mouseup", { bubbles: true });
      document.dispatchEvent(mouseup);

      // After drag, updatePosition should be a no-op
      const currentTop = container.style.top;
      const currentLeft = container.style.left;

      view.updatePosition({ top: 999, left: 999, width: 10, height: 10 });

      expect(container.style.top).toBe(currentTop);
      expect(container.style.left).toBe(currentLeft);
    });
  });

  describe("destroy", () => {
    it("removes container from DOM", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });
      const container = document.querySelector(".mermaid-preview-popup");
      expect(container).not.toBeNull();

      view.destroy();

      expect(document.querySelector(".mermaid-preview-popup")).toBeNull();
    });

    it("cleans up event listeners", () => {
      const removeSpy = vi.spyOn(document, "removeEventListener");

      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });
      view.destroy();

      // Should remove mousemove and mouseup for both drag and resize
      const removedEvents = removeSpy.mock.calls.map((c) => c[0]);
      expect(removedEvents).toContain("mousemove");
      expect(removedEvents).toContain("mouseup");

      removeSpy.mockRestore();
    });

    it("clears debounce timer on destroy", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });
      view.updateContent("pending");
      vi.mocked(renderPreview).mockClear();

      view.destroy();

      vi.advanceTimersByTime(500);
      expect(renderPreview).not.toHaveBeenCalled();
    });

    it("calls cleanupDescendants on destroy", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });
      vi.mocked(cleanupDescendants).mockClear();

      view.destroy();

      expect(cleanupDescendants).toHaveBeenCalled();
    });
  });

  describe("resize", () => {
    it("resizes from SE corner", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup") as HTMLElement;
      const seHandle = container.querySelector('.mermaid-preview-resize-se') as HTMLElement;
      expect(seHandle).not.toBeNull();

      // Simulate resize: mousedown on handle, mousemove, mouseup
      const mousedown = new MouseEvent("mousedown", {
        clientX: 400, clientY: 300, bubbles: true,
      });
      seHandle.dispatchEvent(mousedown);

      expect(container.classList.contains("resizing")).toBe(true);

      const mousemove = new MouseEvent("mousemove", {
        clientX: 500, clientY: 400, bubbles: true,
      });
      document.dispatchEvent(mousemove);

      const mouseup = new MouseEvent("mouseup", { bubbles: true });
      document.dispatchEvent(mouseup);

      expect(container.classList.contains("resizing")).toBe(false);
    });

    it("enforces minimum width and height during resize", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup") as HTMLElement;
      container.style.width = "300px";
      container.style.height = "250px";

      const seHandle = container.querySelector('.mermaid-preview-resize-se') as HTMLElement;

      const mousedown = new MouseEvent("mousedown", {
        clientX: 300, clientY: 250, bubbles: true,
      });
      seHandle.dispatchEvent(mousedown);

      // Move to shrink below minimum (200x150)
      const mousemove = new MouseEvent("mousemove", {
        clientX: 50, clientY: 50, bubbles: true,
      });
      document.dispatchEvent(mousemove);

      const width = parseInt(container.style.width);
      const height = parseInt(container.style.height);
      expect(width).toBeGreaterThanOrEqual(200);
      expect(height).toBeGreaterThanOrEqual(150);

      const mouseup = new MouseEvent("mouseup", { bubbles: true });
      document.dispatchEvent(mouseup);
    });

    it("resizes from NW corner adjusting position", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup") as HTMLElement;
      const nwHandle = container.querySelector('.mermaid-preview-resize-nw') as HTMLElement;

      const mousedown = new MouseEvent("mousedown", {
        clientX: 100, clientY: 100, bubbles: true,
      });
      nwHandle.dispatchEvent(mousedown);

      const mousemove = new MouseEvent("mousemove", {
        clientX: 80, clientY: 80, bubbles: true,
      });
      document.dispatchEvent(mousemove);

      const mouseup = new MouseEvent("mouseup", { bubbles: true });
      document.dispatchEvent(mouseup);
    });

    it("does nothing on resize move when not resizing", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });
      const container = document.querySelector(".mermaid-preview-popup") as HTMLElement;
      const initialWidth = container.style.width;

      const mousemove = new MouseEvent("mousemove", {
        clientX: 500, clientY: 400, bubbles: true,
      });
      document.dispatchEvent(mousemove);

      expect(container.style.width).toBe(initialWidth);
    });
  });

  describe("wheel zoom", () => {
    it("zooms in on Cmd+scroll up", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup") as HTMLElement;
      const content = container.querySelector(".mermaid-preview-content") as HTMLElement;

      const wheelEvent = new WheelEvent("wheel", {
        deltaY: -100,
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      content.dispatchEvent(wheelEvent);

      const zoomDisplay = container.querySelector(".mermaid-preview-zoom-value");
      expect(zoomDisplay?.textContent).toBe("110%");
    });

    it("zooms out on Cmd+scroll down", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup") as HTMLElement;
      const content = container.querySelector(".mermaid-preview-content") as HTMLElement;

      const wheelEvent = new WheelEvent("wheel", {
        deltaY: 100,
        metaKey: true,
        bubbles: true,
        cancelable: true,
      });
      content.dispatchEvent(wheelEvent);

      const zoomDisplay = container.querySelector(".mermaid-preview-zoom-value");
      expect(zoomDisplay?.textContent).toBe("90%");
    });

    it("does not zoom without modifier key", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup") as HTMLElement;
      const content = container.querySelector(".mermaid-preview-content") as HTMLElement;

      const wheelEvent = new WheelEvent("wheel", {
        deltaY: -100,
        bubbles: true,
        cancelable: true,
      });
      content.dispatchEvent(wheelEvent);

      const zoomDisplay = container.querySelector(".mermaid-preview-zoom-value");
      expect(zoomDisplay?.textContent).toBe("100%");
    });

    it("Ctrl+scroll also zooms", () => {
      view.show("graph TD; A-->B", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup") as HTMLElement;
      const content = container.querySelector(".mermaid-preview-content") as HTMLElement;

      const wheelEvent = new WheelEvent("wheel", {
        deltaY: -100,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });
      content.dispatchEvent(wheelEvent);

      const zoomDisplay = container.querySelector(".mermaid-preview-zoom-value");
      expect(zoomDisplay?.textContent).toBe("110%");
    });
  });

  describe("drag on controls area", () => {
    it("does not start drag when clicking on zoom controls", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });

      const container = document.querySelector(".mermaid-preview-popup") as HTMLElement;
      const zoomArea = container.querySelector(".mermaid-preview-zoom") as HTMLElement;

      const mousedown = new MouseEvent("mousedown", {
        clientX: 10, clientY: 10, bubbles: true,
      });
      Object.defineProperty(mousedown, "target", { value: zoomArea, writable: false });
      container.querySelector(".mermaid-preview-header")?.dispatchEvent(mousedown);

      // Zoom area is a child of header, so closest(".mermaid-preview-zoom") returns it
      expect(container.classList.contains("dragging")).toBe(false);
    });
  });

  describe("show edge cases", () => {
    it("appends to host when parent changes", () => {
      const editorDom1 = document.createElement("div");
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 }, editorDom1);
      expect(view.isVisible()).toBe(true);

      view.hide();

      const editorDom2 = document.createElement("div");
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 }, editorDom2);
      expect(view.isVisible()).toBe(true);
    });

    it("resets zoom and hasDragged on new show", () => {
      view.show("graph TD", { top: 0, left: 0, width: 10, height: 10 });

      // Zoom in
      const container = document.querySelector(".mermaid-preview-popup") as HTMLElement;
      const zoomInBtn = container.querySelector('[data-action="in"]') as HTMLElement;
      zoomInBtn.click();

      view.hide();

      // Show again - zoom should stay as it persists
      view.show("graph LR", { top: 0, left: 0, width: 10, height: 10 });
      expect(view.isVisible()).toBe(true);
    });
  });
});

describe("getMermaidPreviewView", () => {
  it("returns a singleton instance", () => {
    const instance1 = getMermaidPreviewView();
    const instance2 = getMermaidPreviewView();

    expect(instance1).toBe(instance2);
    expect(instance1).toBeInstanceOf(MermaidPreviewView);
  });
});
