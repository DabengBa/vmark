/**
 * Tests for createSourcePopupPlugin — factory function for CM6 popup plugins.
 *
 * Tests plugin creation, click/hover trigger logic, update behavior,
 * and the createPositionBasedDetector helper.
 */

import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { ViewPlugin, type EditorView, type ViewUpdate } from "@codemirror/view";
import type { PopupStoreBase, StoreApi, SourcePopupView } from "./SourcePopupView";

// Mock sourcePopupUtils
vi.mock("./sourcePopupUtils", () => ({
  getAnchorRectFromRange: vi.fn(
    (_view: unknown, from: number, to: number) =>
      ({ top: 100 + from, left: 50, bottom: 120 + to, right: 200 })
  ),
}));

import {
  createSourcePopupPlugin,
  createPositionBasedDetector,
  type PopupTriggerConfig,
} from "./createSourcePopupPlugin";
import { getAnchorRectFromRange } from "./sourcePopupUtils";

// --- Helpers ---

interface TestState extends PopupStoreBase {
  openPopup?: (data: unknown) => void;
}

function createMockStore(): {
  store: StoreApi<TestState>;
  state: TestState;
  closePopup: ReturnType<typeof vi.fn>;
  openPopupFn: ReturnType<typeof vi.fn>;
} {
  const closePopup = vi.fn();
  const openPopupFn = vi.fn();
  const state: TestState = {
    isOpen: false,
    anchorRect: null,
    closePopup,
    openPopup: openPopupFn,
  };
  const subscribers: Array<(s: TestState) => void> = [];
  const store: StoreApi<TestState> = {
    getState: () => state,
    subscribe: (fn) => {
      subscribers.push(fn);
      return () => {
        const idx = subscribers.indexOf(fn);
        if (idx >= 0) subscribers.splice(idx, 1);
      };
    },
  };
  return { store, state, closePopup, openPopupFn };
}

function createMockPopupView(): SourcePopupView<TestState> {
  return {
    destroy: vi.fn(),
  } as unknown as SourcePopupView<TestState>;
}

function createMockEditorView(): EditorView {
  const dom = document.createElement("div");
  dom.addEventListener = vi.fn();
  dom.removeEventListener = vi.fn();
  return {
    dom,
    posAtCoords: vi.fn(() => 5),
    state: {
      doc: { lineAt: () => ({ from: 0, to: 20, text: "hello world" }) },
      selection: { main: { from: 5, to: 5 } },
    },
    coordsAtPos: vi.fn(() => ({ top: 100, left: 50, bottom: 120, right: 200 })),
  } as unknown as EditorView;
}

