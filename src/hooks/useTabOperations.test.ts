import { describe, it, expect, beforeEach, vi } from "vitest";
import { useTabStore } from "@/stores/tabStore";
import { useDocumentStore } from "@/stores/documentStore";
import { closeTabWithDirtyCheck } from "@/hooks/useTabOperations";
import { message, save } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { saveToPath } from "@/utils/saveToPath";
import { isMacPlatform } from "@/utils/shortcutMatch";

vi.mock("@/utils/saveToPath", () => ({
  saveToPath: vi.fn(),
}));

vi.mock("@/hooks/workspaceSession", () => ({
  persistWorkspaceSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/utils/shortcutMatch", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/utils/shortcutMatch")>();
  return { ...actual, isMacPlatform: vi.fn(() => true) };
});

const WINDOW_LABEL = "main";

function resetStores() {
  const tabState = useTabStore.getState();
  tabState.removeWindow(WINDOW_LABEL);

  const docState = useDocumentStore.getState();
  Object.keys(docState.documents).forEach((id) => {
    docState.removeDocument(id);
  });
}

describe("closeTabWithDirtyCheck", () => {
  beforeEach(() => {
    resetStores();
    vi.clearAllMocks();
    vi.mocked(isMacPlatform).mockReturnValue(true);
  });

  it("closes clean tab without prompting", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW_LABEL, "/tmp/test.md");
    useDocumentStore.getState().initDocument(tabId, "hello", "/tmp/test.md");

    const result = await closeTabWithDirtyCheck(WINDOW_LABEL, tabId);

    expect(result).toBe(true);
    expect(message).not.toHaveBeenCalled();
    // Closing the last tab closes the window on macOS
    expect(useTabStore.getState().tabs[WINDOW_LABEL]).toBeUndefined();
    expect(invoke).toHaveBeenCalledWith("close_window", { label: WINDOW_LABEL });
    expect(useDocumentStore.getState().getDocument(tabId)).toBeUndefined();
  });

  it("keeps dirty tab open when user cancels", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW_LABEL, "/tmp/dirty.md");
    useDocumentStore.getState().initDocument(tabId, "hello", "/tmp/dirty.md");
    useDocumentStore.getState().setContent(tabId, "changed");

    // message() returns 'Cancel' when user clicks Cancel or dismisses
    vi.mocked(message).mockResolvedValueOnce("Cancel");

    const result = await closeTabWithDirtyCheck(WINDOW_LABEL, tabId);

    expect(result).toBe(false);
    expect(useTabStore.getState().tabs[WINDOW_LABEL]?.length ?? 0).toBe(1);
    expect(useDocumentStore.getState().getDocument(tabId)).toBeDefined();
  });

  it("closes dirty tab without saving when user chooses Don't Save", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW_LABEL, "/tmp/dirty.md");
    useDocumentStore.getState().initDocument(tabId, "hello", "/tmp/dirty.md");
    useDocumentStore.getState().setContent(tabId, "changed");

    // message() returns 'No' when user clicks "Don't Save"
    vi.mocked(message).mockResolvedValueOnce("No");

    const result = await closeTabWithDirtyCheck(WINDOW_LABEL, tabId);

    expect(result).toBe(true);
    expect(saveToPath).not.toHaveBeenCalled();
    // Closing the last tab closes the window on macOS
    expect(useTabStore.getState().tabs[WINDOW_LABEL]).toBeUndefined();
    expect(invoke).toHaveBeenCalledWith("close_window", { label: WINDOW_LABEL });
  });

  it("closes dirty tab when dialog returns custom button label (Don't Save)", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW_LABEL, "/tmp/dirty.md");
    useDocumentStore.getState().initDocument(tabId, "hello", "/tmp/dirty.md");
    useDocumentStore.getState().setContent(tabId, "changed");

    vi.mocked(message).mockResolvedValueOnce("Don't Save");

    const result = await closeTabWithDirtyCheck(WINDOW_LABEL, tabId);

    expect(result).toBe(true);
    expect(saveToPath).not.toHaveBeenCalled();
    // Closing the last tab closes the window on macOS
    expect(useTabStore.getState().tabs[WINDOW_LABEL]).toBeUndefined();
    expect(invoke).toHaveBeenCalledWith("close_window", { label: WINDOW_LABEL });
  });

  it("saves and closes dirty tab when user chooses Save and file has path", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW_LABEL, "/tmp/dirty.md");
    useDocumentStore.getState().initDocument(tabId, "hello", "/tmp/dirty.md");
    useDocumentStore.getState().setContent(tabId, "changed");

    // message() returns 'Yes' when user clicks "Save"
    vi.mocked(message).mockResolvedValueOnce("Yes");
    vi.mocked(saveToPath).mockResolvedValueOnce(true);

    const result = await closeTabWithDirtyCheck(WINDOW_LABEL, tabId);

    expect(result).toBe(true);
    expect(saveToPath).toHaveBeenCalledWith(tabId, "/tmp/dirty.md", "changed", "manual");
    // Closing the last tab closes the window on macOS
    expect(useTabStore.getState().tabs[WINDOW_LABEL]).toBeUndefined();
    expect(invoke).toHaveBeenCalledWith("close_window", { label: WINDOW_LABEL });
  });

  it("cancels close if user chooses Save but cancels Save dialog", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW_LABEL, null);
    useDocumentStore.getState().initDocument(tabId, "hello", null);
    useDocumentStore.getState().setContent(tabId, "changed");

    vi.mocked(message).mockResolvedValueOnce("Yes");
    vi.mocked(save).mockResolvedValueOnce(null);

    const result = await closeTabWithDirtyCheck(WINDOW_LABEL, tabId);

    expect(result).toBe(false);
    expect(useTabStore.getState().tabs[WINDOW_LABEL]?.length ?? 0).toBe(1);
  });

  it("deduplicates concurrent close calls for the same tab (re-entry guard)", async () => {
    const tabId = useTabStore.getState().createTab(WINDOW_LABEL, "/tmp/dirty.md");
    useDocumentStore.getState().initDocument(tabId, "hello", "/tmp/dirty.md");
    useDocumentStore.getState().setContent(tabId, "changed");

    // Make message() hang until we resolve it manually
    let resolveDialog!: (value: string) => void;
    vi.mocked(message).mockImplementationOnce(
      () => new Promise((resolve) => { resolveDialog = resolve; })
    );

    // Fire two concurrent close calls for the same tab
    const call1 = closeTabWithDirtyCheck(WINDOW_LABEL, tabId);
    const call2 = closeTabWithDirtyCheck(WINDOW_LABEL, tabId);

    // Second call returns immediately (re-entry guard)
    expect(await call2).toBe(true);

    // message() only called once (not twice)
    expect(message).toHaveBeenCalledTimes(1);

    // Resolve the dialog so call1 completes
    resolveDialog("No");
    expect(await call1).toBe(true);
  });

  it("creates untitled tab instead of closing window on non-macOS", async () => {
    vi.mocked(isMacPlatform).mockReturnValue(false);

    const tabId = useTabStore.getState().createTab(WINDOW_LABEL, "/tmp/test.md");
    useDocumentStore.getState().initDocument(tabId, "hello", "/tmp/test.md");

    const result = await closeTabWithDirtyCheck(WINDOW_LABEL, tabId);

    expect(result).toBe(true);
    // Window should NOT be closed on non-macOS
    expect(invoke).not.toHaveBeenCalledWith("close_window", expect.anything());
    // A new untitled tab should have been created
    const tabs = useTabStore.getState().tabs[WINDOW_LABEL] ?? [];
    expect(tabs.length).toBe(1);
    expect(tabs[0].filePath).toBeNull();
  });
});
