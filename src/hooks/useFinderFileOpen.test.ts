/**
 * Tests for useFinderFileOpen — Finder file open handling.
 *
 * Covers:
 *   - Event listener registration
 *   - File routing: existing tab, replaceable tab, new tab, new window
 *   - Hot exit restore waiting
 *   - Pending file queue from Rust
 *   - Workspace adoption, different workspace (new window)
 *   - Error handling in loadFileIntoTab
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

const {
  mockListen,
  mockReadTextFile,
  mockInvoke,
  mockFindExistingTabForPath,
  mockGetReplaceableTab,
  mockOpenWorkspaceWithConfig,
  mockWaitForRestoreComplete,
  mockUseWindowLabel,
} = vi.hoisted(() => ({
  mockListen: vi.fn(() => Promise.resolve(vi.fn())),
  mockReadTextFile: vi.fn(() => Promise.resolve("content")),
  mockInvoke: vi.fn(() => Promise.resolve([])),
  mockFindExistingTabForPath: vi.fn(() => null),
  mockGetReplaceableTab: vi.fn(() => null),
  mockOpenWorkspaceWithConfig: vi.fn(() => Promise.resolve()),
  mockWaitForRestoreComplete: vi.fn(() => Promise.resolve(true)),
  mockUseWindowLabel: vi.fn(() => "main"),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: (...args: unknown[]) => mockListen(...args),
}));

vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: (...args: unknown[]) => mockReadTextFile(...args),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

vi.mock("@/contexts/WindowContext", () => ({
  useWindowLabel: () => mockUseWindowLabel(),
}));

const mockSetActiveTab = vi.fn();
const mockCreateTab = vi.fn(() => "new-tab");
const mockUpdateTabPath = vi.fn();
vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: () => ({
      setActiveTab: mockSetActiveTab,
      createTab: mockCreateTab,
      updateTabPath: mockUpdateTabPath,
    }),
  },
}));

const mockInitDocument = vi.fn();
const mockLoadContent = vi.fn();
const mockSetLineMetadata = vi.fn();
vi.mock("@/stores/documentStore", () => ({
  useDocumentStore: {
    getState: () => ({
      initDocument: mockInitDocument,
      loadContent: mockLoadContent,
      setLineMetadata: mockSetLineMetadata,
    }),
  },
}));

vi.mock("@/stores/workspaceStore", () => ({
  useWorkspaceStore: {
    getState: () => ({ rootPath: null }),
  },
}));

vi.mock("@/stores/recentFilesStore", () => ({
  useRecentFilesStore: {
    getState: () => ({ addFile: vi.fn() }),
  },
}));

vi.mock("@/hooks/useReplaceableTab", () => ({
  getReplaceableTab: (...args: unknown[]) => mockGetReplaceableTab(...args),
  findExistingTabForPath: (...args: unknown[]) => mockFindExistingTabForPath(...args),
}));

vi.mock("@/utils/linebreakDetection", () => ({
  detectLinebreaks: vi.fn(() => ({ type: "lf", original: "lf" })),
}));

vi.mock("@/hooks/openWorkspaceWithConfig", () => ({
  openWorkspaceWithConfig: (...args: unknown[]) => mockOpenWorkspaceWithConfig(...args),
}));

vi.mock("@/utils/paths", () => ({
  isWithinRoot: vi.fn(() => false),
}));

vi.mock("@/utils/hotExit/hotExitCoordination", () => ({
  waitForRestoreComplete: (...args: unknown[]) => mockWaitForRestoreComplete(...args),
  RESTORE_WAIT_TIMEOUT_MS: 5000,
}));

vi.mock("@/utils/debug", () => ({
  finderFileOpenWarn: vi.fn(),
}));

import { useFinderFileOpen } from "./useFinderFileOpen";

describe("useFinderFileOpen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWindowLabel.mockReturnValue("main");
    mockInvoke.mockResolvedValue([]);
    mockWaitForRestoreComplete.mockResolvedValue(true);
    mockReadTextFile.mockResolvedValue("file content");
    mockFindExistingTabForPath.mockReturnValue(null);
    mockGetReplaceableTab.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers event listener on mount", async () => {
    renderHook(() => useFinderFileOpen());

    await vi.waitFor(() => {
      expect(mockListen).toHaveBeenCalledWith("app:open-file", expect.any(Function));
    });
  });

  it("does nothing for non-main windows", () => {
    mockUseWindowLabel.mockReturnValue("doc-0");
    renderHook(() => useFinderFileOpen());
    expect(mockListen).not.toHaveBeenCalled();
  });

  it("cleans up listener on unmount", async () => {
    const mockUnlisten = vi.fn();
    mockListen.mockResolvedValue(mockUnlisten);

    const { unmount } = renderHook(() => useFinderFileOpen());

    await vi.waitFor(() => {
      expect(mockListen).toHaveBeenCalled();
    });

    unmount();
    expect(mockUnlisten).toHaveBeenCalled();
  });

  it("fetches pending file opens after restore", async () => {
    renderHook(() => useFinderFileOpen());

    await vi.waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("get_pending_file_opens");
    });
  });

  it("activates existing tab when file is already open", async () => {
    mockFindExistingTabForPath.mockReturnValue("existing-tab");
    mockInvoke.mockResolvedValue([{ path: "/test/file.md", workspace_root: null }]);

    renderHook(() => useFinderFileOpen());

    await vi.waitFor(() => {
      expect(mockSetActiveTab).toHaveBeenCalledWith("main", "existing-tab");
    });
  });

  it("loads file into replaceable tab", async () => {
    mockGetReplaceableTab.mockReturnValue({ tabId: "empty-tab" });
    mockInvoke.mockResolvedValue([{ path: "/test/file.md", workspace_root: null }]);

    renderHook(() => useFinderFileOpen());

    await vi.waitFor(() => {
      expect(mockLoadContent).toHaveBeenCalled();
      expect(mockUpdateTabPath).toHaveBeenCalledWith("empty-tab", "/test/file.md");
    });
  });

  it("creates new tab for same workspace file", async () => {
    mockInvoke.mockResolvedValue([{ path: "/test/file.md", workspace_root: null }]);

    renderHook(() => useFinderFileOpen());

    await vi.waitFor(() => {
      expect(mockCreateTab).toHaveBeenCalledWith("main", "/test/file.md");
    });
  });

  it("handles loadFileIntoTab error gracefully for new tab", async () => {
    mockReadTextFile.mockRejectedValue(new Error("read error"));
    mockInvoke.mockResolvedValue([{ path: "/bad/file.md", workspace_root: null }]);

    renderHook(() => useFinderFileOpen());

    await vi.waitFor(() => {
      expect(mockInitDocument).toHaveBeenCalledWith("new-tab", "", null);
    });
  });

  it("waits for hot exit restore before processing", async () => {
    renderHook(() => useFinderFileOpen());

    await vi.waitFor(() => {
      expect(mockWaitForRestoreComplete).toHaveBeenCalled();
    });
  });
});
