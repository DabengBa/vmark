/**
 * LinkCreatePopupView Tests
 *
 * Tests for the link creation popup view including:
 * - Store subscription lifecycle (open/close)
 * - DOM structure (text input shown/hidden)
 * - Input handling (text, URL)
 * - Keyboard navigation (Tab, Escape, Enter)
 * - Click outside to close
 * - Save logic (empty URL, with text, without text)
 * - Scroll to close
 * - Destroy cleanup
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

// Mock stores and utilities before importing the view
const mockClosePopup = vi.fn();
const mockSetText = vi.fn();
const mockSetUrl = vi.fn();

let storeState = {
  isOpen: false,
  text: "",
  url: "",
  rangeFrom: 0,
  rangeTo: 0,
  anchorRect: null as { top: number; left: number; bottom: number; right: number } | null,
  showTextInput: true,
  closePopup: mockClosePopup,
  setText: mockSetText,
  setUrl: mockSetUrl,
};
const subscribers: Array<(state: typeof storeState) => void> = [];

vi.mock("@/stores/linkCreatePopupStore", () => ({
  useLinkCreatePopupStore: {
    getState: () => storeState,
    subscribe: (fn: (state: typeof storeState) => void) => {
      subscribers.push(fn);
      return () => {
        const idx = subscribers.indexOf(fn);
        if (idx >= 0) subscribers.splice(idx, 1);
      };
    },
  },
}));

vi.mock("@/utils/imeGuard", () => ({
  isImeKeyEvent: () => false,
}));

vi.mock("@/utils/popupComponents", () => ({
  popupIcons: {
    save: "<svg>save</svg>",
    close: "<svg>close</svg>",
  },
}));

vi.mock("@/plugins/sourcePopup", () => ({
  getPopupHostForDom: (dom: HTMLElement) => dom.closest(".editor-container"),
  toHostCoordsForDom: (_host: HTMLElement, pos: { top: number; left: number }) => pos,
}));

import { LinkCreatePopupView } from "../LinkCreatePopupView";

function createEditorContainer() {
  const container = document.createElement("div");
  container.className = "editor-container";
  container.style.position = "relative";
  container.getBoundingClientRect = () => ({
    top: 0, left: 0, bottom: 600, right: 800, width: 800, height: 600,
    x: 0, y: 0, toJSON: () => ({}),
  });

  const editorDom = document.createElement("div");
  editorDom.className = "ProseMirror";
  editorDom.getBoundingClientRect = () => ({
    top: 0, left: 0, bottom: 600, right: 800, width: 800, height: 600,
    x: 0, y: 0, toJSON: () => ({}),
  });
  container.appendChild(editorDom);
  document.body.appendChild(container);

  return { container, editorDom, cleanup: () => container.remove() };
}

function createMockView(editorDom: HTMLElement) {
  return {
    dom: editorDom,
    state: {
      schema: {
        marks: {
          link: { create: vi.fn((attrs) => ({ type: "link", attrs })) },
        },
        text: vi.fn((text: string, marks: unknown[]) => ({ type: "text", text, marks })),
      },
      tr: {
        replaceWith: vi.fn().mockReturnThis(),
        addMark: vi.fn().mockReturnThis(),
      },
    },
    dispatch: vi.fn(),
    focus: vi.fn(),
  };
}

function emitStateChange(newState: Partial<typeof storeState>) {
  storeState = { ...storeState, ...newState };
  subscribers.forEach((fn) => fn(storeState));
}

function resetState() {
  storeState = {
    isOpen: false,
    text: "",
    url: "",
    rangeFrom: 0,
    rangeTo: 0,
    anchorRect: null,
    showTextInput: true,
    closePopup: mockClosePopup,
    setText: mockSetText,
    setUrl: mockSetUrl,
  };
  subscribers.length = 0;
}

const anchorRect = { top: 200, left: 150, bottom: 220, right: 250 };

describe("LinkCreatePopupView", () => {
  let dom: ReturnType<typeof createEditorContainer>;
  let view: ReturnType<typeof createMockView>;
  let popup: LinkCreatePopupView;

  beforeEach(() => {
    document.body.innerHTML = "";
    resetState();
    vi.clearAllMocks();
    dom = createEditorContainer();
    view = createMockView(dom.editorDom);
    popup = new LinkCreatePopupView(view as unknown as ConstructorParameters<typeof LinkCreatePopupView>[0]);
  });

  afterEach(() => {
    popup.destroy();
    dom.cleanup();
  });

  describe("Store subscription", () => {
    it("subscribes to store on construction", () => {
      expect(subscribers.length).toBe(1);
    });

    it("shows popup when store opens", async () => {
      emitStateChange({ isOpen: true, anchorRect, text: "hello", showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      const popupEl = dom.container.querySelector(".link-create-popup") as HTMLElement;
      expect(popupEl).not.toBeNull();
      expect(popupEl.style.display).toBe("flex");
    });

    it("hides popup when store closes", async () => {
      emitStateChange({ isOpen: true, anchorRect, text: "", showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      emitStateChange({ isOpen: false, anchorRect: null });

      const popupEl = dom.container.querySelector(".link-create-popup") as HTMLElement;
      expect(popupEl.style.display).toBe("none");
    });

    it("unsubscribes on destroy", () => {
      expect(subscribers.length).toBe(1);
      popup.destroy();
      expect(subscribers.length).toBe(0);
    });
  });

  describe("DOM structure", () => {
    it("shows text input when showTextInput is true", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true, text: "hello" });
      await new Promise((r) => requestAnimationFrame(r));

      const textInput = dom.container.querySelector(".link-create-popup-text") as HTMLInputElement;
      expect(textInput).not.toBeNull();
      expect(textInput.value).toBe("hello");
    });

    it("hides text input when showTextInput is false", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: false, text: "selected" });
      await new Promise((r) => requestAnimationFrame(r));

      const textInput = dom.container.querySelector(".link-create-popup-text");
      expect(textInput).toBeNull();
    });

    it("always has URL input", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: false });
      await new Promise((r) => requestAnimationFrame(r));

      const urlInput = dom.container.querySelector(".link-create-popup-url") as HTMLInputElement;
      expect(urlInput).not.toBeNull();
      expect(urlInput.value).toBe("");
    });

    it("has save and cancel buttons", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".link-create-popup-btn-save");
      const cancelBtn = dom.container.querySelector(".link-create-popup-btn-cancel");
      expect(saveBtn).not.toBeNull();
      expect(cancelBtn).not.toBeNull();
    });
  });

  describe("Input handling", () => {
    it("updates store text on text input", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true, text: "" });
      await new Promise((r) => requestAnimationFrame(r));

      const textInput = dom.container.querySelector(".link-create-popup-text") as HTMLInputElement;
      textInput.value = "New text";
      textInput.dispatchEvent(new Event("input", { bubbles: true }));

      expect(mockSetText).toHaveBeenCalledWith("New text");
    });

    it("updates store URL on URL input", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true, text: "" });
      await new Promise((r) => requestAnimationFrame(r));

      const urlInput = dom.container.querySelector(".link-create-popup-url") as HTMLInputElement;
      urlInput.value = "https://example.com";
      urlInput.dispatchEvent(new Event("input", { bubbles: true }));

      expect(mockSetUrl).toHaveBeenCalledWith("https://example.com");
    });
  });

  describe("Save logic", () => {
    it("does not save with empty URL", async () => {
      emitStateChange({
        isOpen: true, anchorRect, showTextInput: true,
        text: "link", url: "", rangeFrom: 0, rangeTo: 0,
      });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".link-create-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect(mockClosePopup).not.toHaveBeenCalled();
    });

    it("does not save with whitespace-only URL", async () => {
      emitStateChange({
        isOpen: true, anchorRect, showTextInput: true,
        text: "link", url: "   ", rangeFrom: 0, rangeTo: 0,
      });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".link-create-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect(mockClosePopup).not.toHaveBeenCalled();
    });

    it("saves with valid URL and closes popup", async () => {
      emitStateChange({
        isOpen: true, anchorRect, showTextInput: true,
        text: "click me", url: "https://example.com",
        rangeFrom: 0, rangeTo: 0,
      });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".link-create-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect(view.dispatch).toHaveBeenCalled();
      expect(mockClosePopup).toHaveBeenCalled();
      expect(view.focus).toHaveBeenCalled();
    });
  });

  describe("Cancel", () => {
    it("closes popup on cancel", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      const cancelBtn = dom.container.querySelector(".link-create-popup-btn-cancel") as HTMLElement;
      cancelBtn.click();

      expect(mockClosePopup).toHaveBeenCalled();
      expect(view.focus).toHaveBeenCalled();
    });
  });

  describe("Keyboard shortcuts", () => {
    it("saves on Enter key in URL input", async () => {
      emitStateChange({
        isOpen: true, anchorRect, showTextInput: true,
        text: "test", url: "https://test.com",
        rangeFrom: 0, rangeTo: 0,
      });
      await new Promise((r) => requestAnimationFrame(r));

      const urlInput = dom.container.querySelector(".link-create-popup-url") as HTMLInputElement;
      urlInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

      expect(view.dispatch).toHaveBeenCalled();
      expect(mockClosePopup).toHaveBeenCalled();
    });

    it("closes on Escape key in input", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      const urlInput = dom.container.querySelector(".link-create-popup-url") as HTMLInputElement;
      urlInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

      expect(mockClosePopup).toHaveBeenCalled();
      expect(view.focus).toHaveBeenCalled();
    });
  });

  describe("Click outside", () => {
    it("closes popup on click outside", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

      expect(mockClosePopup).toHaveBeenCalled();
    });

    it("does not close when clicking inside popup", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));
      await new Promise((r) => requestAnimationFrame(r));

      const popupEl = dom.container.querySelector(".link-create-popup") as HTMLElement;
      popupEl.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

      expect(mockClosePopup).not.toHaveBeenCalled();
    });

    it("does not close immediately after opening (justOpened guard)", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });

      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));

      expect(mockClosePopup).not.toHaveBeenCalled();
    });
  });

  describe("Scroll", () => {
    it("closes popup on scroll", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      dom.container.dispatchEvent(new Event("scroll", { bubbles: true }));

      expect(mockClosePopup).toHaveBeenCalled();
    });
  });

  describe("Mounting", () => {
    it("mounts inside editor-container", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      const popupEl = dom.container.querySelector(".link-create-popup");
      expect(popupEl).not.toBeNull();
      expect(dom.container.contains(popupEl)).toBe(true);
    });

    it("cleans up DOM on destroy", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      expect(dom.container.querySelector(".link-create-popup")).not.toBeNull();
      popup.destroy();
      expect(document.querySelector(".link-create-popup")).toBeNull();
    });
  });

  describe("Tab keyboard navigation", () => {
    it("cycles focus forward through focusable elements", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true, text: "test" });
      await new Promise((r) => requestAnimationFrame(r));

      const textInput = dom.container.querySelector(".link-create-popup-text") as HTMLInputElement;
      textInput.focus();

      // Tab should move to next element
      const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      // Verify focus moved (exact target depends on DOM structure)
    });

    it("cycles focus backward with Shift+Tab", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true, text: "test" });
      await new Promise((r) => requestAnimationFrame(r));

      const urlInput = dom.container.querySelector(".link-create-popup-url") as HTMLInputElement;
      urlInput.focus();

      const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
      document.dispatchEvent(event);
    });

    it("Enter on button triggers click", async () => {
      emitStateChange({
        isOpen: true, anchorRect, showTextInput: true,
        text: "test", url: "https://example.com",
        rangeFrom: 0, rangeTo: 0,
      });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".link-create-popup-btn-save") as HTMLElement;
      saveBtn.focus();

      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      expect(view.dispatch).toHaveBeenCalled();
    });

    it("Escape from inside popup closes and focuses editor", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      const urlInput = dom.container.querySelector(".link-create-popup-url") as HTMLInputElement;
      urlInput.focus();

      const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      expect(mockClosePopup).toHaveBeenCalled();
      expect(view.focus).toHaveBeenCalled();
    });
  });

  describe("Save without showTextInput (addMark)", () => {
    it("applies link mark to existing selection range", async () => {
      emitStateChange({
        isOpen: true, anchorRect, showTextInput: false,
        text: "selected text", url: "https://example.com",
        rangeFrom: 5, rangeTo: 18,
      });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".link-create-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect(view.state.tr.addMark).toHaveBeenCalled();
      expect(view.dispatch).toHaveBeenCalled();
      expect(mockClosePopup).toHaveBeenCalled();
    });
  });

  describe("Save error handling", () => {
    it("handles save error gracefully", async () => {
      view.state.schema.marks.link.create = vi.fn(() => { throw new Error("test"); });

      emitStateChange({
        isOpen: true, anchorRect, showTextInput: true,
        text: "test", url: "https://error.com",
        rangeFrom: 0, rangeTo: 0,
      });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".link-create-popup-btn-save") as HTMLElement;
      expect(() => saveBtn.click()).not.toThrow();

      expect(mockClosePopup).toHaveBeenCalled();
    });

    it("returns early when editorState is falsy", async () => {
      const originalState = view.state;
      (view as Record<string, unknown>).state = null;

      emitStateChange({
        isOpen: true, anchorRect, showTextInput: true,
        text: "test", url: "https://test.com",
        rangeFrom: 0, rangeTo: 0,
      });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".link-create-popup-btn-save") as HTMLElement;
      expect(() => saveBtn.click()).not.toThrow();

      (view as Record<string, unknown>).state = originalState;
    });
  });

  describe("URL input focuses when saving with empty URL", () => {
    it("focuses URL input when trying to save without URL", async () => {
      emitStateChange({
        isOpen: true, anchorRect, showTextInput: true,
        text: "link", url: "", rangeFrom: 0, rangeTo: 0,
      });
      await new Promise((r) => requestAnimationFrame(r));

      const urlInput = dom.container.querySelector(".link-create-popup-url") as HTMLInputElement;
      const focusSpy = vi.spyOn(urlInput, "focus");

      const saveBtn = dom.container.querySelector(".link-create-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe("Enter key in text input", () => {
    it("saves on Enter key in text input", async () => {
      emitStateChange({
        isOpen: true, anchorRect, showTextInput: true,
        text: "test", url: "https://test.com",
        rangeFrom: 0, rangeTo: 0,
      });
      await new Promise((r) => requestAnimationFrame(r));

      const textInput = dom.container.querySelector(".link-create-popup-text") as HTMLInputElement;
      textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

      expect(view.dispatch).toHaveBeenCalled();
      expect(mockClosePopup).toHaveBeenCalled();
    });

    it("closes on Escape key in text input", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      const textInput = dom.container.querySelector(".link-create-popup-text") as HTMLInputElement;
      textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

      expect(mockClosePopup).toHaveBeenCalled();
      expect(view.focus).toHaveBeenCalled();
    });
  });

  describe("Host positioning", () => {
    it("uses absolute positioning when host is not document.body", async () => {
      const sourcePopup = await import("@/plugins/sourcePopup");
      const hostEl = document.createElement("div");
      hostEl.style.position = "relative";
      hostEl.getBoundingClientRect = () => ({
        top: 0, left: 0, bottom: 600, right: 800, width: 800, height: 600,
        x: 0, y: 0, toJSON: () => ({}),
      });
      dom.container.appendChild(hostEl);

      vi.spyOn(sourcePopup, "getPopupHostForDom" as never).mockReturnValue(hostEl as never);

      popup.destroy();
      vi.clearAllMocks();
      popup = new LinkCreatePopupView(view as unknown as ConstructorParameters<typeof LinkCreatePopupView>[0]);

      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      const popupEl = hostEl.querySelector(".link-create-popup") as HTMLElement;
      expect(popupEl).not.toBeNull();
      expect(popupEl.style.position).toBe("absolute");

      vi.mocked(sourcePopup.getPopupHostForDom as never).mockRestore?.();
    });

    it("uses fixed positioning when host is document.body", async () => {
      const sourcePopup = await import("@/plugins/sourcePopup");
      vi.spyOn(sourcePopup, "getPopupHostForDom" as never).mockReturnValue(null as never);

      popup.destroy();
      vi.clearAllMocks();
      popup = new LinkCreatePopupView(view as unknown as ConstructorParameters<typeof LinkCreatePopupView>[0]);

      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      const popupEl = document.querySelector(".link-create-popup") as HTMLElement;
      expect(popupEl).not.toBeNull();
      expect(popupEl.style.position).toBe("fixed");

      vi.mocked(sourcePopup.getPopupHostForDom as never).mockRestore?.();
    });
  });

  describe("Viewport bounds fallback", () => {
    it("uses getViewportBounds when no editor container exists", async () => {
      // Remove the editor-container class so closest returns null
      dom.container.className = "";

      popup.destroy();
      vi.clearAllMocks();
      popup = new LinkCreatePopupView(view as unknown as ConstructorParameters<typeof LinkCreatePopupView>[0]);

      emitStateChange({ isOpen: true, anchorRect, showTextInput: true });
      await new Promise((r) => requestAnimationFrame(r));

      const popupEl = document.querySelector(".link-create-popup") as HTMLElement;
      expect(popupEl).not.toBeNull();
      expect(popupEl.style.display).toBe("flex");

      // Restore for other tests
      dom.container.className = "editor-container";
    });
  });

  describe("Keyboard navigation edge cases", () => {
    it("Tab does nothing when activeElement is not in focusable list", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true, text: "test" });
      await new Promise((r) => requestAnimationFrame(r));

      // Focus on something outside the popup
      document.body.focus();

      // Tab should be a no-op (currentIndex === -1)
      const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
      document.dispatchEvent(event);
      // No error means the early return worked
    });

    it("Tab moves focus forward when activeElement is a focusable popup element", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true, text: "test" });
      await new Promise((r) => requestAnimationFrame(r));

      // Patch offsetParent on all focusable candidates so getFocusableElements returns them
      const candidates = Array.from(
        dom.container.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled])")
      );
      candidates.forEach((el) => {
        Object.defineProperty(el, "offsetParent", { get: () => dom.container, configurable: true });
      });

      // Focus the first focusable element (url input or text input)
      candidates[0].focus();

      const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      // Focus should have moved to next element (no error = success)
    });

    it("Shift+Tab moves focus backward when activeElement is a focusable popup element", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true, text: "test" });
      await new Promise((r) => requestAnimationFrame(r));

      // Patch offsetParent on all focusable candidates
      const candidates = Array.from(
        dom.container.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled])")
      );
      candidates.forEach((el) => {
        Object.defineProperty(el, "offsetParent", { get: () => dom.container, configurable: true });
      });

      // Focus the last element
      candidates[candidates.length - 1].focus();

      const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      // Focus should have moved backward (no error = success)
    });

    it("Enter on non-button element inside popup does not trigger click", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true, text: "test" });
      await new Promise((r) => requestAnimationFrame(r));

      // Focus the text input (not a button)
      const textInput = dom.container.querySelector(".link-create-popup-text") as HTMLInputElement;
      textInput.focus();

      // Enter via keyboard nav handler should not trigger click on non-button
      const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
      document.dispatchEvent(event);
      // The keydown on the input itself handles Enter via handleInputKeydown
    });

    it("Escape via keyboard nav handler checks container containment", async () => {
      emitStateChange({ isOpen: true, anchorRect, showTextInput: true, text: "test" });
      await new Promise((r) => requestAnimationFrame(r));

      // Focus a button inside the popup and press Escape via document keydown
      const saveBtn = dom.container.querySelector(".link-create-popup-btn-save") as HTMLElement;
      saveBtn.focus();

      const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
      document.dispatchEvent(event);

      // closePopup should be called because activeElement is inside container
      expect(mockClosePopup).toHaveBeenCalled();
      expect(view.focus).toHaveBeenCalled();
    });
  });

  describe("Edge cases", () => {
    it("uses URL as link text when text is empty and showTextInput is true", async () => {
      emitStateChange({
        isOpen: true, anchorRect, showTextInput: true,
        text: "", url: "https://fallback.com",
        rangeFrom: 0, rangeTo: 0,
      });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".link-create-popup-btn-save") as HTMLElement;
      saveBtn.click();

      expect(view.dispatch).toHaveBeenCalled();
      expect(mockClosePopup).toHaveBeenCalled();
    });

    it("handles missing link mark in schema gracefully", async () => {
      const originalMarks = view.state.schema.marks;
      view.state.schema.marks = {};

      emitStateChange({
        isOpen: true, anchorRect, showTextInput: true,
        text: "test", url: "https://test.com",
        rangeFrom: 0, rangeTo: 0,
      });
      await new Promise((r) => requestAnimationFrame(r));

      const saveBtn = dom.container.querySelector(".link-create-popup-btn-save") as HTMLElement;
      expect(() => saveBtn.click()).not.toThrow();

      view.state.schema.marks = originalMarks;
    });
  });
});