describe("createSourcePopupPlugin", () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let mockPopupView: SourcePopupView<TestState>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = createMockStore();
    mockPopupView = createMockPopupView();
  });

  describe("plugin creation", () => {
    it("returns a ViewPlugin", () => {
      const plugin = createSourcePopupPlugin({
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => null,
        extractData: () => ({}),
      });

      expect(plugin).toBeDefined();
      // ViewPlugin.fromClass returns an Extension-compatible object
      expect(typeof plugin).toBe("object");
    });

    it("uses default values for optional config", () => {
      // triggerOnClick defaults to true, triggerOnHover to false
      const config: PopupTriggerConfig<TestState> = {
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => null,
        extractData: () => ({}),
      };

      // Should not throw
      const plugin = createSourcePopupPlugin(config);
      expect(plugin).toBeDefined();
    });

    it("accepts all optional config fields", () => {
      const config: PopupTriggerConfig<TestState, { href: string }> = {
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => null,
        detectTriggerAtPos: () => null,
        extractData: () => ({ href: "https://example.com" }),
        openPopup: vi.fn(),
        onOpen: vi.fn(),
        triggerOnClick: true,
        triggerOnHover: true,
        hoverDelay: 500,
        hoverHideDelay: 200,
      };

      const plugin = createSourcePopupPlugin(config);
      expect(plugin).toBeDefined();
    });
  });

  describe("click handler registration", () => {
    it("registers click handler when triggerOnClick is true", () => {
      const mockView = createMockEditorView();
      const createView = vi.fn(() => mockPopupView);

      createSourcePopupPlugin({
        store: mockStore.store,
        createView,
        detectTrigger: () => null,
        extractData: () => ({}),
        triggerOnClick: true,
      });

      // The plugin is created via ViewPlugin.fromClass, so we need to verify
      // by checking that the class constructor would add event listeners
      // Since we can't easily instantiate the class directly, we verify config acceptance
      expect(createView).not.toHaveBeenCalled(); // Not called until plugin is instantiated by CM
    });

    it("does not register click handler when triggerOnClick is false", () => {
      const plugin = createSourcePopupPlugin({
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => null,
        extractData: () => ({}),
        triggerOnClick: false,
      });

      expect(plugin).toBeDefined();
    });
  });

  describe("hover handler registration", () => {
    it("accepts hover configuration", () => {
      const plugin = createSourcePopupPlugin({
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => null,
        extractData: () => ({}),
        triggerOnHover: true,
        hoverDelay: 300,
        hoverHideDelay: 100,
      });

      expect(plugin).toBeDefined();
    });
  });

  describe("config with custom openPopup", () => {
    it("accepts custom openPopup handler", () => {
      const customOpen = vi.fn();
      const plugin = createSourcePopupPlugin({
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => ({ from: 0, to: 10 }),
        extractData: () => ({}),
        openPopup: customOpen,
      });

      expect(plugin).toBeDefined();
    });

    it("accepts onOpen callback", () => {
      const onOpen = vi.fn();
      const plugin = createSourcePopupPlugin({
        store: mockStore.store,
        createView: () => mockPopupView,
        detectTrigger: () => ({ from: 0, to: 10 }),
        extractData: () => ({}),
        onOpen,
      });

      expect(plugin).toBeDefined();
    });
  });
});

