/**
 * Source Peek CodeMirror Editor
 *
 * Creates and manages the CodeMirror editor instance for inline Source Peek.
 */

import { EditorState as CMState } from "@codemirror/state";
import { EditorView as CMView, keymap as cmKeymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown as markdownLang } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { syntaxHighlighting } from "@codemirror/language";
import { codeHighlightStyle } from "@/plugins/codemirror";

/** Track CodeMirror view for cleanup */
let currentCMView: CMView | null = null;

/**
 * Create CodeMirror editor element.
 */
export function createCodeMirrorEditor(
  markdown: string,
  onSave: () => void,
  onCancel: () => void,
  onUpdate: (markdown: string) => void
): HTMLElement {
  const container = document.createElement("div");
  container.className = "source-peek-inline-editor";

  const theme = CMView.theme({
    "&": {
      height: "100%",
    },
    ".cm-content": {
      fontFamily: "var(--font-mono, monospace)",
      fontSize: "13px",
      lineHeight: "1.5",
      padding: "0",
    },
    ".cm-line": {
      padding: "0",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "var(--selection-color, rgba(0, 122, 255, 0.2)) !important",
    },
  });

  const handleSave = () => {
    onSave();
    return true;
  };

  const handleCancel = () => {
    onCancel();
    return true;
  };

  const state = CMState.create({
    doc: markdown,
    extensions: [
      CMView.lineWrapping,
      history(),
      cmKeymap.of([
        { key: "Mod-Enter", run: handleSave },
        { key: "Escape", run: handleCancel },
        ...defaultKeymap,
        ...historyKeymap,
      ]),
      CMView.updateListener.of((update) => {
        if (update.docChanged) {
          onUpdate(update.state.doc.toString());
        }
      }),
      markdownLang({ codeLanguages: languages }),
      syntaxHighlighting(codeHighlightStyle, { fallback: true }),
      theme,
    ],
  });

  // Cleanup previous CM view
  if (currentCMView) {
    currentCMView.destroy();
  }

  const cmView = new CMView({
    state,
    parent: container,
  });

  currentCMView = cmView;

  // Focus after render
  requestAnimationFrame(() => {
    cmView.focus();
  });

  return container;
}

/**
 * Cleanup CodeMirror view.
 */
export function cleanupCMView(): void {
  if (currentCMView) {
    currentCMView.destroy();
    currentCMView = null;
  }
}
