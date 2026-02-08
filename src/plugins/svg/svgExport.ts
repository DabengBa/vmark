/**
 * SVG Export
 *
 * Adds a PNG export button to SVG code block containers.
 * Converts to 2x PNG and saves via Tauri dialog.
 */

import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { sanitizeSvg } from "@/utils/sanitize";
import { svgToPngBytes } from "@/utils/svgToPng";
import {
  setupDiagramExport,
  LIGHT_BG,
  DARK_BG,
  type ExportInstance,
} from "@/plugins/shared/diagramExport";

export function setupSvgExport(
  container: HTMLElement,
  svgContent: string,
): ExportInstance {
  return setupDiagramExport(container, async (theme) => {
    const bgColor = theme === "dark" ? DARK_BG : LIGHT_BG;
    const sanitized = sanitizeSvg(svgContent);

    let pngData: Uint8Array;
    try {
      pngData = await svgToPngBytes(sanitized, 2, bgColor);
    } catch (e) {
      console.warn("[svg-export] SVG→PNG conversion failed", e);
      return;
    }

    const filePath = await save({
      defaultPath: "image.png",
      filters: [{ name: "PNG Image", extensions: ["png"] }],
    });
    if (!filePath) return;

    try {
      await writeFile(filePath, pngData);
    } catch (e) {
      console.warn("[svg-export] failed to write file", e);
    }
  });
}