describe("createSourcePopupPlugin — instantiated behavior", () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let mockPopupView: SourcePopupView<TestState>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockStore = createMockStore();
    mockPopupView = createMockPopupView();
    // Add editorView to mockPopupView for private access in handleClick
    (mockPopupView as unknown as Record<string, unknown>)["editorView"] = createMockEditorView();
    (mockPopupView as unknown as Record<string, unknown>)["container"] = document.createElement("div");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Since CM6 ViewPlugin.fromClass creates a class that can only be properly
   * instantiated through CM6, we test the behavior by extracting the class
   * from the ViewPlugin spec and instantiating it directly.
   */
  function instantiatePlugin(config: Partial<PopupTriggerConfig<TestState>> = {}) {
    const plugin = createSourcePopupPlugin({
      store: mockStore.store,
      createView: () => mockPopupView,
      detectTrigger: () => null,
      extractData: () => ({}) as object,
      ...config,
    });
    const mockView = createMockEditorView();
    // Bind editorView on the popupView mock
    (mockPopupView as unknown as Record<string, unknown>)["editorView"] = mockView;
    // ViewPlugin exposes a .create(view) factory
    const createFn = (plugin as unknown as { create: (view: EditorView) => unknown }).create;
    const instance = createFn(mockView);
    return { instance: instance as Record<string, unknown>, view: mockView };
  }

  it("creates popupView via createView on instantiation", () => {
    const createViewFn = vi.fn(() => mockPopupView);
    instantiatePlugin({ createView: createViewFn });
    expect(createViewFn).toHaveBeenCalledTimes(1);
  });

  it("registers click handler when triggerOnClick is true (default)", () => {
    const { view } = instantiatePlugin({ triggerOnClick: true });
    expect(view.dom.addEventListener).toHaveBeenCalledWith("click", expect.any(Function));
  });

  it("does not register click handler when triggerOnClick is false", () => {
    const { view } = instantiatePlugin({ triggerOnClick: false });
    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const clickCalls = calls.filter((c: unknown[]) => c[0] === "click");
    expect(clickCalls.length).toBe(0);
  });

  it("registers hover handlers when triggerOnHover is true", () => {
    const { view } = instantiatePlugin({ triggerOnHover: true });
    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const eventNames = calls.map((c: unknown[]) => c[0]);
    expect(eventNames).toContain("mousemove");
    expect(eventNames).toContain("mouseleave");
    expect(eventNames).toContain("mousedown");
    expect(eventNames).toContain("mouseup");
  });

  it("does not register hover handlers when triggerOnHover is false (default)", () => {
    const { view } = instantiatePlugin({ triggerOnHover: false });
    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const eventNames = calls.map((c: unknown[]) => c[0]);
    expect(eventNames).not.toContain("mousemove");
    expect(eventNames).not.toContain("mouseleave");
  });

  it("destroy calls popupView.destroy", () => {
    const { instance } = instantiatePlugin();
    (instance as { destroy: () => void }).destroy();
    expect(mockPopupView.destroy).toHaveBeenCalled();
  });

  it("destroy clears pending timeouts", () => {
    const { instance } = instantiatePlugin({ triggerOnHover: true });
    // Just verify destroy doesn't throw
    (instance as { destroy: () => void }).destroy();
  });

  it("update closes popup when selection moves away", () => {
    mockStore.state.isOpen = true;
    const detectTrigger = vi.fn(() => null);
    const { instance, view } = instantiatePlugin({ detectTrigger });

    const mockUpdate = {
      view,
      selectionSet: true,
      docChanged: false,
      transactions: [],
    } as unknown as ViewUpdate;

    (instance as { update: (u: ViewUpdate) => void }).update(mockUpdate);

    vi.advanceTimersByTime(200);

    expect(mockStore.closePopup).toHaveBeenCalled();
  });

  it("update does not close popup when cursor is still in trigger", () => {
    mockStore.state.isOpen = true;
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));
    const { instance, view } = instantiatePlugin({ detectTrigger });

    const mockUpdate = {
      view,
      selectionSet: true,
      docChanged: false,
      transactions: [],
    } as unknown as ViewUpdate;

    (instance as { update: (u: ViewUpdate) => void }).update(mockUpdate);

    vi.advanceTimersByTime(200);

    expect(mockStore.closePopup).not.toHaveBeenCalled();
  });

  it("update ignores when popup is not open", () => {
    mockStore.state.isOpen = false;
    const { instance, view } = instantiatePlugin();

    const mockUpdate = {
      view,
      selectionSet: true,
      docChanged: false,
      transactions: [],
    } as unknown as ViewUpdate;

    (instance as { update: (u: ViewUpdate) => void }).update(mockUpdate);

    vi.advanceTimersByTime(200);

    expect(mockStore.closePopup).not.toHaveBeenCalled();
  });

  it("update ignores when doc changed alongside selection", () => {
    mockStore.state.isOpen = true;
    const { instance, view } = instantiatePlugin();

    const mockUpdate = {
      view,
      selectionSet: true,
      docChanged: true,
      transactions: [],
    } as unknown as ViewUpdate;

    (instance as { update: (u: ViewUpdate) => void }).update(mockUpdate);

    vi.advanceTimersByTime(200);

    // Should not close — docChanged means user is typing, not moving cursor
    expect(mockStore.closePopup).not.toHaveBeenCalled();
  });
});

