/**
 * WYSIWYG Flush Registry
 *
 * Purpose: Allows non-WYSIWYG code to trigger an immediate WYSIWYG-to-markdown
 * flush without importing the WYSIWYG module directly.
 */

type WysiwygFlusher = () => void;

let activeWysiwygFlusher: WysiwygFlusher | null = null;

/** Register (or unregister with null) the active WYSIWYG flusher callback. */
export function registerActiveWysiwygFlusher(flusher: WysiwygFlusher | null) {
  activeWysiwygFlusher = flusher;
}

/** Immediately invoke the registered WYSIWYG flusher, if any. */
export function flushActiveWysiwygNow() {
  activeWysiwygFlusher?.();
}
