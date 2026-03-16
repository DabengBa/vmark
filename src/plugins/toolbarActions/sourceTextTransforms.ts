/**
 * Source Text Transforms
 *
 * Line operations and text case transformations for source (CodeMirror) mode.
 * Extracted from sourceAdapter.ts to keep files under ~300 lines.
 *
 * @coordinates-with sourceAdapter.ts — main dispatcher imports these handlers
 * @module plugins/toolbarActions/sourceTextTransforms
 */

import type { EditorView } from "@codemirror/view";
import {
  toUpperCase,
  toLowerCase,
  toTitleCase,
  toggleCase,
  removeBlankLines,
  moveLinesUp,
  moveLinesDown,
  duplicateLines,
  deleteLines,
  joinLines,
  sortLinesAscending,
  sortLinesDescending,
} from "@/utils/textTransformations";

// --- Line operations ---

/** Moves the current line (or selected lines) up by one position in source mode. */
export function handleMoveLineUp(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const result = moveLinesUp(text, from, to);

  if (!result) return false;

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newFrom, head: result.newTo },
  });
  view.focus();
  return true;
}

/** Moves the current line (or selected lines) down by one position in source mode. */
export function handleMoveLineDown(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const result = moveLinesDown(text, from, to);

  if (!result) return false;

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newFrom, head: result.newTo },
  });
  view.focus();
  return true;
}

/** Duplicates the current line (or selected lines) below the original in source mode. */
export function handleDuplicateLine(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const result = duplicateLines(text, from, to);

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newFrom, head: result.newTo },
  });
  view.focus();
  return true;
}

/** Deletes the current line (or selected lines) in source mode. */
export function handleDeleteLine(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const result = deleteLines(text, from, to);

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newCursor },
  });
  view.focus();
  return true;
}

/** Joins the current line with the next line (or all selected lines) in source mode. */
export function handleJoinLines(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const result = joinLines(text, from, to);

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newFrom, head: result.newTo },
  });
  view.focus();
  return true;
}

/** Sorts selected lines in ascending alphabetical order in source mode. */
export function handleSortLinesAsc(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const result = sortLinesAscending(text, from, to);

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newFrom, head: result.newTo },
  });
  view.focus();
  return true;
}

/** Sorts selected lines in descending alphabetical order in source mode. */
export function handleSortLinesDesc(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;
  const text = view.state.doc.toString();
  const result = sortLinesDescending(text, from, to);

  view.dispatch({
    changes: { from: 0, to: text.length, insert: result.newText },
    selection: { anchor: result.newFrom, head: result.newTo },
  });
  view.focus();
  return true;
}

/** Removes blank lines from the selected text in source mode. Requires a selection. */
export function handleRemoveBlankLines(view: EditorView): boolean {
  const { from, to } = view.state.selection.main;

  if (from === to) {
    return false; // No selection
  }

  const selectedText = view.state.doc.sliceString(from, to);
  const transformed = removeBlankLines(selectedText);

  if (transformed === selectedText) {
    return true; // No change needed
  }

  view.dispatch({
    changes: { from, to, insert: transformed },
    selection: { anchor: from, head: from + transformed.length },
  });
  view.focus();
  return true;
}

// --- Text transformations ---

/** Applies a text case transformation function to the selected text in source mode. */
export function handleTransformCase(view: EditorView, transform: (text: string) => string): boolean {
  const { from, to } = view.state.selection.main;

  if (from === to) {
    return false; // No selection
  }

  const selectedText = view.state.doc.sliceString(from, to);
  const transformed = transform(selectedText);

  if (transformed === selectedText) {
    return true; // No change needed
  }

  view.dispatch({
    changes: { from, to, insert: transformed },
    selection: { anchor: from, head: from + transformed.length },
  });
  view.focus();
  return true;
}

// Re-export transform functions for use in the dispatcher switch
export { toUpperCase, toLowerCase, toTitleCase, toggleCase };
