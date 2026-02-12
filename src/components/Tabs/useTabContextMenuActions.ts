import { useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";
import { useTabStore, type Tab } from "@/stores/tabStore";
import { useDocumentStore, type DocumentState } from "@/stores/documentStore";
import { closeTabWithDirtyCheck, closeTabsWithDirtyCheck } from "@/hooks/useTabOperations";
import { saveToPath } from "@/utils/saveToPath";
import { getRelativePath, isWithinRoot } from "@/utils/paths";
import type { TabTransferPayload } from "@/types/tabTransfer";

export interface TabMenuItem {
  id: string;
  label: string;
  action: () => void | Promise<void>;
  disabled?: boolean;
  separator?: boolean;
  shortcut?: string;
}

interface UseTabContextMenuActionsOptions {
  tab: Tab;
  tabs: Tab[];
  doc?: DocumentState;
  filePath: string | null;
  windowLabel: string;
  workspaceRoot: string | null;
  revealLabel: string;
  closeShortcutLabel: string;
  onClose: () => void;
}

export function useTabContextMenuActions({
  tab,
  tabs,
  doc,
  filePath,
  windowLabel,
  workspaceRoot,
  revealLabel,
  closeShortcutLabel,
  onClose,
}: UseTabContextMenuActionsOptions): TabMenuItem[] {
  const tabIndex = tabs.findIndex((entry) => entry.id === tab.id);
  const hasTabsToRight = tabs.slice(tabIndex + 1).some((entry) => !entry.isPinned);
  const hasOtherTabs = tabs.some((entry) => entry.id !== tab.id && !entry.isPinned);
  const hasUnpinnedTabs = tabs.some((entry) => !entry.isPinned);
  const canMoveToNewWindow = Boolean(doc) && !(windowLabel === "main" && tabs.length <= 1);
  const canCopyRelativePath = Boolean(
    filePath
      && workspaceRoot
      && isWithinRoot(workspaceRoot, filePath)
      && getRelativePath(workspaceRoot, filePath)
  );

  const handleClose = useCallback(async () => {
    await closeTabWithDirtyCheck(windowLabel, tab.id);
    onClose();
  }, [onClose, tab.id, windowLabel]);

  const handleCloseOthers = useCallback(async () => {
    const tabIds = tabs.filter((entry) => entry.id !== tab.id && !entry.isPinned).map((entry) => entry.id);
    await closeTabsWithDirtyCheck(windowLabel, tabIds);
    onClose();
  }, [onClose, tab.id, tabs, windowLabel]);

  const handleCloseToRight = useCallback(async () => {
    const tabIds = tabs
      .filter((entry, index) => index > tabIndex && !entry.isPinned)
      .map((entry) => entry.id);
    await closeTabsWithDirtyCheck(windowLabel, tabIds);
    onClose();
  }, [onClose, tabIndex, tabs, windowLabel]);

  const handleCloseAllUnpinned = useCallback(async () => {
    const tabIds = tabs.filter((entry) => !entry.isPinned).map((entry) => entry.id);
    await closeTabsWithDirtyCheck(windowLabel, tabIds);
    onClose();
  }, [onClose, tabs, windowLabel]);

  const handlePin = useCallback(() => {
    useTabStore.getState().togglePin(windowLabel, tab.id);
    onClose();
  }, [onClose, tab.id, windowLabel]);

  const handleMoveToNewWindow = useCallback(async () => {
    if (!doc) {
      toast.error("Cannot move tab: document is not loaded.");
      onClose();
      return;
    }

    if (windowLabel === "main" && tabs.length <= 1) {
      toast.error("Cannot move the last tab in the main window.");
      onClose();
      return;
    }

    const transferData: TabTransferPayload = {
      tabId: tab.id,
      title: tab.title,
      filePath,
      content: doc.content,
      savedContent: doc.savedContent,
      isDirty: doc.isDirty,
      workspaceRoot: workspaceRoot ?? null,
    };

    try {
      const createdWindowLabel = await invoke<string>("detach_tab_to_new_window", { data: transferData });
      useTabStore.getState().detachTab(windowLabel, tab.id);
      useDocumentStore.getState().removeDocument(tab.id);

      toast.message(`Moved "${tab.title}" to a new window`, {
        action: {
          label: "Undo",
          onClick: () => {
            void invoke("remove_tab_from_window", {
              targetWindowLabel: createdWindowLabel,
              tabId: transferData.tabId,
            }).then(() => {
              const restoredTabId = useTabStore.getState().createTransferredTab(windowLabel, {
                id: transferData.tabId,
                filePath: transferData.filePath,
                title: transferData.title,
                isPinned: false,
              });
              useDocumentStore.getState().initDocument(
                restoredTabId,
                transferData.content,
                transferData.filePath,
                transferData.savedContent
              );
            }).catch((error) => {
              console.error("[TabContextMenu] Undo move-to-new-window failed:", error);
              toast.error("Failed to undo tab move.");
            });
          },
        },
      });

      const remaining = useTabStore.getState().getTabsByWindow(windowLabel);
      if (remaining.length === 0 && windowLabel !== "main") {
        const win = getCurrentWebviewWindow();
        void invoke("close_window", { label: win.label }).catch(() => {});
      }
    } catch (error) {
      console.error("[TabContextMenu] Move to new window failed:", error);
      toast.error("Failed to move tab to a new window.");
    } finally {
      onClose();
    }
  }, [doc, filePath, onClose, tab.id, tab.title, tabs.length, windowLabel, workspaceRoot]);

  const handleRestoreToDisk = useCallback(async () => {
    if (!filePath || !doc) return;
    const saved = await saveToPath(tab.id, filePath, doc.content, "manual");
    if (saved) {
      useDocumentStore.getState().clearMissing(tab.id);
      toast.success("File restored to disk.");
    } else {
      toast.error("Failed to restore file to disk.");
    }
    onClose();
  }, [doc, filePath, onClose, tab.id]);

  const handleCopyPath = useCallback(async () => {
    if (!filePath) return;
    try {
      await writeText(filePath);
      toast.success("Path copied to clipboard.");
    } catch (error) {
      console.error("[TabContextMenu] Failed to copy path:", error);
      toast.error("Failed to copy path.");
    }
    onClose();
  }, [filePath, onClose]);

  const handleCopyRelativePath = useCallback(async () => {
    if (!filePath || !workspaceRoot || !isWithinRoot(workspaceRoot, filePath)) return;
    const relativePath = getRelativePath(workspaceRoot, filePath);
    if (!relativePath) return;

    try {
      await writeText(relativePath);
      toast.success("Relative path copied to clipboard.");
    } catch (error) {
      console.error("[TabContextMenu] Failed to copy relative path:", error);
      toast.error("Failed to copy relative path.");
    }
    onClose();
  }, [filePath, onClose, workspaceRoot]);

  const handleRevealInFileManager = useCallback(async () => {
    if (!filePath) return;
    try {
      await revealItemInDir(filePath);
    } catch (error) {
      console.error("[TabContextMenu] Failed to reveal file:", error);
      toast.error("Failed to reveal file in file manager.");
    }
    onClose();
  }, [filePath, onClose]);

  return useMemo(() => [
    {
      id: "moveToNewWindow",
      label: "Move to New Window",
      action: handleMoveToNewWindow,
      disabled: !canMoveToNewWindow,
    },
    {
      id: "pin",
      label: tab.isPinned ? "Unpin" : "Pin",
      action: handlePin,
    },
    {
      id: "copyPath",
      label: "Copy Path",
      action: handleCopyPath,
      disabled: !filePath,
    },
    {
      id: "copyRelativePath",
      label: "Copy Relative Path",
      action: handleCopyRelativePath,
      disabled: !canCopyRelativePath,
    },
    {
      id: "reveal",
      label: revealLabel,
      action: handleRevealInFileManager,
      disabled: !filePath,
    },
    ...(doc?.isMissing && filePath
      ? [{
          id: "restoreToDisk",
          label: "Restore to Disk",
          action: handleRestoreToDisk,
        } satisfies TabMenuItem]
      : []),
    { id: "separator-1", label: "", action: () => {}, separator: true },
    {
      id: "close",
      label: "Close",
      action: handleClose,
      disabled: tab.isPinned,
      shortcut: closeShortcutLabel,
    },
    {
      id: "closeOthers",
      label: "Close Others",
      action: handleCloseOthers,
      disabled: !hasOtherTabs,
    },
    {
      id: "closeRight",
      label: "Close Tabs to the Right",
      action: handleCloseToRight,
      disabled: !hasTabsToRight,
    },
    {
      id: "closeAllUnpinned",
      label: "Close All Unpinned Tabs",
      action: handleCloseAllUnpinned,
      disabled: !hasUnpinnedTabs,
    },
  ], [
    canCopyRelativePath,
    canMoveToNewWindow,
    closeShortcutLabel,
    doc?.isMissing,
    filePath,
    handleClose,
    handleCloseAllUnpinned,
    handleCloseOthers,
    handleCloseToRight,
    handleCopyPath,
    handleCopyRelativePath,
    handleMoveToNewWindow,
    handlePin,
    handleRestoreToDisk,
    handleRevealInFileManager,
    hasOtherTabs,
    hasTabsToRight,
    hasUnpinnedTabs,
    revealLabel,
    tab.isPinned,
  ]);
}
