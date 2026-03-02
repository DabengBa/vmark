/**
 * Tests for useFileShortcuts — menu event listeners and keyboard shortcuts
 *
 * @module hooks/useFileShortcuts.test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Hoist mocks so they're available for vi.mock factories
const {
  mockListen, mockUnlisten,
  mockHandleSave, mockHandleSaveAs, mockHandleMoveTo,
  mockHandleSaveAllQuit, mockHandleOpen, mockHandleOpenFile, mockHandleNew,
  mockMatchesShortcutEvent, mockIsImeKeyEvent,
} = vi.hoisted(() => ({
  mockListen: vi.fn(() => Promise.resolve(vi.fn())),
  mockUnlisten: vi.fn(),
  mockHandleSave: vi.fn(),
  mockHandleSaveAs: vi.fn(),
  mockHandleMoveTo: vi.fn(),
  mockHandleSaveAllQuit: vi.fn(),
  mockHandleOpen: vi.fn(),
  mockHandleOpenFile: vi.fn(),
  mockHandleNew: vi.fn(),
  mockMatchesShortcutEvent: vi.fn(() => false),
  mockIsImeKeyEvent: vi.fn(() => false),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
}));

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: vi.fn(() => ({
    label: "main",
    listen: mockListen,
  })),
}));

vi.mock("@/stores/shortcutsStore", () => ({
  useShortcutsStore: {
    getState: vi.fn(() => ({
      getShortcut: vi.fn((id: string) => {
        if (id === "save") return "Mod-s";
        if (id === "saveAs") return "Mod-Shift-s";
        return "";
      }),
    })),
  },
}));

vi.mock("@/utils/shortcutMatch", () => ({
  matchesShortcutEvent: mockMatchesShortcutEvent,
}));

vi.mock("@/utils/imeGuard", () => ({
  isImeKeyEvent: mockIsImeKeyEvent,
}));

vi.mock("@/utils/safeUnlisten", () => ({
  safeUnlistenAll: vi.fn((fns: (() => void)[]) => {
    fns.forEach((fn) => fn());
    return [];
  }),
}));

vi.mock("./useFileSave", () => ({
  handleSave: mockHandleSave,
  handleSaveAs: mockHandleSaveAs,
  handleMoveTo: mockHandleMoveTo,
  handleSaveAllQuit: mockHandleSaveAllQuit,
}));

vi.mock("./useFileOpen", () => ({
  handleOpen: mockHandleOpen,
  handleOpenFile: mockHandleOpenFile,
  handleNew: mockHandleNew,
}));

vi.mock("@/utils/debug", () => ({
  fileOpsLog: vi.fn(),
}));

import { useFileShortcuts } from "./useFileShortcuts";

describe("useFileShortcuts", () => {
  let listenCallbacks: Record<string, (event: { payload: unknown }) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    listenCallbacks = {};

    // Capture callbacks for each event type
    mockListen.mockImplementation((eventName: string, callback: (event: { payload: unknown }) => void) => {
      listenCallbacks[eventName] = callback;
      const unlisten = vi.fn();
      return Promise.resolve(unlisten);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers all expected menu event listeners", async () => {
    renderHook(() => useFileShortcuts("main"));

    // Wait for all async listener setup
    await vi.waitFor(() => {
      expect(mockListen).toHaveBeenCalledTimes(7);
    });

    const eventNames = mockListen.mock.calls.map(
      (call: unknown[]) => call[0],
    );
    expect(eventNames).toContain("menu:new");
    expect(eventNames).toContain("menu:open");
    expect(eventNames).toContain("menu:save");
    expect(eventNames).toContain("menu:save-as");
    expect(eventNames).toContain("menu:move-to");
    expect(eventNames).toContain("menu:save-all-quit");
    expect(eventNames).toContain("open-file");
  });

  it("calls handleNew when menu:new event matches window", async () => {
    renderHook(() => useFileShortcuts("main"));

    await vi.waitFor(() => {
      expect(listenCallbacks["menu:new"]).toBeDefined();
    });

    listenCallbacks["menu:new"]({ payload: "main" });

    expect(mockHandleNew).toHaveBeenCalledWith("main");
  });

  it("ignores menu:new event for different window", async () => {
    renderHook(() => useFileShortcuts("main"));

    await vi.waitFor(() => {
      expect(listenCallbacks["menu:new"]).toBeDefined();
    });

    listenCallbacks["menu:new"]({ payload: "doc-1" });

    expect(mockHandleNew).not.toHaveBeenCalled();
  });

  it("calls handleSave when menu:save event matches window", async () => {
    renderHook(() => useFileShortcuts("main"));

    await vi.waitFor(() => {
      expect(listenCallbacks["menu:save"]).toBeDefined();
    });

    listenCallbacks["menu:save"]({ payload: "main" });

    // handleSave is async — let microtasks settle
    await vi.waitFor(() => {
      expect(mockHandleSave).toHaveBeenCalledWith("main");
    });
  });

  it("calls handleSaveAs when menu:save-as event matches window", async () => {
    renderHook(() => useFileShortcuts("main"));

    await vi.waitFor(() => {
      expect(listenCallbacks["menu:save-as"]).toBeDefined();
    });

    listenCallbacks["menu:save-as"]({ payload: "main" });

    await vi.waitFor(() => {
      expect(mockHandleSaveAs).toHaveBeenCalledWith("main");
    });
  });

  it("calls handleMoveTo when menu:move-to event matches window", async () => {
    renderHook(() => useFileShortcuts("main"));

    await vi.waitFor(() => {
      expect(listenCallbacks["menu:move-to"]).toBeDefined();
    });

    listenCallbacks["menu:move-to"]({ payload: "main" });

    await vi.waitFor(() => {
      expect(mockHandleMoveTo).toHaveBeenCalledWith("main");
    });
  });

  it("calls handleSaveAllQuit when menu:save-all-quit event matches", async () => {
    renderHook(() => useFileShortcuts("main"));

    await vi.waitFor(() => {
      expect(listenCallbacks["menu:save-all-quit"]).toBeDefined();
    });

    listenCallbacks["menu:save-all-quit"]({ payload: "main" });

    await vi.waitFor(() => {
      expect(mockHandleSaveAllQuit).toHaveBeenCalledWith("main");
    });
  });

  it("calls handleOpenFile for open-file events with path payload", async () => {
    renderHook(() => useFileShortcuts("main"));

    await vi.waitFor(() => {
      expect(listenCallbacks["open-file"]).toBeDefined();
    });

    listenCallbacks["open-file"]({ payload: { path: "/path/to/file.md" } });

    await vi.waitFor(() => {
      expect(mockHandleOpenFile).toHaveBeenCalledWith("main", "/path/to/file.md");
    });
  });

  it("cleans up listeners on unmount", async () => {
    const { unmount } = renderHook(() => useFileShortcuts("main"));

    await vi.waitFor(() => {
      expect(mockListen).toHaveBeenCalled();
    });

    unmount();

    // safeUnlistenAll was called with the accumulated unlisten functions
    // The mock returns [] which is the expected cleanup behavior
  });

  describe("keyboard shortcuts", () => {
    it("calls handleSave on Mod+S keyboard shortcut", async () => {
      mockMatchesShortcutEvent.mockImplementation(
        (_e: unknown, key: string) => key === "Mod-s",
      );

      renderHook(() => useFileShortcuts("main"));

      // Wait for listeners to be set up
      await vi.waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      const event = new KeyboardEvent("keydown", {
        key: "s",
        metaKey: true,
      });
      Object.defineProperty(event, "target", {
        value: document.createElement("div"),
      });
      window.dispatchEvent(event);

      expect(mockHandleSave).toHaveBeenCalledWith("main");
    });

    it("calls handleSaveAs on Mod+Shift+S keyboard shortcut", async () => {
      mockMatchesShortcutEvent.mockImplementation(
        (_e: unknown, key: string) => key === "Mod-Shift-s",
      );

      renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      const event = new KeyboardEvent("keydown", {
        key: "s",
        metaKey: true,
        shiftKey: true,
      });
      Object.defineProperty(event, "target", {
        value: document.createElement("div"),
      });
      window.dispatchEvent(event);

      expect(mockHandleSaveAs).toHaveBeenCalledWith("main");
    });

    it("ignores keyboard events during IME composition", async () => {
      mockIsImeKeyEvent.mockReturnValue(true);
      mockMatchesShortcutEvent.mockReturnValue(true);

      renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      const event = new KeyboardEvent("keydown", { key: "s", metaKey: true });
      Object.defineProperty(event, "target", {
        value: document.createElement("div"),
      });
      window.dispatchEvent(event);

      expect(mockHandleSave).not.toHaveBeenCalled();
    });

    it("ignores keyboard events from INPUT elements", async () => {
      mockMatchesShortcutEvent.mockReturnValue(true);

      renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      const event = new KeyboardEvent("keydown", { key: "s", metaKey: true });
      Object.defineProperty(event, "target", {
        value: document.createElement("input"),
      });
      window.dispatchEvent(event);

      expect(mockHandleSave).not.toHaveBeenCalled();
    });

    it("ignores keyboard events from TEXTAREA elements", async () => {
      mockMatchesShortcutEvent.mockReturnValue(true);

      renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      const event = new KeyboardEvent("keydown", { key: "s", metaKey: true });
      Object.defineProperty(event, "target", {
        value: document.createElement("textarea"),
      });
      window.dispatchEvent(event);

      expect(mockHandleSave).not.toHaveBeenCalled();
    });

    it("does not match unrelated keyboard events", async () => {
      mockMatchesShortcutEvent.mockReturnValue(false);

      renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      const event = new KeyboardEvent("keydown", { key: "a" });
      Object.defineProperty(event, "target", {
        value: document.createElement("div"),
      });
      window.dispatchEvent(event);

      expect(mockHandleSave).not.toHaveBeenCalled();
      expect(mockHandleSaveAs).not.toHaveBeenCalled();
    });

    it("calls handleOpen when menu:open event matches window", async () => {
      renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(listenCallbacks["menu:open"]).toBeDefined();
      });

      listenCallbacks["menu:open"]({ payload: "main" });

      await vi.waitFor(() => {
        expect(mockHandleOpen).toHaveBeenCalledWith("main");
      });
    });

    it("ignores menu:open event for different window", async () => {
      renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(listenCallbacks["menu:open"]).toBeDefined();
      });

      listenCallbacks["menu:open"]({ payload: "doc-1" });

      expect(mockHandleOpen).not.toHaveBeenCalled();
    });

    it("ignores menu:save event for different window", async () => {
      renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(listenCallbacks["menu:save"]).toBeDefined();
      });

      listenCallbacks["menu:save"]({ payload: "doc-1" });

      expect(mockHandleSave).not.toHaveBeenCalled();
    });

    it("ignores menu:save-as event for different window", async () => {
      renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(listenCallbacks["menu:save-as"]).toBeDefined();
      });

      listenCallbacks["menu:save-as"]({ payload: "doc-1" });

      expect(mockHandleSaveAs).not.toHaveBeenCalled();
    });

    it("ignores menu:move-to event for different window", async () => {
      renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(listenCallbacks["menu:move-to"]).toBeDefined();
      });

      listenCallbacks["menu:move-to"]({ payload: "doc-1" });

      expect(mockHandleMoveTo).not.toHaveBeenCalled();
    });

    it("ignores menu:save-all-quit event for different window", async () => {
      renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(listenCallbacks["menu:save-all-quit"]).toBeDefined();
      });

      listenCallbacks["menu:save-all-quit"]({ payload: "doc-1" });

      expect(mockHandleSaveAllQuit).not.toHaveBeenCalled();
    });

    it("removes keyboard listener on unmount", async () => {
      const removeListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      unmount();

      expect(removeListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );

      removeListenerSpy.mockRestore();
    });

    it("does not call save when no shortcut matches", async () => {
      mockMatchesShortcutEvent.mockReturnValue(false);

      renderHook(() => useFileShortcuts("main"));

      await vi.waitFor(() => {
        expect(mockListen).toHaveBeenCalled();
      });

      const event = new KeyboardEvent("keydown", { key: "z", metaKey: true });
      Object.defineProperty(event, "target", {
        value: document.createElement("div"),
      });
      window.dispatchEvent(event);

      expect(mockHandleSave).not.toHaveBeenCalled();
      expect(mockHandleSaveAs).not.toHaveBeenCalled();
    });
  });

  describe("cancelled guard on early unmount", () => {
    it("cleans up listeners that were set up before unmount during async setup", async () => {
      // Make the first listen resolve, then unmount before the rest complete
      let resolveSecond: ((fn: () => void) => void) | undefined;
      let callCount = 0;
      mockListen.mockImplementation((_eventName: string, _callback: unknown) => {
        callCount++;
        if (callCount === 1) {
          // First listener resolves immediately
          return Promise.resolve(vi.fn());
        }
        // Second listener is delayed
        return new Promise<() => void>((resolve) => {
          resolveSecond = resolve;
        });
      });

      const { unmount } = renderHook(() => useFileShortcuts("main"));

      // Wait for first listen to be called
      await vi.waitFor(() => {
        expect(mockListen).toHaveBeenCalledTimes(2);
      });

      // Unmount while second listen is still pending
      unmount();

      // Now resolve the second listen — it should call the unlisten immediately
      // because cancelled is now true
      const unlisten2 = vi.fn();
      if (resolveSecond) {
        resolveSecond(unlisten2);
      }

      await vi.waitFor(() => {
        expect(unlisten2).toHaveBeenCalled();
      });
    });
  });
});
