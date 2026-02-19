/**
 * Smart Paste Plugin for CodeMirror
 *
 * Purpose: Enhances paste behavior in Source mode — auto-creates markdown links when
 * pasting URLs over selected text, and handles image path/URL pasting with asset copying.
 *
 * Pipeline: paste event -> detect content type -> URL over selection -> [text](url)
 *         -> image path -> copy to assets -> insert ![](relative-path)
 *         -> markdown content -> clean and insert
 *
 * Key decisions:
 *   - Supports multi-image paste (multiple paths from Finder)
 *   - Uses the image paste toast for user confirmation on ambiguous pastes
 *   - Markdown content from other apps is cleaned before insertion
 *   - URL detection uses clipboard metadata, not just text heuristics
 *
 * @coordinates-with smartPaste/tiptap.ts — WYSIWYG counterpart
 * @coordinates-with smartPasteUtils.ts — shared utilities
 * @coordinates-with smartPasteImage.ts — image paste handling
 * @coordinates-with utils/imagePathDetection.ts — image URL/path detection
 * @coordinates-with stores/imagePasteToastStore.ts — toast UI for image paste confirmation
 * @module plugins/codemirror/smartPaste
 */

import { EditorView } from "@codemirror/view";
import { cleanPastedMarkdown } from "@/utils/cleanPastedMarkdown";
import { isValidUrl } from "./smartPasteUtils";
import { tryImagePaste } from "./smartPasteImage";

/**
 * Creates an extension that intercepts paste events
 * and converts URL paste on selection to markdown links,
 * and prompts for image URL/path pasting.
 */
export function createSmartPastePlugin() {
  return EditorView.domEventHandlers({
    paste: (event, view) => {
      const pastedText = event.clipboardData?.getData("text/plain");
      if (!pastedText) return false;

      const { from, to } = view.state.selection.main;
      const trimmedText = pastedText.trim();

      // First, check for image path/URL (works with or without selection)
      // Pass the original text for fallback paste (preserves whitespace)
      if (tryImagePaste(view, pastedText)) {
        event.preventDefault();
        return true;
      }

      // Clean AI-clipboard artifacts (escaped pipes, <br> in tables) from pasted markdown
      const cleaned = cleanPastedMarkdown(pastedText);
      if (cleaned !== pastedText) {
        event.preventDefault();
        view.dispatch({
          changes: { from, to, insert: cleaned },
          selection: { anchor: from + cleaned.length },
        });
        return true;
      }

      // No selection - let default paste handle it
      if (from === to) return false;

      // Not a URL - let default paste handle it
      if (!isValidUrl(trimmedText)) return false;

      // Get selected text
      const selectedText = view.state.doc.sliceString(from, to);

      // Don't wrap if selected text already looks like a markdown link
      if (/^\[.*\]\(.*\)$/.test(selectedText)) return false;

      // Create markdown link
      const linkMarkdown = `[${selectedText}](${trimmedText})`;

      // Prevent default paste and insert link
      event.preventDefault();
      view.dispatch({
        changes: { from, to, insert: linkMarkdown },
        selection: { anchor: from + linkMarkdown.length },
      });

      return true;
    },
  });
}