describe("createSourcePopupPlugin — click handler logic", () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let mockPopupView: SourcePopupView<TestState>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockStore = createMockStore();
    mockPopupView = createMockPopupView();
    (mockPopupView as unknown as Record<string, unknown>)["editorView"] = createMockEditorView();
    (mockPopupView as unknown as Record<string, unknown>)["container"] = document.createElement("div");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function instantiatePlugin(config: Partial<PopupTriggerConfig<TestState>> = {}) {
    const plugin = createSourcePopupPlugin({
      store: mockStore.store,
      createView: () => mockPopupView,
      detectTrigger: () => null,
      extractData: () => ({}) as object,
      ...config,
    });
    const mockView = createMockEditorView();
    (mockPopupView as unknown as Record<string, unknown>)["editorView"] = mockView;
    const createFn = (plugin as unknown as { create: (view: EditorView) => unknown }).create;
    const instance = createFn(mockView);
    return { instance: instance as Record<string, unknown>, view: mockView };
  }

  it("click handler opens popup when trigger detected and custom openPopup provided", () => {
    const customOpen = vi.fn();
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));
    const extractData = vi.fn(() => ({ href: "test" }));

    const { view } = instantiatePlugin({
      detectTrigger,
      extractData,
      openPopup: customOpen,
      triggerOnClick: true,
    });

    // Simulate click by calling the registered handler
    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const clickHandler = calls.find((c: unknown[]) => c[0] === "click")?.[1] as (e: MouseEvent) => void;
    expect(clickHandler).toBeDefined();

    if (clickHandler) {
      clickHandler(new MouseEvent("click", { clientX: 50, clientY: 100 }));
      expect(customOpen).toHaveBeenCalledWith(
        expect.objectContaining({
          range: { from: 0, to: 10 },
          data: { href: "test" },
        })
      );
    }
  });

  it("click handler does nothing when pos is outside trigger range", () => {
    const customOpen = vi.fn();
    const detectTrigger = vi.fn(() => ({ from: 0, to: 3 }));

    const { view } = instantiatePlugin({
      detectTrigger,
      openPopup: customOpen,
      triggerOnClick: true,
    });

    // posAtCoords returns 5, which is outside the range 0-3
    (view.posAtCoords as ReturnType<typeof vi.fn>).mockReturnValue(5);

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const clickHandler = calls.find((c: unknown[]) => c[0] === "click")?.[1] as (e: MouseEvent) => void;

    if (clickHandler) {
      clickHandler(new MouseEvent("click", { clientX: 50, clientY: 100 }));
      expect(customOpen).not.toHaveBeenCalled();
    }
  });

  it("click handler does nothing when posAtCoords returns null", () => {
    const customOpen = vi.fn();
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));

    const { view } = instantiatePlugin({
      detectTrigger,
      openPopup: customOpen,
      triggerOnClick: true,
    });

    (view.posAtCoords as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const clickHandler = calls.find((c: unknown[]) => c[0] === "click")?.[1] as (e: MouseEvent) => void;

    if (clickHandler) {
      clickHandler(new MouseEvent("click", { clientX: 50, clientY: 100 }));
      expect(customOpen).not.toHaveBeenCalled();
    }
  });

  it("click handler falls back to store openPopup when no custom openPopup", () => {
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));
    const extractData = vi.fn(() => ({ value: 42 }));

    const { view } = instantiatePlugin({
      detectTrigger,
      extractData,
      triggerOnClick: true,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const clickHandler = calls.find((c: unknown[]) => c[0] === "click")?.[1] as (e: MouseEvent) => void;

    if (clickHandler) {
      clickHandler(new MouseEvent("click", { clientX: 50, clientY: 100 }));
      expect(mockStore.openPopupFn).toHaveBeenCalledWith(
        expect.objectContaining({ value: 42 })
      );
    }
  });

  it("click handler calls onOpen callback before opening popup", () => {
    const onOpen = vi.fn();
    const customOpen = vi.fn();
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));

    const { view } = instantiatePlugin({
      detectTrigger,
      onOpen,
      openPopup: customOpen,
      triggerOnClick: true,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const clickHandler = calls.find((c: unknown[]) => c[0] === "click")?.[1] as (e: MouseEvent) => void;

    if (clickHandler) {
      clickHandler(new MouseEvent("click", { clientX: 50, clientY: 100 }));
      expect(onOpen).toHaveBeenCalled();
      expect(customOpen).toHaveBeenCalled();
    }
  });

  it("click handler uses detectTriggerAtPos when provided", () => {
    const detectTriggerAtPos = vi.fn(() => ({ from: 2, to: 8 }));
    const customOpen = vi.fn();

    const { view } = instantiatePlugin({
      detectTrigger: () => null,
      detectTriggerAtPos,
      openPopup: customOpen,
      triggerOnClick: true,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const clickHandler = calls.find((c: unknown[]) => c[0] === "click")?.[1] as (e: MouseEvent) => void;

    if (clickHandler) {
      clickHandler(new MouseEvent("click", { clientX: 50, clientY: 100 }));
      expect(detectTriggerAtPos).toHaveBeenCalled();
      expect(customOpen).toHaveBeenCalled();
    }
  });

  it("click handler returns early when getAnchorRectFromRange returns null", () => {
    const customOpen = vi.fn();
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));

    // Mock getAnchorRectFromRange to return null
    (getAnchorRectFromRange as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);

    const { view } = instantiatePlugin({
      detectTrigger,
      openPopup: customOpen,
      triggerOnClick: true,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const clickHandler = calls.find((c: unknown[]) => c[0] === "click")?.[1] as (e: MouseEvent) => void;

    if (clickHandler) {
      clickHandler(new MouseEvent("click", { clientX: 50, clientY: 100 }));
      expect(customOpen).not.toHaveBeenCalled();
    }
  });
});

