/**
 * Mermaid Export
 *
 * Adds a PNG export button to mermaid diagram containers.
 * Renders SVG with the chosen theme, converts to 2x PNG, and saves via Tauri dialog.
 */

import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { renderMermaidForExport } from "./index";
import { svgToPngBytes } from "@/utils/svgToPng";
import {
  setupDiagramExport,
  LIGHT_BG,
  DARK_BG,
  type ExportInstance,
} from "@/plugins/shared/diagramExport";

export function setupMermaidExport(
  container: HTMLElement,
  mermaidSource: string,
): ExportInstance {
  return setupDiagramExport(container, async (theme) => {
    const svg = await renderMermaidForExport(mermaidSource, theme);
    if (!svg) {
      console.warn("[mermaid-export] render returned no SVG");
      return;
    }

    const bgColor = theme === "dark" ? DARK_BG : LIGHT_BG;

    let pngData: Uint8Array;
    try {
      pngData = await svgToPngBytes(svg, 2, bgColor);
    } catch (e) {
      console.warn("[mermaid-export] SVG→PNG conversion failed", e);
      return;
    }

    const filePath = await save({
      defaultPath: "diagram.png",
      filters: [{ name: "PNG Image", extensions: ["png"] }],
    });
    if (!filePath) return;

    try {
      await writeFile(filePath, pngData);
    } catch (e) {
      console.warn("[mermaid-export] failed to write file", e);
    }
  });
}
