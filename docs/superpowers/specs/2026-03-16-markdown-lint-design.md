# Markdown Lint — Design Spec

**Date:** 2026-03-17
**Status:** Final
**Branch:** `feat/markdown-lint`

## Overview

On-demand structural and syntax validator for markdown documents in VMark. User triggers validation via keyboard shortcut or menu. Results appear as gutter dots with subtle line highlights. A status bar badge shows the count and allows cycling through issues.

**Phase 1 scope:** Source mode only. WYSIWYG gets block-level gutter dots (no inline precision).

### What This Is

- Structural/syntax validator that catches **real rendering bugs**
- On-demand only — never runs automatically
- 13 rules with near-zero false positives
- Source mode: full inline precision. WYSIWYG: block-level indicators.

### What This Is Not

- Not a style formatter (line length, list markers, emphasis characters)
- Not real-time / as-you-type linting
- Not auto-fix (phase 2)
- Not a problems panel (overkill for on-demand use)

## Trigger

| Method | Binding | Menu ID | Rust Accelerator | Frontend Default |
|--------|---------|---------|-------------------|------------------|
| Keyboard shortcut | `Alt+Mod+V` | `check-markdown` | `Alt+CmdOrCtrl+V` | `Alt-Mod-v` |
| Menu item | View → Check Markdown | `check-markdown` | — | — |

**Navigation shortcuts** (cycle through diagnostics):

| Action | Binding | Menu ID | Rust Accelerator | Frontend Default |
|--------|---------|---------|-------------------|------------------|
| Next issue | `F2` | `lint-next` | `F2` | `F2` |
| Previous issue | `Shift+F2` | `lint-prev` | `Shift+F2` | `Shift-F2` |

`F2` / `Shift+F2` follows the VS Code convention for "Go to Next/Previous Problem". Both keys are currently unassigned in VMark.

Results persist until the next document-changing edit. Any `docChanged` transaction (ProseMirror) or document update (CodeMirror) clears stale diagnostics. Non-content keystrokes (arrow keys, modifier-only keys) do not clear them.

**Clean run feedback:** When lint finds zero issues, show a brief transient toast: "No issues found" (auto-dismisses after 2s). This avoids the no-op feeling of pressing a shortcut with no visible result.

## Rule Set

### Errors (red dot) — will render incorrectly or break