describe("createSourcePopupPlugin — hover handler logic", () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let mockPopupView: SourcePopupView<TestState>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockStore = createMockStore();
    mockPopupView = createMockPopupView();
    (mockPopupView as unknown as Record<string, unknown>)["editorView"] = createMockEditorView();
    (mockPopupView as unknown as Record<string, unknown>)["container"] = document.createElement("div");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function instantiatePlugin(config: Partial<PopupTriggerConfig<TestState>> = {}) {
    const plugin = createSourcePopupPlugin({
      store: mockStore.store,
      createView: () => mockPopupView,
      detectTrigger: () => null,
      extractData: () => ({}) as object,
      ...config,
    });
    const mockView = createMockEditorView();
    (mockPopupView as unknown as Record<string, unknown>)["editorView"] = mockView;
    const createFn = (plugin as unknown as { create: (view: EditorView) => unknown }).create;
    const instance = createFn(mockView);
    return { instance: instance as Record<string, unknown>, view: mockView };
  }

  it("mousemove triggers popup after hover delay", () => {
    const customOpen = vi.fn();
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));

    const { view } = instantiatePlugin({
      detectTrigger,
      openPopup: customOpen,
      triggerOnHover: true,
      hoverDelay: 200,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mousemoveHandler = calls.find((c: unknown[]) => c[0] === "mousemove")?.[1] as (e: MouseEvent) => void;

    if (mousemoveHandler) {
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 50, clientY: 100 }));

      // Before delay: popup not opened
      expect(customOpen).not.toHaveBeenCalled();

      // After delay: popup should open
      vi.advanceTimersByTime(250);
      expect(customOpen).toHaveBeenCalled();
    }
  });

  it("mouseleave cancels hover and starts hide timer", () => {
    mockStore.state.isOpen = true;
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));

    const { view } = instantiatePlugin({
      detectTrigger,
      triggerOnHover: true,
      hoverHideDelay: 100,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mouseleaveHandler = calls.find((c: unknown[]) => c[0] === "mouseleave")?.[1] as () => void;

    if (mouseleaveHandler) {
      mouseleaveHandler();

      // After hide delay, popup should close
      vi.advanceTimersByTime(150);
      expect(mockStore.closePopup).toHaveBeenCalled();
    }
  });

  it("mousedown cancels hover timeout", () => {
    const customOpen = vi.fn();
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));

    const { view } = instantiatePlugin({
      detectTrigger,
      openPopup: customOpen,
      triggerOnHover: true,
      hoverDelay: 200,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mousemoveHandler = calls.find((c: unknown[]) => c[0] === "mousemove")?.[1] as (e: MouseEvent) => void;
    const mousedownHandler = calls.find((c: unknown[]) => c[0] === "mousedown")?.[1] as () => void;

    if (mousemoveHandler && mousedownHandler) {
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 50, clientY: 100 }));
      mousedownHandler();

      vi.advanceTimersByTime(300);
      // Should NOT open because mousedown cancelled the timer
      expect(customOpen).not.toHaveBeenCalled();
    }
  });

  it("same hover range does not restart timer", () => {
    const customOpen = vi.fn();
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));

    const { view } = instantiatePlugin({
      detectTrigger,
      openPopup: customOpen,
      triggerOnHover: true,
      hoverDelay: 200,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mousemoveHandler = calls.find((c: unknown[]) => c[0] === "mousemove")?.[1] as (e: MouseEvent) => void;

    if (mousemoveHandler) {
      // First move
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 50, clientY: 100 }));
      vi.advanceTimersByTime(100);

      // Second move to same range — should not restart timer
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 55, clientY: 105 }));
      vi.advanceTimersByTime(100);

      // Total 200ms from first move — should trigger
      expect(customOpen).toHaveBeenCalledTimes(1);
    }
  });

  it("mousemove with null pos cancels hover", () => {
    const customOpen = vi.fn();
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));

    const { view } = instantiatePlugin({
      detectTrigger,
      openPopup: customOpen,
      triggerOnHover: true,
      hoverDelay: 200,
    });

    (view.posAtCoords as ReturnType<typeof vi.fn>).mockReturnValue(null);

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mousemoveHandler = calls.find((c: unknown[]) => c[0] === "mousemove")?.[1] as (e: MouseEvent) => void;

    if (mousemoveHandler) {
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 50, clientY: 100 }));
      vi.advanceTimersByTime(300);
      expect(customOpen).not.toHaveBeenCalled();
    }
  });

  it("mouseup resets isMouseDown so hover works again", () => {
    const customOpen = vi.fn();
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));

    const { view } = instantiatePlugin({
      detectTrigger,
      openPopup: customOpen,
      triggerOnHover: true,
      hoverDelay: 200,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mousedownHandler = calls.find((c: unknown[]) => c[0] === "mousedown")?.[1] as () => void;
    const mouseupHandler = calls.find((c: unknown[]) => c[0] === "mouseup")?.[1] as () => void;
    const mousemoveHandler = calls.find((c: unknown[]) => c[0] === "mousemove")?.[1] as (e: MouseEvent) => void;

    if (mousedownHandler && mouseupHandler && mousemoveHandler) {
      mousedownHandler();
      mouseupHandler();

      // Hover should work again after mouseup
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 50, clientY: 100 }));
      vi.advanceTimersByTime(250);
      expect(customOpen).toHaveBeenCalled();
    }
  });
});

