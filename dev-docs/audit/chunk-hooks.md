# Audit: Hooks

**Scope:** `src/hooks/` and `src/hooks/mcpBridge/`
**Files scanned:** ~95 source files (excluding test files)
**Findings:** 12

---

## Critical (must fix)

### [C1] Bare `console.log` in production paths — `useFileOperations.ts`

- **File:** `src/hooks/useFileOperations.ts` — lines 92, 106, 313, 329, 348, 355, 360, 563, 686
- **Issue:** Nine bare `console.log` calls in production code paths (save dialog, shortcuts, menu events). Not gated by `import.meta.env.DEV`. Violates `50-codebase-conventions.md` §9.
- **Fix:** Add `fileOpsLog` to `src/utils/debug.ts` and replace all calls.

### [C2] Bare `console.log` in production path — `useMcpAutoStart.ts`

- **File:** `src/hooks/useMcpAutoStart.ts` — line 40
- **Issue:** `console.log("[MCP] Auto-started MCP bridge on port", mcpServer.port)` fires unconditionally on every app launch when `autoStart` is enabled.
- **Fix:** Add named logger or use existing `mcpLog`.

### [C3] Bare `console.log` in retry path — `useUpdateChecker.ts`

- **File:** `src/hooks/useUpdateChecker.ts` — lines 159-163, 169
- **Issue:** Two `console.log` calls in update retry logic fire unconditionally in production.
- **Fix:** Add `updateCheckerLog` to `debug.ts`.

---

## Warning (should fix)

### [W1] File size violations — MCP bridge handler files

| File | Lines |
|---|---|
| `src/hooks/mcpBridge/mutationHandlers.ts` | 774 |
| `src/hooks/mcpBridge/structureHandlers.ts` | 750 |
| `src/hooks/mcpBridge/batchOpHandlers.ts` | 660 |
| `src/hooks/mcpBridge/suggestionHandlers.ts` | 594 |
| `src/hooks/mcpBridge/index.ts` | 569 |
| `src/hooks/mcpBridge/sectionHandlers.ts` | 564 |
| `src/hooks/mcpBridge/workspaceHandlers.ts` | 416 |
| `src/hooks/mcpBridge/vmarkHandlers.ts` | 303 |

- **Fix:** Split by sub-domain. `mutationHandlers.ts` handles `batch_edit`, `apply_diff`, `replace_anchored` — each could be its own file.

### [W2] File size violations — hook files

| File | Lines |
|---|---|
| `src/hooks/useFileOperations.ts` | 701 |
| `src/hooks/useUnifiedMenuCommands.ts` | 394 |
| `src/hooks/useTiptapFormatCommands.ts` | 391 |
| `src/hooks/useExternalFileChanges.ts` | 383 |
| `src/hooks/useTabDragOut.ts` | 338 |
| `src/hooks/useSourceMenuCommands.ts` | 329 |
| `src/hooks/useUpdateChecker.ts` | 326 |

- **Fix:** `useFileOperations.ts` could split into `useFileSave.ts`, `useFileOpen.ts`, `useFileShortcuts.ts`.

### [W3] Inconsistent async listener cleanup — `useGenieShortcuts.ts`

- **File:** `src/hooks/useGenieShortcuts.ts` — lines 102-104, 112-114, 124-126
- **Issue:** Uses inline `.then(fn => fn()).catch(() => {})` instead of project utility `safeUnlistenAsync()`.
- **Fix:** Replace with `safeUnlistenAsync(unlisten)`.

### [W4] Zustand action selectors called at render level — `useUpdateSync.ts`

- **File:** `src/hooks/useUpdateSync.ts` — lines 70-73
- **Issue:** Subscribes to action functions at top of hook, then references them in `useEffect` deps. Project prefers `useXStore.getState().action()` inside callbacks.
- **Fix:** Use `getState()` inside the listener callback.

### [W5] Listener registered without mounted guard — `useGenieShortcuts.ts`

- **File:** `src/hooks/useGenieShortcuts.ts` — lines 77-105
- **Issue:** If component unmounts before `listen()` Promise resolves, listener fires on unmounted component. Other hooks use a `mounted` flag guard.
- **Fix:** Add `let mounted = true` guard matching `useMcpBridge.ts` pattern.

---

## Info (consider)

### [I1] `useDisableContextMenu.ts` is a no-op — consider removing

- **File:** `src/hooks/useDisableContextMenu.ts`
- **Issue:** Empty function body. Dead code if not called.
- **Fix:** Verify with grep. Delete if unused.

### [I2] `useOutlineSync.ts` and `useSourceOutlineSync.ts` share nearly identical logic

- **Files:** `src/hooks/useOutlineSync.ts`, `src/hooks/useSourceOutlineSync.ts`
- **Issue:** Both implement identical two-effect pattern for outline scroll + cursor tracking. One targets ProseMirror, the other CodeMirror.
- **Fix:** Extract shared scaffolding into a generic utility.

### [I3] `useUpdateChecker.ts` — 10 `useEffect` calls in one hook

- **File:** `src/hooks/useUpdateChecker.ts`
- **Issue:** Ten separate effects make control flow hard to follow.
- **Fix:** Extract `useUpdateListeners` and `useUpdateAutoCheck` as sub-hooks.

### [I4] MCP bridge handlers access `args` with unchecked casts

- **File:** Multiple handler files (e.g., `paragraphHandlers.ts:137`)
- **Issue:** Many handlers cast `args.xxx as SomeType` without runtime validation. Malformed MCP requests produce confusing internal errors instead of helpful validation messages.
- **Fix:** Add small `assertString`/`assertNumber` helpers for critical fields.

---

## Summary

- **Critical:** 3 (all bare `console.log` in production paths)
- **Warning:** 5 (file size is the most widespread issue)
- **Info:** 4

**Healthiest areas:** Memory leak / cleanup discipline is strong — all `addEventListener` calls have matching cleanup. MCP bridge handlers consistently use try/catch with `respond()` in both paths. Re-entry guards (`isClosingRef`, `cancelled`, `hasTriedRef`) are applied correctly.

**Most concerning areas:** File size — `mcpBridge/` has 8 files exceeding 300 lines (largest: 774). Three hook files emit debug output unconditionally in production.
