# Audit: Stores

**Scope:** `src/stores/`
**Files scanned:** 33 source files (excluding 16 test files)
**Findings:** 13

---

## Critical (must fix)

### [C1] v0->v1 migration in `aiProviderStore.ts` wipes user API keys

- **File:** `src/stores/aiProviderStore.ts:257-259`
- **Issue:** The `migrate()` function for version < 1 explicitly sets `apiKey: ""` for all existing REST providers, even when the persisted provider already has a user-configured key. The `...existing` spread places the old key in the object, but it is then immediately overwritten by the literal `apiKey: ""`. The in-code comment claims to "preserve user overrides" but the code does the opposite. The store is now at `version: 2`, so this code path no longer fires — but the dead code preserves the incorrect comment.
- **Fix:** Remove the v0->v1 branch entirely (it cannot fire for any user already at v2+), or correct it to preserve the existing key: `{ ...def, ...existing }`.

---

## Warning (should fix)

### [W1] Three store files exceed the ~300-line guideline

| File | Lines |
|---|---|
| `src/stores/settingsStore.ts` | 521 |
| `src/stores/shortcutsStore.ts` | 465 |
| `src/stores/tabStore.ts` | 445 |

- **Fix:** Extract type definitions and large constant arrays into adjacent files.

### [W2] Bare `console.error` / `console.warn` used instead of debug loggers

- **Files:** `aiProviderStore.ts:163,217`, `geniesStore.ts:106,126`, `recentFilesStore.ts:42`, `recentWorkspacesStore.ts:40`, `shortcutsStore.ts:400`
- **Issue:** Codebase convention requires named debug loggers from `src/utils/debug.ts` instead of bare `console.*` calls. Bare calls are not tree-shaken in production.
- **Fix:** Add named loggers (`aiProviderLog`, `geniesLog`, etc.) to `debug.ts`.

### [W3] `setActiveProvider` and `activateProvider` are identical dead duplicates

- **File:** `src/stores/aiProviderStore.ts:185-191`
- **Issue:** Both actions have identical implementations. All call sites use only `activateProvider`. `setActiveProvider` is dead code.
- **Fix:** Remove `setActiveProvider` from interface and implementation.

### [W4] Three stores use bare `localStorage` without SSR guard

- **Files:** `aiProviderStore.ts:234`, `geniesStore.ts:192`, `promptHistoryStore.ts:58`
- **Issue:** `settingsStore.ts` and `shortcutsStore.ts` guard `localStorage` access with `typeof window !== "undefined"`. These three stores don't — inconsistency that will cause errors in Node.js test contexts.
- **Fix:** Apply the same guard pattern.

### [W5] `shortcutsStore.ts` uses template literal on unknown error

- **File:** `src/stores/shortcutsStore.ts:343`
- **Issue:** Uses `` `Parse error: ${e}` `` instead of the required `e instanceof Error ? e.message : String(e)` pattern.

### [W6] `featureFlagsStore.ts` stale comment contradicts production value

- **File:** `src/stores/featureFlagsStore.ts:26-28`
- **Issue:** Comment says "Phase 4: Enable in dev only for testing" but value is unconditionally `true`. Feature is already in production.
- **Fix:** Update comment or remove the flag entirely if stable.

### [W7] Local `AnchorRect` duplication instead of shared import

- **Files:** `src/stores/linkPopupStore.ts:13-18`, `src/stores/imagePasteToastStore.ts:20-25`
- **Issue:** Both define local `AnchorRect` interfaces identical to `@/utils/popupPosition`. Other popup stores correctly import the shared type.
- **Fix:** Replace with `import type { AnchorRect } from "@/utils/popupPosition"`.

---

## Info (consider)

### [I1] `editorStore.ts` documented as legacy but still actively used

- **File:** `src/stores/editorStore.ts:8-12`
- **Issue:** Contains per-document fields (`content`, `savedContent`, `filePath`, `isDirty`, `cursorInfo`) that are fully superseded by `documentStore.ts`. Creates confusion about source of truth.
- **Fix:** Audit call sites and remove redundant fields.

### [I2] `featureFlagsStore.ts` naming is misleading — not a Zustand store

- **File:** `src/stores/featureFlagsStore.ts`
- **Issue:** Exports a plain `const` object, not a Zustand store. The `Store` suffix is misleading.
- **Fix:** Rename to `featureFlags.ts` or move to `src/utils/`.

### [I3] Module-level mutable singletons in `aiSuggestionStore.ts` complicate testing

- **File:** `src/stores/aiSuggestionStore.ts:89,295-296`
- **Issue:** `suggestionCounter`, `_tabWatcherInitialized`, `_prevActiveTabIds` persist across test runs.
- **Fix:** Add a `resetAiSuggestionStore()` function for test cleanup.

### [I4] `terminalSessionStore.ts` — inconsistent indentation in store body

- **File:** `src/stores/terminalSessionStore.ts:77-134`
- **Issue:** Mixed indentation levels from refactor. Minor formatting inconsistency.

### [I5] `aiProviderStore.ts` `onRehydrateStorage` fires async without error boundary

- **File:** `src/stores/aiProviderStore.ts:239-246`
- **Issue:** Calls async functions without `await` or `.catch()`. Both functions have internal try/catch so risk is low.
- **Fix:** Add `void fn().catch()` for defensive safety.

---

## Summary

- **Critical:** 1
- **Warning:** 7
- **Info:** 5
- **Healthiest areas:** Small popup stores (mathPopupStore, wikiLinkPopupStore, geniePickerStore, dropZoneStore) — clean and focused. `documentStore.ts` demonstrates the `updateDoc()` guard pattern perfectly. `unifiedHistoryStore.ts` has solid concurrency design.
- **Most concerning areas:** `aiProviderStore.ts` has three independent issues. `settingsStore.ts` and `shortcutsStore.ts` both exceed 300 lines. Seven stores use bare `console.*` calls against convention.
