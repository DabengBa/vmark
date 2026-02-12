import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { toast } from "sonner";
import { useDocumentStore } from "@/stores/documentStore";
import { useTabStore } from "@/stores/tabStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import type { DragOutPoint } from "@/hooks/useTabDragOut";
import type { TabTransferPayload } from "@/types/tabTransfer";

interface DragOutTransferOptions {
  tabId: string;
  point: DragOutPoint;
  windowLabel: string;
  triggerSnapback: (tabId: string) => void;
  announce: (message: string) => void;
}

async function restoreTransferredTab(
  sourceWindowLabel: string,
  targetWindowLabel: string,
  transferData: TabTransferPayload,
  logPrefix: string
): Promise<void> {
  try {
    await invoke("remove_tab_from_window", {
      targetWindowLabel,
      tabId: transferData.tabId,
    });

    const restoredTabId = useTabStore.getState().createTransferredTab(sourceWindowLabel, {
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
  } catch (error) {
    console.error(logPrefix, error);
  }
}

export async function transferTabFromDragOut({
  tabId,
  point,
  windowLabel,
  triggerSnapback,
  announce,
}: DragOutTransferOptions): Promise<void> {
  const tabState = useTabStore.getState();
  const windowTabs = tabState.getTabsByWindow(windowLabel);
  const tab = windowTabs.find((entry) => entry.id === tabId);
  if (!tab) return;

  if (windowLabel === "main" && windowTabs.length <= 1) {
    triggerSnapback(tabId);
    announce("Cannot move the last tab in the main window.");
    return;
  }

  const doc = useDocumentStore.getState().getDocument(tabId);
  if (!doc) return;

  const transferData: TabTransferPayload = {
    tabId: tab.id,
    title: tab.title,
    filePath: tab.filePath ?? null,
    content: doc.content,
    savedContent: doc.savedContent,
    isDirty: doc.isDirty,
    workspaceRoot: useWorkspaceStore.getState().rootPath ?? null,
  };

  try {
    const targetWindowLabel = await invoke<string | null>("find_drop_target_window", {
      sourceWindowLabel: windowLabel,
      screenX: point.screenX,
      screenY: point.screenY,
    });

    if (targetWindowLabel) {
      await invoke("transfer_tab_to_existing_window", {
        targetWindowLabel,
        data: transferData,
      });
      toast.message(`Moved "${tab.title}"`, {
        action: {
          label: "Undo",
          onClick: () => {
            void restoreTransferredTab(
              windowLabel,
              targetWindowLabel,
              transferData,
              "[StatusBar] Undo cross-window move failed:"
            );
          },
        },
      });
      announce(`Moved tab ${tab.title} to another window.`);
    } else {
      const createdWindowLabel = await invoke<string>("detach_tab_to_new_window", {
        data: transferData,
      });
      toast.message(`Detached "${tab.title}"`, {
        action: {
          label: "Undo",
          onClick: () => {
            void restoreTransferredTab(
              windowLabel,
              createdWindowLabel,
              transferData,
              "[StatusBar] Undo detach failed:"
            );
          },
        },
      });
      announce(`Detached tab ${tab.title} into a new window.`);
    }

    tabState.detachTab(windowLabel, tabId);
    useDocumentStore.getState().removeDocument(tabId);

    const remaining = useTabStore.getState().getTabsByWindow(windowLabel);
    if (remaining.length === 0 && windowLabel !== "main") {
      const win = getCurrentWebviewWindow();
      invoke("close_window", { label: win.label }).catch(() => {});
    }
  } catch (error) {
    console.error("[StatusBar] drag-out failed:", error);
    triggerSnapback(tabId);
    announce(`Failed to move tab ${tab.title}.`);
  }
}
