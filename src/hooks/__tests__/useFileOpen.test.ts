/**
 * Unit tests for openFileInNewTabCore — dedup guard behavior.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";
import { openFileInNewTabCore } from "../useFileOpen";

const WINDOW = "main";

// Reset stores before each test
function resetStores() {
  useTabStore.setState({
    tabs: {},
    activeTabId: {},
    untitledCounter: 0,
    closedTabs: {},
  });
  // Reset document store — clear all documents
  const docState = useDocumentStore.getState();
  const docIds = Object.keys(docState.documents);
  for (const id of docIds) {
    docState.removeDocument(id);
  }
}

describe("openFileInNewTabCore", () => {
  beforeEach(() => {
    resetStores();
    vi.clearAllMocks();
  });

  it("creates tab and initializes document for a new file", async () => {
    vi.mocked(readTextFile).mockResolvedValue("# Hello");

    await openFileInNewTabCore(WINDOW, "/Users/test/file.md");

    const tabs = useTabStore.getState().getTabsByWindow(WINDOW);
    expect(tabs).toHaveLength(1);
    const doc = useDocumentStore.getState().getDocument(tabs[0].id);
    expect(doc).toBeDefined();
    expect(doc!.content).toBe("# Hello");
  });

  it("does NOT overwrite content when createTab deduplicates", async () => {
    // Pre-create a tab with existing content
    const existingId = useTabStore.getState().createTab(WINDOW, "/Users/test/file.md");
    useDocumentStore.getState().initDocument(existingId, "# Original", "/Users/test/file.md");

    vi.mocked(readTextFile).mockResolvedValue("# Overwritten");

    // Call openFileInNewTabCore for the same path — should detect dedup
    await openFileInNewTabCore(WINDOW, "/Users/test/file.md");

    // Content must NOT be overwritten
    const doc = useDocumentStore.getState().getDocument(existingId);
    expect(doc!.content).toBe("# Original");
    // readTextFile should not even be called when dedup is detected
    expect(readTextFile).not.toHaveBeenCalled();
  });

  it("does NOT detach existing tab on dedup", async () => {
    // Pre-create a tab
    useTabStore.getState().createTab(WINDOW, "/Users/test/file.md");

    vi.mocked(readTextFile).mockRejectedValue(new Error("read failed"));

    await openFileInNewTabCore(WINDOW, "/Users/test/file.md");

    // Tab should still exist (not detached)
    const tabs = useTabStore.getState().getTabsByWindow(WINDOW);
    expect(tabs).toHaveLength(1);
  });
});
