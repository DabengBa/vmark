/**
 * WindowContext Tests
 *
 * Tests for the WindowProvider, useWindowLabel, and useIsDocumentWindow hooks.
 * Covers: context provider/consumer pattern, label detection, error boundaries,
 * and settings/doc-window branching.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

// --- Mocks (must precede imports) ---

const {
  mockEmit,
  mockListen,
  mockCreateTab,
  mockGetTabsByWindow,
  mockInitDocument,
  mockSetLineMetadata,
  mockAddFile,
  mockRehydrate,
  mockCloseWorkspace,
} = vi.hoisted(() => ({
  mockEmit: vi.fn(),
  mockListen: vi.fn(() => Promise.resolve(vi.fn())),
  mockCreateTab: vi.fn(() => "tab-1"),
  mockGetTabsByWindow: vi.fn(() => [] as unknown[]),
  mockInitDocument: vi.fn(),
  mockSetLineMetadata: vi.fn(),
  mockAddFile: vi.fn(),
  mockRehydrate: vi.fn(),
  mockCloseWorkspace: vi.fn(),
}));

let mockWindowLabel = "main";

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: () => ({
    label: mockWindowLabel,
    emit: mockEmit,
    listen: mockListen,
    close: vi.fn(),
  }),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn(() => Promise.resolve("")),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("../stores/documentStore", () => ({
  useDocumentStore: {
    getState: () => ({
      initDocument: mockInitDocument,
      setLineMetadata: mockSetLineMetadata,
      removeDocument: vi.fn(),
    }),
  },
}));

vi.mock("../stores/tabStore", () => ({
  useTabStore: {
    getState: () => ({
      createTab: mockCreateTab,
      getTabsByWindow: mockGetTabsByWindow,
      createTransferredTab: vi.fn(() => "tab-t"),
      updateTabTitle: vi.fn(),
      detachTab: vi.fn(),
    }),
  },
}));

vi.mock("../stores/recentFilesStore", () => ({
  useRecentFilesStore: {
    getState: () => ({ addFile: mockAddFile }),
  },
}));

vi.mock("../stores/workspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => ({
      rootPath: null,
      isWorkspaceMode: false,
      closeWorkspace: mockCloseWorkspace,
    }),
    persist: { rehydrate: mockRehydrate },
  },
}));

vi.mock("../utils/workspaceStorage", () => ({
  setCurrentWindowLabel: vi.fn(),
  migrateWorkspaceStorage: vi.fn(),
  getWorkspaceStorageKey: vi.fn((label: string) => `vmark-workspace:${label}`),
  findActiveWorkspaceLabel: vi.fn(() => null),
}));

vi.mock("../utils/openPolicy", () => ({
  resolveWorkspaceRootForExternalFile: vi.fn(() => null),
}));

vi.mock("../utils/paths", () => ({
  isWithinRoot: vi.fn(() => false),
}));

vi.mock("../hooks/openWorkspaceWithConfig", () => ({
  openWorkspaceWithConfig: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/hooks/useWorkspaceSync", () => ({
  useWorkspaceSync: vi.fn(),
}));

vi.mock("../utils/linebreakDetection", () => ({
  detectLinebreaks: vi.fn(() => ({ type: "lf" })),
}));

vi.mock("@/utils/debug", () => ({
  windowCloseWarn: vi.fn(),
}));

// Now import components under test
import { WindowProvider, useWindowLabel, useIsDocumentWindow } from "./WindowContext";

// Helper wrapper
function Wrapper({ children }: { children: ReactNode }) {
  return <WindowProvider>{children}</WindowProvider>;
}

describe("WindowContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWindowLabel = "main";
    mockGetTabsByWindow.mockReturnValue([]);
    // Reset location.search
    Object.defineProperty(globalThis, "location", {
      value: { search: "" },
      writable: true,
      configurable: true,
    });
  });

  describe("WindowProvider", () => {
    it("renders children after initialization", async () => {
      render(
        <WindowProvider>
          <div data-testid="child">Hello</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("child")).toBeInTheDocument();
      });
    });

    it("emits ready event to Rust after init", async () => {
      vi.useFakeTimers();

      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      // Allow async init to complete
      await vi.advanceTimersByTimeAsync(200);

      expect(mockEmit).toHaveBeenCalledWith("ready", "main");

      vi.useRealTimers();
    });

    it("creates initial tab and empty document for main window", async () => {
      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockCreateTab).toHaveBeenCalledWith("main", null);
        expect(mockInitDocument).toHaveBeenCalledWith("tab-1", "", null);
      });
    });

    it("skips document init for settings window", async () => {
      mockWindowLabel = "settings";

      render(
        <WindowProvider>
          <div data-testid="child">Settings</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("child")).toBeInTheDocument();
      });

      // Should not create tabs for settings window
      expect(mockCreateTab).not.toHaveBeenCalled();
    });

    it("skips document init when tabs already exist", async () => {
      mockGetTabsByWindow.mockReturnValue([{ id: "existing-tab" }]);

      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockCreateTab).not.toHaveBeenCalled();
      });
    });

    it("sets up tab:transfer and tab:remove-by-id listeners for doc windows", async () => {
      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockListen).toHaveBeenCalledWith("tab:transfer", expect.any(Function));
        expect(mockListen).toHaveBeenCalledWith("tab:remove-by-id", expect.any(Function));
      });
    });

    it("does not set up tab listeners for settings window", async () => {
      mockWindowLabel = "settings";

      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      // Wait for render to settle
      await waitFor(() => {
        expect(screen.getByText("content")).toBeInTheDocument();
      });

      // tab:transfer listener should not be set for settings windows
      const transferCalls = mockListen.mock.calls.filter(
        (call) => call[0] === "tab:transfer",
      );
      expect(transferCalls).toHaveLength(0);
    });

    it("rehydrates workspace store on init", async () => {
      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockRehydrate).toHaveBeenCalled();
      });
    });

    it("closes workspace when main window opens with no file and no workspace param", async () => {
      mockWindowLabel = "main";

      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockCloseWorkspace).toHaveBeenCalled();
      });
    });
  });

  describe("useWindowLabel", () => {
    it("returns the window label from context", async () => {
      let label: string | undefined;

      function Consumer() {
        label = useWindowLabel();
        return <div>{label}</div>;
      }

      render(
        <WindowProvider>
          <Consumer />
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(label).toBe("main");
      });
    });

    it("throws when used outside WindowProvider", () => {
      // Suppress React error boundary console output
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useWindowLabel());
      }).toThrow("useWindowLabel must be used within WindowProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("useIsDocumentWindow", () => {
    it("returns true for main window", async () => {
      let isDoc: boolean | undefined;

      function Consumer() {
        isDoc = useIsDocumentWindow();
        return <div>{String(isDoc)}</div>;
      }

      render(
        <WindowProvider>
          <Consumer />
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(isDoc).toBe(true);
      });
    });

    it("returns true for doc-* windows", async () => {
      mockWindowLabel = "doc-123";
      let isDoc: boolean | undefined;

      function Consumer() {
        isDoc = useIsDocumentWindow();
        return <div>{String(isDoc)}</div>;
      }

      render(
        <WindowProvider>
          <Consumer />
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(isDoc).toBe(true);
      });
    });

    it("returns false for settings window", async () => {
      mockWindowLabel = "settings";
      let isDoc: boolean | undefined;

      function Consumer() {
        isDoc = useIsDocumentWindow();
        return <div>{String(isDoc)}</div>;
      }

      render(
        <WindowProvider>
          <Consumer />
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(isDoc).toBe(false);
      });
    });

    it("throws when used outside WindowProvider", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        renderHook(() => useIsDocumentWindow());
      }).toThrow("useIsDocumentWindow must be used within WindowProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("WindowProvider — doc-* window", () => {
    it("creates tab and document for doc-* window", async () => {
      mockWindowLabel = "doc-456";

      render(
        <WindowProvider>
          <div>content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockCreateTab).toHaveBeenCalledWith("doc-456", null);
        expect(mockInitDocument).toHaveBeenCalledWith("tab-1", "", null);
      });
    });
  });

  describe("WindowProvider — settings window workspace", () => {
    it("looks for active workspace label for settings window", async () => {
      mockWindowLabel = "settings";

      render(
        <WindowProvider>
          <div data-testid="child">Settings</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("child")).toBeInTheDocument();
      });
    });
  });

  describe("WindowProvider — error handling", () => {
    it("still sets isReady on init error", async () => {
      // Force an error by making getCurrentWebviewWindow throw
      const origMock = vi.mocked(mockListen);
      origMock.mockImplementationOnce(() => Promise.reject(new Error("test error")));

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      render(
        <WindowProvider>
          <div data-testid="child">Content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("child")).toBeInTheDocument();
      });

      errorSpy.mockRestore();
    });
  });

  describe("WindowProvider — file loading from URL params", () => {
    it("loads file content from URL file param", async () => {
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      vi.mocked(readTextFile).mockResolvedValue("# File Content");

      Object.defineProperty(globalThis, "location", {
        value: { search: "?file=/docs/test.md" },
        writable: true,
        configurable: true,
      });

      render(
        <WindowProvider>
          <div data-testid="child">content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockCreateTab).toHaveBeenCalledWith("main", "/docs/test.md");
      });

      await waitFor(() => {
        expect(readTextFile).toHaveBeenCalledWith("/docs/test.md");
        expect(mockInitDocument).toHaveBeenCalled();
        expect(mockSetLineMetadata).toHaveBeenCalled();
        expect(mockAddFile).toHaveBeenCalledWith("/docs/test.md");
      });
    });

    it("initializes empty document when file read fails", async () => {
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      vi.mocked(readTextFile).mockRejectedValue(new Error("not found"));
      const { toast } = await import("sonner");

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      Object.defineProperty(globalThis, "location", {
        value: { search: "?file=/docs/missing.md" },
        writable: true,
        configurable: true,
      });

      render(
        <WindowProvider>
          <div data-testid="child">content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockInitDocument).toHaveBeenCalledWith(expect.any(String), "", null);
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("missing.md"));
      });

      errorSpy.mockRestore();
    });

    it("opens workspace from workspaceRoot URL param", async () => {
      const { openWorkspaceWithConfig } = await import("../hooks/openWorkspaceWithConfig");

      Object.defineProperty(globalThis, "location", {
        value: { search: "?workspaceRoot=/projects/myapp&file=/projects/myapp/README.md" },
        writable: true,
        configurable: true,
      });

      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      vi.mocked(readTextFile).mockResolvedValue("# README");

      render(
        <WindowProvider>
          <div data-testid="child">content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(openWorkspaceWithConfig).toHaveBeenCalledWith("/projects/myapp");
      });
    });

    it("handles multiple files from files URL param", async () => {
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      vi.mocked(readTextFile).mockResolvedValue("# content");

      const files = JSON.stringify(["/docs/a.md", "/docs/b.md"]);
      Object.defineProperty(globalThis, "location", {
        value: { search: `?files=${encodeURIComponent(files)}` },
        writable: true,
        configurable: true,
      });

      render(
        <WindowProvider>
          <div data-testid="child">content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockCreateTab).toHaveBeenCalledTimes(2);
        expect(readTextFile).toHaveBeenCalledWith("/docs/a.md");
        expect(readTextFile).toHaveBeenCalledWith("/docs/b.md");
      });
    });

    it("handles invalid JSON in files param gracefully", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      Object.defineProperty(globalThis, "location", {
        value: { search: "?files=not-json" },
        writable: true,
        configurable: true,
      });

      render(
        <WindowProvider>
          <div data-testid="child">content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("child")).toBeInTheDocument();
      });

      // Should still create a default empty tab (falls through to else branch)
      await waitFor(() => {
        expect(mockCreateTab).toHaveBeenCalled();
        expect(mockInitDocument).toHaveBeenCalledWith(expect.any(String), "", null);
      });

      errorSpy.mockRestore();
    });

    it("handles file read failure in multi-file mode", async () => {
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      vi.mocked(readTextFile)
        .mockResolvedValueOnce("# good content")
        .mockRejectedValueOnce(new Error("read error"));
      const { toast } = await import("sonner");

      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const files = JSON.stringify(["/docs/good.md", "/docs/bad.md"]);
      Object.defineProperty(globalThis, "location", {
        value: { search: `?files=${encodeURIComponent(files)}` },
        writable: true,
        configurable: true,
      });

      render(
        <WindowProvider>
          <div data-testid="child">content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        // First file succeeded, second failed
        expect(mockCreateTab).toHaveBeenCalledTimes(2);
        expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("bad.md"));
        // Failed file still gets empty document
        expect(mockInitDocument).toHaveBeenCalledWith(expect.any(String), "", null);
      });

      errorSpy.mockRestore();
    });
  });

  describe("WindowProvider — doc-* window clears localStorage", () => {
    it("clears persisted workspace state for doc-* window", async () => {
      mockWindowLabel = "doc-789";
      const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem");

      render(
        <WindowProvider>
          <div data-testid="child">content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(removeItemSpy).toHaveBeenCalledWith("vmark-workspace:doc-789");
      });

      removeItemSpy.mockRestore();
    });
  });

  describe("WindowProvider — settings window uses active workspace label", () => {
    it("sets current window label to active workspace label for settings", async () => {
      mockWindowLabel = "settings";
      const { findActiveWorkspaceLabel, setCurrentWindowLabel } = await import("../utils/workspaceStorage");
      vi.mocked(findActiveWorkspaceLabel).mockReturnValue("main");

      render(
        <WindowProvider>
          <div data-testid="child">settings</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        // Should first call with "settings", then with "main" (active workspace)
        expect(setCurrentWindowLabel).toHaveBeenCalledWith("settings");
        expect(setCurrentWindowLabel).toHaveBeenCalledWith("main");
      });
    });
  });

  describe("WindowProvider — tab transfer handling", () => {
    it("handles tab transfer from URL param", async () => {
      vi.useFakeTimers();
      mockWindowLabel = "doc-new";
      const { invoke } = await import("@tauri-apps/api/core");
      vi.mocked(invoke).mockResolvedValue({
        tabId: "transferred-tab",
        title: "Transferred",
        content: "# Transferred content",
        filePath: "/docs/transferred.md",
        savedContent: "# Transferred content",
        workspaceRoot: null,
      });

      Object.defineProperty(globalThis, "location", {
        value: { search: "?transfer=true" },
        writable: true,
        configurable: true,
      });

      render(
        <WindowProvider>
          <div data-testid="child">content</div>
        </WindowProvider>,
      );

      await vi.advanceTimersByTimeAsync(200);

      expect(invoke).toHaveBeenCalledWith("claim_tab_transfer", { windowLabel: "doc-new" });

      vi.useRealTimers();
    });
  });

  describe("WindowProvider — workspace resolution for external file", () => {
    it("derives workspace root from file path when no workspace is active", async () => {
      const { resolveWorkspaceRootForExternalFile } = await import("../utils/openPolicy");
      vi.mocked(resolveWorkspaceRootForExternalFile).mockReturnValue("/docs");
      const { openWorkspaceWithConfig } = await import("../hooks/openWorkspaceWithConfig");
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      vi.mocked(readTextFile).mockResolvedValue("# content");

      Object.defineProperty(globalThis, "location", {
        value: { search: "?file=/docs/test.md" },
        writable: true,
        configurable: true,
      });

      render(
        <WindowProvider>
          <div data-testid="child">content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(resolveWorkspaceRootForExternalFile).toHaveBeenCalledWith("/docs/test.md");
        expect(openWorkspaceWithConfig).toHaveBeenCalledWith("/docs");
      });
    });

    it("closes workspace for main window when file resolves to no workspace root", async () => {
      const { resolveWorkspaceRootForExternalFile } = await import("../utils/openPolicy");
      vi.mocked(resolveWorkspaceRootForExternalFile).mockReturnValue(null);
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      vi.mocked(readTextFile).mockResolvedValue("# content");

      Object.defineProperty(globalThis, "location", {
        value: { search: "?file=/tmp/orphan.md" },
        writable: true,
        configurable: true,
      });

      render(
        <WindowProvider>
          <div data-testid="child">content</div>
        </WindowProvider>,
      );

      await waitFor(() => {
        expect(mockCloseWorkspace).toHaveBeenCalled();
      });
    });
  });
});
