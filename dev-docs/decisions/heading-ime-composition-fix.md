# Heading IME Composition Fix

**Date**: 2026-03-19
**Status**: Resolved
**Files**: `src/plugins/compositionGuard/tiptap.ts`, `src/plugins/compositionGuard/splitBlockFix.ts`

## The Problem

When typing Chinese (or other CJK) text via IME in a heading node (`<h1>`–`<h6>`) in VMark's WYSIWYG editor, accepting a multi-syllable composition (e.g., typing `zbqi` to produce 周期) causes the heading to split:

```
# zb qi          ← pinyin residue stays in heading
周期              ← composed text drops into a new paragraph
```

Single-character compositions (e.g., `zb` → 周) sometimes work because the browser handles them as inline replacements without splitting.

## Root Cause: WebKit Browser Bug

This is a **browser-level bug** in WebKit's contenteditable implementation, not a ProseMirror or Tiptap bug.

When accepting an IME candidate (typically by pressing Space), WebKit's native editing machinery interprets the input as requiring a block-level structural change. It fires DOM mutations that:

1. Split the heading into heading + paragraph (like `execCommand('insertParagraph')`)
2. Move the composed text into the new paragraph
3. Leave pinyin residue in the original heading

**Critical timing**: The structural DOM mutation (heading split) happens approximately **4ms BEFORE** the `compositionend` event fires. By the time JavaScript composition event handlers run, the DOM already has the wrong structure.

This bug is specific to **non-paragraph block elements**. Paragraphs don't exhibit it because splitting a paragraph into two paragraphs is the expected behavior.

## How Other Editors Handle This

| Editor | Approach |
|--------|----------|
| **ProseMirror core** | No heading fix. Has `fixUpBadSafariComposition` for an analogous table cell bug only |
| **Tiptap** | No fix |
| **CKEditor 5** | No fix — treats IME as "uncontrollable" in contenteditable |
| **Lexical (Meta)** | No heading-specific fix |
| **Slate.js** | No fix |
| **VS Code/Monaco** | Sidesteps entirely — uses hidden `<textarea>` instead of contenteditable |

**No editor in the ecosystem has a clean fix for this.** It is a niche WebKit bug that most editors either ignore or accept as a known limitation.

## What We Tried (and Why Each Failed)

### Attempt 1: Post-hoc repair via `requestAnimationFrame`

**Idea**: After `compositionend`, schedule a `requestAnimationFrame` callback to detect the heading→paragraph split and repair it by moving the composed text back into the heading.

**Implementation**: `splitBlockFix.ts` — detects the split pattern (heading followed by paragraph containing composed text), deletes the paragraph, cleans up pinyin residue in the heading, and inserts the composed text.

**Result**: Worked in `pnpm tauri dev` but **failed in release builds**.

**Why it failed**: The original implementation required exact pinyin text matching in the heading. By the time rAF fired, the browser had already modified the heading content. The pinyin match always failed silently.

### Attempt 2: Relaxed matching + retry loop

**Idea**: Remove the brittle pinyin matching, use structural detection instead (heading type check + ASCII scan for preedit residue), and retry across multiple animation frames.

**Result**: Worked in dev, **still failed in release builds**.

**Why it failed**: `requestAnimationFrame` timing is unpredictable across build optimization levels. In production WebView (faster execution), rAF fires before ProseMirror has processed the DOM mutations into its state model. The paragraph exists in the DOM but ProseMirror's `view.state` doesn't reflect it yet.

### Attempt 3: `appendTransaction` for synchronous detection

**Idea**: Use ProseMirror's `appendTransaction` plugin hook — it fires synchronously after every transaction, so it would catch the split transaction immediately with no timing dependency.

**Result**: `appendTransaction` detected the split correctly, but **couldn't fix it** because the composed text hadn't been inserted into the paragraph yet.

**Why it failed**: The browser splits the heading ~4ms **before** `compositionend` fires. `appendTransaction` runs immediately after the split transaction, at which point:
- The heading has been split ✓
- But the paragraph is **empty** — the composed text hasn't been inserted yet ✗
- `compositionend` hasn't fired yet, so `compositionData` still contains preedit text, not composed text ✗

