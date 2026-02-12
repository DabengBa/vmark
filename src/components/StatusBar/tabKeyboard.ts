import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { Tab } from "@/stores/tabStore";

interface HandleTabKeyboardOptions {
  tabId: string;
  event: ReactKeyboardEvent;
  tabs: Tab[];
  onReorder: (tabId: string, visualDropIndex: number) => void;
  onActivate: (tabId: string) => void;
}

export function handleTabKeyboard({ tabId, event, tabs, onReorder, onActivate }: HandleTabKeyboardOptions): void {
  if (event.nativeEvent.isComposing) return;

  if (event.altKey && event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
    event.preventDefault();
    const fromIndex = tabs.findIndex((tab) => tab.id === tabId);
    if (fromIndex === -1) return;
    const visualDropIndex = event.key === "ArrowLeft" ? fromIndex : fromIndex + 2;
    onReorder(tabId, visualDropIndex);
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate(tabId);
  }
}