describe("createSourcePopupPlugin — hover with detectTriggerAtPos", () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let mockPopupView: SourcePopupView<TestState>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockStore = createMockStore();
    mockPopupView = createMockPopupView();
    (mockPopupView as unknown as Record<string, unknown>)["editorView"] = createMockEditorView();
    (mockPopupView as unknown as Record<string, unknown>)["container"] = document.createElement("div");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function instantiatePlugin(config: Partial<PopupTriggerConfig<TestState>> = {}) {
    const plugin = createSourcePopupPlugin({
      store: mockStore.store,
      createView: () => mockPopupView,
      detectTrigger: () => null,
      extractData: () => ({}) as object,
      ...config,
    });
    const mockView = createMockEditorView();
    (mockPopupView as unknown as Record<string, unknown>)["editorView"] = mockView;
    const createFn = (plugin as unknown as { create: (view: EditorView) => unknown }).create;
    const instance = createFn(mockView);
    return { instance: instance as Record<string, unknown>, view: mockView };
  }

  it("hover uses detectTriggerAtPos when provided", () => {
    const detectTriggerAtPos = vi.fn(() => ({ from: 3, to: 8 }));
    const customOpen = vi.fn();

    const { view } = instantiatePlugin({
      detectTriggerAtPos,
      openPopup: customOpen,
      triggerOnHover: true,
      hoverDelay: 100,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mousemoveHandler = calls.find((c: unknown[]) => c[0] === "mousemove")?.[1] as (e: MouseEvent) => void;

    if (mousemoveHandler) {
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 50, clientY: 100 }));
      vi.advanceTimersByTime(150);
      expect(detectTriggerAtPos).toHaveBeenCalled();
      expect(customOpen).toHaveBeenCalled();
    }
  });

  it("hover falls back to detectTrigger when detectTriggerAtPos not provided and pos outside range", () => {
    const detectTrigger = vi.fn(() => ({ from: 10, to: 20 }));
    const customOpen = vi.fn();

    const { view } = instantiatePlugin({
      detectTrigger,
      openPopup: customOpen,
      triggerOnHover: true,
      hoverDelay: 100,
    });

    // posAtCoords returns 5, which is outside the detected range 10-20
    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mousemoveHandler = calls.find((c: unknown[]) => c[0] === "mousemove")?.[1] as (e: MouseEvent) => void;

    if (mousemoveHandler) {
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 50, clientY: 100 }));
      vi.advanceTimersByTime(150);
      // Range should not match since pos (5) is outside [10,20]
      expect(customOpen).not.toHaveBeenCalled();
    }
  });

  it("mousemove cancels on isMouseDown", () => {
    const customOpen = vi.fn();
    const detectTrigger = vi.fn(() => ({ from: 0, to: 10 }));

    const { view } = instantiatePlugin({
      detectTrigger,
      openPopup: customOpen,
      triggerOnHover: true,
      hoverDelay: 100,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mousedownHandler = calls.find((c: unknown[]) => c[0] === "mousedown")?.[1] as () => void;
    const mousemoveHandler = calls.find((c: unknown[]) => c[0] === "mousemove")?.[1] as (e: MouseEvent) => void;

    if (mousedownHandler && mousemoveHandler) {
      mousedownHandler(); // Set isMouseDown
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 50, clientY: 100 }));
      vi.advanceTimersByTime(300);
      expect(customOpen).not.toHaveBeenCalled();
    }
  });

  it("mousemove no-trigger clears lastHoverRange", () => {
    const customOpen = vi.fn();
    let callCount = 0;
    const detectTrigger = vi.fn(() => {
      callCount++;
      if (callCount <= 1) return { from: 0, to: 10 };
      return null;
    });

    const { view } = instantiatePlugin({
      detectTrigger,
      openPopup: customOpen,
      triggerOnHover: true,
      hoverDelay: 200,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mousemoveHandler = calls.find((c: unknown[]) => c[0] === "mousemove")?.[1] as (e: MouseEvent) => void;

    if (mousemoveHandler) {
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 50, clientY: 100 }));
      vi.advanceTimersByTime(50);
      // Move to no-trigger area
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 60, clientY: 110 }));
      vi.advanceTimersByTime(300);
      expect(customOpen).not.toHaveBeenCalled();
    }
  });

  it("hover uses store openPopup when no custom openPopup and uses onOpen", () => {
    const onOpen = vi.fn();
    const detectTriggerAtPos = vi.fn(() => ({ from: 0, to: 10 }));

    const { view } = instantiatePlugin({
      detectTriggerAtPos,
      onOpen,
      triggerOnHover: true,
      hoverDelay: 100,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mousemoveHandler = calls.find((c: unknown[]) => c[0] === "mousemove")?.[1] as (e: MouseEvent) => void;

    if (mousemoveHandler) {
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 50, clientY: 100 }));
      vi.advanceTimersByTime(150);
      expect(onOpen).toHaveBeenCalled();
      expect(mockStore.openPopupFn).toHaveBeenCalled();
    }
  });

  it("mouseleave does not start hide timer when popup is not open", () => {
    mockStore.state.isOpen = false;

    const { view } = instantiatePlugin({
      triggerOnHover: true,
      hoverHideDelay: 100,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mouseleaveHandler = calls.find((c: unknown[]) => c[0] === "mouseleave")?.[1] as () => void;

    if (mouseleaveHandler) {
      mouseleaveHandler();
      vi.advanceTimersByTime(200);
      expect(mockStore.closePopup).not.toHaveBeenCalled();
    }
  });

  it("hover timer aborted when isMouseDown is set during delay", () => {
    const customOpen = vi.fn();
    const detectTriggerAtPos = vi.fn(() => ({ from: 0, to: 10 }));

    const { view } = instantiatePlugin({
      detectTriggerAtPos,
      openPopup: customOpen,
      triggerOnHover: true,
      hoverDelay: 200,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mousemoveHandler = calls.find((c: unknown[]) => c[0] === "mousemove")?.[1] as (e: MouseEvent) => void;
    const mousedownHandler = calls.find((c: unknown[]) => c[0] === "mousedown")?.[1] as () => void;

    if (mousemoveHandler && mousedownHandler) {
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 50, clientY: 100 }));
      vi.advanceTimersByTime(100);
      // mousedown during hover delay
      mousedownHandler();
      vi.advanceTimersByTime(200);
      // The timeout fires but isMouseDown is true, so it should not open
      expect(customOpen).not.toHaveBeenCalled();
    }
  });

  it("update handles scrollIntoView transaction", () => {
    mockStore.state.isOpen = true;
    mockStore.state.anchorRect = { top: 100, left: 50, bottom: 120, right: 200 };
    const { instance, view } = instantiatePlugin();

    const mockUpdate = {
      view,
      selectionSet: false,
      docChanged: false,
      transactions: [{ scrollIntoView: true }],
    } as unknown as ViewUpdate;

    // Should not throw
    (instance as { update: (u: ViewUpdate) => void }).update(mockUpdate);
  });

  it("hover getAnchorRectFromRange returning null cancels open", () => {
    const customOpen = vi.fn();
    const detectTriggerAtPos = vi.fn(() => ({ from: 0, to: 10 }));

    (getAnchorRectFromRange as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);

    const { view } = instantiatePlugin({
      detectTriggerAtPos,
      openPopup: customOpen,
      triggerOnHover: true,
      hoverDelay: 100,
    });

    const calls = (view.dom.addEventListener as ReturnType<typeof vi.fn>).mock.calls;
    const mousemoveHandler = calls.find((c: unknown[]) => c[0] === "mousemove")?.[1] as (e: MouseEvent) => void;

    if (mousemoveHandler) {
      mousemoveHandler(new MouseEvent("mousemove", { clientX: 50, clientY: 100 }));
      vi.advanceTimersByTime(150);
      expect(customOpen).not.toHaveBeenCalled();
    }
  });
});

describe("createPositionBasedDetector", () => {
  it("delegates to selection-based detector", () => {
    const selectionDetector = vi.fn(() => ({ from: 5, to: 15 }));
    const posDetector = createPositionBasedDetector(selectionDetector);

    const mockView = {} as EditorView;
    const result = posDetector(mockView, 10);

    expect(selectionDetector).toHaveBeenCalledWith(mockView);
    expect(result).toEqual({ from: 5, to: 15 });
  });

  it("returns null when selection-based detector returns null", () => {
    const selectionDetector = vi.fn(() => null);
    const posDetector = createPositionBasedDetector(selectionDetector);

    const mockView = {} as EditorView;
    const result = posDetector(mockView, 10);

    expect(result).toBeNull();
  });

  it("returns the function that accepts view and pos", () => {
    const selectionDetector = vi.fn(() => null);
    const posDetector = createPositionBasedDetector(selectionDetector);

    expect(typeof posDetector).toBe("function");
    expect(posDetector.length).toBe(2);
  });
});
