# Audit: Components + Styles

**Scope:** `src/components/`, `src/styles/`
**Files scanned:** ~110 (TSX, TS, CSS)
**Findings:** 9

---

## Critical (must fix)

_None found._

---

## Warning (should fix)

### [W1] Zustand store destructured without selectors — ImageContextMenu

- **File:** `src/components/Editor/ImageContextMenu.tsx:46`
- **Issue:** `const { isOpen, position, closeMenu } = useImageContextMenuStore()` — full store destructure with no selector. Directly violates AGENTS.md: "Do not destructure Zustand stores in components; use selectors."
- **Fix:** Replace with three selector calls.

### [W2] `getState()` called during render — stale provider name display

- **File:** `src/components/GeniePicker/GeniePicker.tsx:379`
- **Issue:** `useAiProviderStore.getState().getActiveProviderName()` is called in JSX render, not inside a callback. Bypasses React subscriptions — button label stays stale until unrelated re-render. AGENTS.md says "Prefer `useXStore.getState()` inside callbacks."
- **Fix:** Derive `activeProviderName` from a selector instead.

### [W3] Dark hover in heading-picker uses bare rgba instead of `--hover-bg-dark`

- **File:** `src/components/Editor/heading-picker.css:117-119`
- **Issue:** Uses `rgba(255, 255, 255, 0.06)` instead of `var(--hover-bg-dark)` token (defined as `rgba(255, 255, 255, 0.08)`). Bypasses token system with non-standard opacity.
- **Fix:** Use `var(--hover-bg-dark)`.

### [W4] Toolbar dropdown shadow hardcoded — no token, no dark mode override

- **File:** `src/components/Editor/UniversalToolbar/universal-toolbar.css:174`
- **Issue:** `box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15)` — raw value instead of `--popup-shadow`. No `.dark-theme` override for `--popup-shadow-dark`.
- **Fix:** Use `var(--popup-shadow)` and add dark theme override.

### [W5] Missing `:focus-visible` indicators on multiple button groups

| File | Selectors missing focus |
|------|------------------------|
| `src/components/Sidebar/Sidebar.css:39` | `.sidebar-btn` |
| `src/components/Sidebar/FileExplorer/FileExplorer.css:34` | `.file-explorer-btn` |
| `src/components/FindBar/FindBar.css:120` | `.find-bar-nav-btn`, `.find-bar-toggle`, `.find-bar-close`, `.find-bar-icon-btn` |
| `src/components/StatusBar/StatusBar.css:311` | `.status-new-tab` |
| `src/components/StatusBar/StatusBar.css:54` | `.status-toggle`, `.status-mode`, `.status-mcp`, `.status-terminal` |

- **Issue:** Buttons have `:hover` but no keyboard focus indicator. Violates WCAG and `.claude/rules/33-focus-indicators.md`.
- **Fix:** Apply the U-shaped underline pattern from `33-focus-indicators.md`.

### [W6] Dark theme divergent border uses duplicate bare rgba value

- **File:** `src/components/StatusBar/StatusBar.css:131-133` and `262-264`
- **Issue:** `rgba(0, 136, 255, 0.25)` appears identically in two `.dark-theme` overrides. Light mode correctly uses `--selection-color` token; dark variants bypass the token system.
- **Fix:** Define `--selection-color-dark` token or a local custom property.

---

## Info (consider)

### [I1] `editor.css` exceeds 300-line guideline at 1,213 lines

- **File:** `src/components/Editor/editor.css`
- **Note:** Combines WYSIWYG base, source editor, and full GitHub syntax highlighting for two highlighters (light + dark). Consider extracting `editor-syntax.css` (~350 lines of `cm-hl-*` and `hljs-*` rules).

### [I2] `dangerouslySetInnerHTML` for static SVG icons — not an XSS risk

- **Files:** `ToolbarButton.tsx:76`, `GroupDropdown.tsx:257`, `UniversalToolbar.tsx:483`
- **Note:** All inject SVG from static `src/utils/icons.tsx`. No user content involved. Acceptable pattern.

### [I3] Syntax highlight hex colors hardcoded by necessity

- **File:** `src/components/Editor/editor.css:882-1157`
- **Note:** GitHub syntax palette cannot be tokenized. Both light/dark variants correctly scoped. No action needed.

---

## Summary

- **Critical:** 0
- **Warning:** 6
- **Info:** 3
- **Healthiest areas:** Terminal components (correct focus indicators, clean store usage), UniversalToolbar (correct ARIA, selector-based reads, roving tabindex), GeniePicker CSS (correct token usage), SourceEditor (no anti-patterns, careful timer cleanup).
- **Most concerning areas:** Focus indicators missing across Sidebar, FindBar, and StatusBar buttons (W5 — affects all keyboard users). ImageContextMenu Zustand destructuring (W1) directly violates working agreement.