### Attempt 4: `appendTransaction` detection + rAF repair

**Idea**: Use `appendTransaction` to set a `splitDetected` flag, then use the rAF callback (after `compositionend`) to do the actual repair when the composed text is available.

**Result**: Worked in dev, **still failed in release builds**.

**Why it failed**: Even with the split detected, the rAF callback reads `view.state` — ProseMirror's internal state model. In release builds, ProseMirror's `DOMObserver` hasn't flushed the composed text insertion from the DOM into its state by the time rAF fires. Adding `view.domObserver.flush()` didn't help because the browser may not have completed the text insertion into the DOM either.

### Attempt 5 (Final): Prevent the split via `filterTransaction` ✓

**Idea**: Instead of detecting and repairing the split after the fact, **prevent it from ever happening**. When ProseMirror creates a transaction to match the browser's heading split, reject it in `filterTransaction`. ProseMirror will then reset the DOM back to the original heading structure, and the composed text stays inline.

**Implementation**:

```typescript
filterTransaction(tr) {
  if (!isComposing) return true;
  // ... existing composition/history checks ...
  if (tr.docChanged) {
    // Reject heading splits during composition
    if (compositionStartPos !== null &&
        tr.before.childCount < tr.doc.childCount) {
      try {
        const $start = tr.before.resolve(compositionStartPos);
        if ($start.parent.type.name === "heading") {
          return false; // Reject the heading split
        }
      } catch { /* stale pos — allow */ }
    }
    return true;
  }
  return false;
}
```

**Detection logic**: During composition (`isComposing === true`), if a doc-changing transaction increases the document's block count AND the composition started in a heading, reject it.

**Result**: Works in both dev and release builds. The primary fix (`filterTransaction`) is synchronous with **no timing dependency**. A rAF fallback exists for edge cases but is not relied upon for heading splits.

**Why it works**: When `filterTransaction` returns `false`, ProseMirror discards the transaction and resets the DOM to match its current (pre-split) state. The heading is restored. The browser's subsequent composed text insertion goes into the heading (the only element there), exactly where it should be.

**Hybrid architecture**: The implementation has two layers:
1. **`filterTransaction` (primary, synchronous)** — prevents heading splits during composition. No timing dependency.
2. **rAF fallback with `splitBlockFix` (secondary, async)** — defensive cleanup for cases where `filterTransaction` doesn't prevent the split (shouldn't happen in practice). Uses snapshotted composition state to avoid corruption from rapid successive compositions.

## Why This Was So Stubborn

1. **Browser-level bug**: The root cause is in WebKit's contenteditable, not in our code. We can't fix the browser — only work around it.

2. **Timing sensitivity**: The browser splits the heading 4ms before `compositionend`. This sub-frame timing gap means any post-hoc detection/repair must account for an unpredictable sequence of DOM mutations, ProseMirror state flushes, and browser text insertions.

3. **Dev/release divergence**: Vite dev server adds HMR overhead that slows JavaScript execution, giving the browser and ProseMirror more time to process mutations before our callbacks fire. Production builds (minified, tree-shaken) run faster, exposing timing races that are invisible in dev.

4. **No ecosystem precedent**: No other editor has solved this, so there was no pattern to follow. We had to discover the `filterTransaction` prevention approach through trial and error.

## Key Insight

**Prevention beats repair.** Instead of letting the browser break the document structure and then trying to fix it (a race against unpredictable timing), we prevent the structural break from being committed to ProseMirror's state. The browser's DOM mutation is ephemeral — ProseMirror overwrites it — and the composed text lands in the correct location naturally.

## References

- [ProseMirror fixUpBadSafariComposition](https://github.com/ProseMirror/prosemirror-view/blob/master/src/domobserver.ts#L367) — analogous fix for table cells
- [WebKit Bug 43020](https://bugs.webkit.org/show_bug.cgi?id=43020) — IME composition event inconsistencies
- [ProseMirror Discussion: Composition overhaul](https://discuss.prosemirror.net/t/composition-overhaul/1923)
- [EditContext API](https://developer.chrome.com/blog/introducing-editcontext-api) — long-term solution (not yet in WebKit)