| ID | Rule | What It Catches |
|----|------|-----------------|
| E01 | `no-undefined-references` | `[text][broken-ref]` where definition doesn't exist — renders as literal brackets. Uses CommonMark label normalization (collapse whitespace, case-insensitive). |
| E02 | `table-column-count` | Row has more/fewer cells than header row — table rendering breaks in most parsers. Kept as error because VMark targets consistent rendering, not GFM edge-case tolerance. |
| E03 | `no-reversed-link-syntax` | `(text)[url]` instead of `[text](url)` — link completely lost |
| E04 | `no-missing-space-atx` | `#heading` without space after hash — won't render as heading. Only flags lines that start with 0-3 spaces + 1-6 `#` characters (ATX heading context per CommonMark spec). Does NOT flag `#hashtag` in running text. |
| E05 | `no-space-in-emphasis` | `** bold **` with spaces inside markers — CommonMark renders literal asterisks. Detection uses **source-text regex** on the raw markdown (not MDAST), because invalid emphasis does not produce `emphasis`/`strong` nodes in the tree. |
| E06 | `no-empty-link-text` | `[](url)` — invisible link, accessibility violation. Separate from empty href. |
| E07 | `no-duplicate-definitions` | Two `[ref]: url` with same label — first wins per CommonMark but intent is ambiguous. Uses CommonMark label normalization for comparison. |
| E08 | `unclosed-fenced-code` | Opening ` ``` ` or `~~~` fence with no matching close — rest of document becomes code. |

### Warnings (amber dot) — structural problems, accessibility

| ID | Rule | What It Catches |
|----|------|-----------------|
| W01 | `heading-increment` | Skipping heading levels (h1 → h3) — breaks outline + screen readers |
| W02 | `require-alt-text` | `![](image.png)` with empty alt — WCAG 1.1.1 violation |
| W03 | `no-unused-definitions` | `[ref]: url` that nothing references — dead code |
| W04 | `link-fragments` | `[text](#non-existent)` — anchor points nowhere. Uses `makeUniqueSlug()` from `src/utils/headingSlug.ts` to handle duplicate heading IDs correctly. |
| W05 | `no-empty-link-href` | `[text]()` — link with empty destination. Valid markdown but almost always a mistake. |

**Total: 13 rules** (8 errors + 5 warnings). All have near-zero false positives in production documents.

**Excluded categories:** Line length, trailing whitespace, list marker style, emphasis character choice, heading style, indentation, blank line counts — formatting opinions. `single-h1` and `fenced-code-language` deferred to phase 2 — policy rules, not rendering bugs.

**Edge case — empty documents:** Running lint on an empty document produces zero diagnostics. Shows clean-run toast.

## Architecture

### Lint Engine

Pure function with no editor dependency. Placed in `src/lib/lintEngine/` following the `cjkFormatter` precedent — both are pure-logic modules with no editor coupling.

```typescript
interface LintDiagnostic {
  id: string;               // Unique: `${ruleId}-${line}-${column}`
  ruleId: string;           // "E01", "W03", etc.
  severity: "error" | "warning";
  messageKey: string;       // i18n key: "lint.E01"
  messageParams: Record<string, string>;  // interpolation: { ref: "broken-ref" }
  line: number;             // 1-based line number
  column: number;           // 1-based column
  offset: number;           // 0-based character offset in source
  endOffset?: number;       // End of affected range (for inline highlights)
  uiHint: "exact" | "block" | "sourceOnly";  // How to render in WYSIWYG
}

function lintMarkdown(source: string): LintDiagnostic[]
```

**`uiHint` values:**
- `exact` — position maps reliably to WYSIWYG (headings, images, links)
- `block` — show gutter dot on the containing block, no inline highlight
- `sourceOnly` — cannot be shown in WYSIWYG; navigation jumps to Source mode at the exact range

### Parser Strategy

**Do NOT fork the parser.** Extract a shared processor from the existing pipeline:

```typescript
// src/utils/markdownPipeline/parser.ts — new export
export function createMarkdownProcessor(opts?: { forLint?: boolean }): Processor
```

When `forLint: true`:
- Uses the same plugin stack (GFM, math, frontmatter, custom inline, wiki-links, details, alerts)
- Skips `normalizeBareListMarkers` and other position-mutating transforms
- Returns MDAST with accurate `position` data on all nodes

This avoids parser divergence while preserving position accuracy for diagnostics.

**Source-text rules (E04, E05, E08):** These operate on the raw markdown string, not MDAST, because their patterns either don't produce AST nodes (invalid emphasis) or are line-level checks (ATX heading context, unclosed fences). They run before MDAST parsing or in parallel.

**No new npm dependencies for the engine.** The remark stack is already installed.

**Performance budget:** `lintMarkdown()` should complete in < 100ms for documents under 5,000 lines. The remark parse step is the bottleneck (~30-50ms for large docs). Rule visitors are O(n) tree walks.

### Store — `lintStore.ts`

```typescript
interface LintState {
  /** Keyed by tabId — diagnostics are per-tab */
  diagnosticsByTab: Record<string, LintDiagnostic[]>;
  /** Source hash to detect stale results */
  sourceHashByTab: Record<string, string>;
  selectedIndex: number;  // For prev/next navigation, wraps around
}

interface LintActions {
  runLint: (tabId: string, source: string) => void;
  clearDiagnostics: (tabId: string) => void;
  clearAllDiagnostics: () => void;
  selectNext: () => void;   // Wraps to first issue after last
  selectPrev: () => void;   // Wraps to last issue before first
}

// Selector for active tab diagnostics
function useActiveLintDiagnostics(): LintDiagnostic[]
```

Zustand store, no persistence (diagnostics are ephemeral). Diagnostics scoped by `tabId` — switching tabs shows that tab's diagnostics (or none). No `running` state — lint is synchronous and fast.

### Data Flow

```
User triggers (Alt+Mod+V or menu)
  → get active tabId from tabStore
  → Source mode: read CM editor content directly
    WYSIWYG mode: serialize PM doc via markdownPipeline serializer
  → lintMarkdown(source) synchronously
  → store results keyed by tabId in lintStore
  → editor plugin reads store, creates decorations
  → status bar reads store, shows count badge
```

### Editor Integration

**Source Mode (CodeMirror) — full precision:**
- New dependency: `@codemirror/lint` (pin to `^6.8.0`)
- CodeMirror lint extension reads `lintStore` diagnostics for active tab
- Positions map 1:1 (markdown source = editor content)
- Uses CM's built-in gutter markers + hover tooltips

**WYSIWYG Mode (ProseMirror) — block-level only:**
- ProseMirror plugin (same pattern as `cjkLetterSpacing`)
- For `uiHint: "exact"` diagnostics: map to PM position using block-level anchoring (find the block node at the diagnostic's line number via the serialized markdown's line → PM node correspondence)
- For `uiHint: "block"`: gutter dot on the containing block, faint line highlight, hover tooltip
- For `uiHint: "sourceOnly"`: NOT shown in WYSIWYG. Navigation (F2) for these diagnostics switches to Source mode and scrolls to the exact position.
- **No fake inline precision.** If a diagnostic can't be placed exactly, it anchors to the block.

**Badge count is always the TOTAL count** (including `sourceOnly` diagnostics). This ensures the badge truthfully represents all issues. The tooltip on `sourceOnly` diagnostics in WYSIWYG says "Switch to Source mode to see this issue."

**Tab switching:** Decorations and badge update from `diagnosticsByTab[activeTabId]`. Switching to a tab with no results shows no badge.

## UX Specification

### Visual Indicators

**Gutter dot:**
- Small colored circle in the gutter area of the affected line
- Error: `var(--error-color)` (red)
- Warning: `var(--warning-color)` (amber)
- Size: 6px diameter

**Line highlight:**
- Faint background tint on the entire line
- Error: `color-mix(in srgb, var(--error-color) 4%, transparent)`
- Warning: `color-mix(in srgb, var(--warning-color) 6%, transparent)`

**Hover tooltip:**
- Appears on hover over gutter dot or highlighted line
- Shows: localized rule message + rule ID
- Example: `"Heading level skipped: h1 to h3  [W01]"`
- Styled as a standard VMark popup (shared popup surface from `popup-shared.css`)

### Status Bar

- **Clean state:** Nothing shown — zero chrome when no issues
- **Issues found:** Badge appears: `⚠ 3` (count of total diagnostics)
  - Amber if warnings only
  - Red if any errors present
- **Click badge:** Jump to next issue in the document. Wraps from last issue back to first.
- **Navigation shortcuts:** `F2` (next issue), `Shift+F2` (prev issue). Also wraps around.
- **`sourceOnly` navigation:** When F2 lands on a `sourceOnly` diagnostic in WYSIWYG mode, auto-switch to Source mode and scroll to the position.

### Dismissal

- Any document-changing edit (`docChanged` transaction in ProseMirror, document update in CodeMirror) clears diagnostics for that tab
- Non-content keystrokes (arrow keys, Escape, modifier-only) do NOT clear diagnostics
- User re-runs `Alt+Mod+V` to re-check after editing

### Settings

In Settings → Markdown section (alongside existing markdown settings):

- **Markdown Validation:** toggle (default: on)
  - "On" means the shortcut and menu item are available
  - "Off" disables the feature entirely — shortcut is no-op, menu item is grayed out (disabled, not removed — avoids expensive native menu rebuild)
- No per-rule toggles in phase 1 — all 13 rules always run

### Dark Theme

All colors use existing CSS custom properties:
- `--error-color` / `--warning-color` for dots
- Line highlights use `color-mix()` as specified above (safe in Tauri webview)
- Tooltip uses `--popup-shadow`, `--bg-color`, `--border-color`

## i18n

All user-facing strings use translation keys. No hardcoded English.

### React-side lint messages (`src/locales/en/editor.json`)

```json
{
  "lint.E01": "Undefined reference: [{{ref}}] has no matching definition",
  "lint.E02": "Table column count mismatch: expected {{expected}}, found {{found}}",
  "lint.E03": "Reversed link syntax: use [text](url), not (text)[url]",
  "lint.E04": "Missing space after heading marker: add a space after #",
  "lint.E05": "Spaces inside emphasis markers won't render as formatted text",
  "lint.E06": "Empty link text: link is invisible to readers",
  "lint.E07": "Duplicate definition: [{{ref}}] defined multiple times",
  "lint.E08": "Unclosed code fence: rest of document will render as code",
  "lint.W01": "Heading level skipped: h{{from}} to h{{to}}",
  "lint.W02": "Missing image alt text (accessibility)",
  "lint.W03": "Unused definition: [{{ref}}] is never referenced",
  "lint.W04": "Broken anchor: #{{anchor}} does not match any heading",
  "lint.W05": "Empty link destination",
  "lint.sourceOnly": "Switch to Source mode to see this issue"
}
```

### React-side badge/toast (`src/locales/en/statusbar.json`)

```json
{
  "lint.badge.tooltip": "{{count}} markdown issue(s) — click to navigate",
  "lint.clean": "No issues found"
}
```

### Rust-side keys (`src-tauri/locales/en.yml`)

```yaml
view:
  checkMarkdown: "Check Markdown"
  lintNext: "Next Issue"
  lintPrev: "Previous Issue"
```

### Settings keys (`src/locales/en/settings.json`)

```json
{
  "markdown.lintEnabled": "Markdown Validation",
  "markdown.lintEnabled.description": "Enable on-demand structural and syntax checking"
}
```

Translations for all 9 non-English languages will be added to the corresponding locale files.

## Menu Integration

### SF Symbol icons

| Menu ID | SF Symbol |
|---------|-----------|
| `check-markdown` | `"checkmark.circle"` |
| `lint-next` | `"chevron.down"` |
| `lint-prev` | `"chevron.up"` |

Added to `MENU_ICONS` array in `src-tauri/src/macos_menu.rs`.

### Event handling

Menu events are handled via **both** `useViewShortcuts.ts` (keyboard) and `useViewMenuEvents.ts` (native menu `menu:check-markdown` / `menu:lint-next` / `menu:lint-prev` events). Both call the same `lintStore` actions.

## File Structure

```
src/
  lib/
    lintEngine/                 — Pure-logic module (follows cjkFormatter precedent)
      index.ts                  — barrel export
      linter.ts                 — lintMarkdown() orchestrator
      types.ts                  — LintDiagnostic, uiHint types
      rules/
        index.ts                — rule registry
        noUndefinedRefs.ts      — E01 (MDAST)
        tableColumnCount.ts     — E02 (MDAST)
        noReversedLink.ts       — E03 (source-text regex)
        noMissingSpaceAtx.ts    — E04 (source-text regex, ATX context)
        noSpaceInEmphasis.ts    — E05 (source-text regex)
        noEmptyLinkText.ts      — E06 (MDAST)
        noDuplicateDefs.ts      — E07 (MDAST)
        unclosedFencedCode.ts   — E08 (source-text line scan)
        headingIncrement.ts     — W01 (MDAST)
        requireAltText.ts       — W02 (MDAST)
        noUnusedDefs.ts         — W03 (MDAST)
        linkFragments.ts        — W04 (MDAST + headingSlug)
        noEmptyLinkHref.ts      — W05 (MDAST)
  stores/
    lintStore.ts                — Zustand store, tab-scoped (new)
  plugins/
    lint/
      index.ts                  — ProseMirror plugin (WYSIWYG block-level decorations)
      lint.css                  — Gutter dot + line highlight styles
      tiptap.ts                 — Tiptap extension wrapper
    codemirror/
      sourceLint.ts             — CodeMirror lint extension (new, follows source* naming)
  components/
    StatusBar/
      LintBadge.tsx             — Status bar badge component (new)
```

### Files Modified

| File | Change |
|------|--------|
| `src/stores/settingsTypes.ts` | Add `lintEnabled: boolean` to `MarkdownSettings` |
| `src/stores/settingsStore.ts` | Initialize lint setting default |
| `src/components/StatusBar/StatusBarRight.tsx` | Add `LintBadge` component |
| `src/plugins/codemirror/index.ts` | Export source lint plugin |
| `src/utils/sourceEditorExtensions.ts` | Add CM lint extension |
| `src/utils/markdownPipeline/parser.ts` | Export `createMarkdownProcessor({ forLint })` |
| `src-tauri/src/menu/localized.rs` | Add "Check Markdown", "Next Issue", "Previous Issue" menu items |
| `src-tauri/src/macos_menu.rs` | Add SF Symbol icons for new menu items |
| `src/stores/shortcutsStore.ts` | Add `validateMarkdown`, `lintNext`, `lintPrev` shortcuts with `menuId`s |
| `src/hooks/useViewShortcuts.ts` | Add lint trigger + navigation handlers |
| `src/hooks/useViewMenuEvents.ts` | Add lint menu event handlers |
| `src-tauri/locales/en.yml` | Add menu label keys |
| `src/locales/en/editor.json` | Add lint message keys |
| `src/locales/en/statusbar.json` | Add badge/toast keys |
| `src/locales/en/settings.json` | Add lint settings keys |
| `website/guide/shortcuts.md` | Document new shortcuts |
| `package.json` | Add `@codemirror/lint` dependency |

## New Dependency

| Package | Version | Purpose | Size |
|---------|---------|---------|------|
| `@codemirror/lint` | `^6.8.0` | CM6 lint infrastructure (gutter, tooltips) | ~8KB gzip |

## Testing Strategy

- **Lint engine rules:** Table-driven tests per rule — input markdown → expected diagnostics. ~10 test cases per rule × 13 rules = ~130 tests. Include edge cases: empty documents, frontmatter-only, mixed CJK content, nested structures, documents with only custom nodes.
- **Source-text rules (E03-E05, E08):** Test against raw markdown strings, verify positions are accurate.
- **Store:** Tab-scoped state transitions — runLint per tab, clearDiagnostics per tab, selectNext/selectPrev wrap-around, tab switching behavior.
- **ProseMirror plugin:** Block-level decoration creation from mock diagnostics. Verify `sourceOnly` diagnostics are excluded.
- **CodeMirror integration:** Diagnostic-to-CM-position mapping, gutter markers.
- **Shortcut + menu integration:** Verify both paths trigger lint via useViewShortcuts and useViewMenuEvents tests.
- **Cross-mode navigation:** F2 on `sourceOnly` diagnostic triggers mode switch.

## Implementation Order

1. **Lint engine + rules** — pure functions, exhaustive table-driven tests. Fastest to build and verify.
2. **Source mode integration** — CodeMirror diagnostics, badge, F2 navigation. Delivers real user value.
3. **Tab scoping + menu wiring** — lintStore with tabId, menu event handlers, settings toggle.
4. **WYSIWYG integration** — block-level decorations, `sourceOnly` fallback navigation.
5. **i18n** — add all locale keys across 10 languages.

## Phase 2 (Future)

- Auto-fix for fixable rules (E03, E04, E05 are candidates)
- "Fix" button in hover tooltip
- Optional problems panel for power users
- Per-rule enable/disable in settings
- `single-h1`, `fenced-code-language` rules (policy, not rendering)
- Footnote-related rules (undefined, duplicate, unused)
- Custom rules API
- WYSIWYG inline precision via ProseMirror source-line metadata
