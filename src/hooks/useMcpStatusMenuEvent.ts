/**
 * MCP Status Menu Event Hook
 *
 * Handles the Help → MCP Server Status menu event.
 * Opens Settings window and navigates to the Integrations section.
 */

import { useEffect, useRef } from "react";
import { type UnlistenFn, emit } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow, WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalPosition } from "@tauri-apps/api/dpi";

/**
 * Hook to handle the MCP Server Status menu event.
 * Opens Settings → Integrations section.
 */
export function useMcpStatusMenuEvent() {
  const unlistenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      // Clean up existing listener
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }

      if (cancelled) return;

      const currentWindow = getCurrentWebviewWindow();
      const windowLabel = currentWindow.label;

      // Listen for MCP status menu event
      unlistenRef.current = await currentWindow.listen<string>(
        "menu:mcp-status",
        async (event) => {
          if (event.payload !== windowLabel) return;

          const settingsWidth = 760;
          const settingsHeight = 540;

          // Calculate centered position
          const calculateCenteredPosition = async (): Promise<{ x: number; y: number } | null> => {
            try {
              const scaleFactor = await currentWindow.scaleFactor();
              const [position, size] = await Promise.all([
                currentWindow.outerPosition(),
                currentWindow.outerSize(),
              ]);
              const x = Math.round(position.x / scaleFactor + (size.width / scaleFactor - settingsWidth) / 2);
              const y = Math.round(position.y / scaleFactor + (size.height / scaleFactor - settingsHeight) / 2);
              return { x, y };
            } catch {
              return null;
            }
          };

          // Check if Settings window already exists
          const existing = await WebviewWindow.getByLabel("settings");
          if (existing) {
            const pos = await calculateCenteredPosition();
            if (pos) {
              await existing.setPosition(new LogicalPosition(pos.x, pos.y));
            }
            await existing.setFocus();
            // Navigate to integrations section
            await emit("settings:navigate", "integrations");
            return;
          }

          // Create new Settings window with integrations section
          const pos = await calculateCenteredPosition();
          new WebviewWindow("settings", {
            url: "/settings?section=integrations",
            title: "Settings",
            width: settingsWidth,
            height: settingsHeight,
            minWidth: 600,
            minHeight: 400,
            x: pos?.x,
            y: pos?.y,
            center: !pos,
            resizable: true,
            hiddenTitle: true,
            titleBarStyle: "overlay",
          });
        }
      );
    };

    setup();

    return () => {
      cancelled = true;
      if (unlistenRef.current) {
        unlistenRef.current();
        unlistenRef.current = null;
      }
    };
  }, []);
}
