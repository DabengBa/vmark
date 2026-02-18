/**
 * Unit tests for tabStore — focused on path deduplication logic.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { useTabStore } from "../tabStore";

const WINDOW = "main";

function resetStore() {
  useTabStore.setState({
    tabs: {},
    activeTabId: {},
    untitledCounter: 0,
    closedTabs: {},
  });
}

describe("tabStore", () => {
  beforeEach(resetStore);

  describe("findTabByPath", () => {
    it("finds tab by exact path", () => {
      useTabStore.getState().createTab(WINDOW, "/Users/test/file.md");
      const found = useTabStore.getState().findTabByPath(WINDOW, "/Users/test/file.md");
      expect(found).not.toBeNull();
      expect(found!.filePath).toBe("/Users/test/file.md");
    });

    it("finds tab when stored path has trailing slash", () => {
      // Tabs shouldn't normally have trailing slashes, but normalizePath handles it
      useTabStore.getState().createTab(WINDOW, "/Users/test/dir/");
      const found = useTabStore.getState().findTabByPath(WINDOW, "/Users/test/dir");
      expect(found).not.toBeNull();
    });

    it("finds tab with different separators (Windows backslash vs forward slash)", () => {
      useTabStore.getState().createTab(WINDOW, "C:\\Users\\test\\file.md");
      const found = useTabStore.getState().findTabByPath(WINDOW, "c:/Users/test/file.md");
      expect(found).not.toBeNull();
    });

    it("finds tab with different Windows drive letter case", () => {
      useTabStore.getState().createTab(WINDOW, "C:/Users/test/file.md");
      const found = useTabStore.getState().findTabByPath(WINDOW, "c:/Users/test/file.md");
      expect(found).not.toBeNull();
    });

    it("returns null when no matching tab exists", () => {
      useTabStore.getState().createTab(WINDOW, "/Users/test/file.md");
      const found = useTabStore.getState().findTabByPath(WINDOW, "/Users/test/other.md");
      expect(found).toBeNull();
    });
  });

  describe("findTabByFilePath (cross-window)", () => {
    it("finds tab across windows with normalized paths", () => {
      useTabStore.getState().createTab("window-1", "/Users/test/file.md");
      const result = useTabStore.getState().findTabByFilePath("/Users/test/file.md");
      expect(result).not.toBeNull();
      expect(result!.windowLabel).toBe("window-1");
    });

    it("finds tab with different separator styles", () => {
      useTabStore.getState().createTab("window-1", "C:\\Users\\test\\file.md");
      const result = useTabStore.getState().findTabByFilePath("c:/Users/test/file.md");
      expect(result).not.toBeNull();
    });
  });

  describe("createTab dedup", () => {
    it("returns existing tab ID when file is already open", () => {
      const id1 = useTabStore.getState().createTab(WINDOW, "/Users/test/file.md");
      const id2 = useTabStore.getState().createTab(WINDOW, "/Users/test/file.md");
      expect(id1).toBe(id2);
      // Only one tab should exist
      expect(useTabStore.getState().getTabsByWindow(WINDOW)).toHaveLength(1);
    });

    it("deduplicates with normalized paths", () => {
      const id1 = useTabStore.getState().createTab(WINDOW, "C:\\Users\\test\\file.md");
      const id2 = useTabStore.getState().createTab(WINDOW, "c:/Users/test/file.md");
      expect(id1).toBe(id2);
      expect(useTabStore.getState().getTabsByWindow(WINDOW)).toHaveLength(1);
    });
  });
});
