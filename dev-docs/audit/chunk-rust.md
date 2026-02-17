# Audit: Rust Backend

**Scope:** `src-tauri/src/` (all modules)
**Files scanned:** 33
**Findings:** 9

---

## Critical (must fix)

### [C1] Menu item `cleanup-images` missing from `default_menu.rs`

- **File:** `src-tauri/src/menu/custom_menu.rs:319` vs `src-tauri/src/menu/default_menu.rs`
- **Issue:** The "Clean Up Unused Images..." menu item (`cleanup-images`) exists in `custom_menu.rs` inside the `cleanup_submenu` (line 319) but is completely absent from `default_menu.rs`. AGENTS.md requires both menu creation functions to stay in sync. On first launch — before any shortcut customization — this menu item is inaccessible.
- **Fix:** Add to `default_menu.rs` inside `cleanup_submenu`:
  ```rust
  &PredefinedMenuItem::separator(app)?,
  &MenuItem::with_id(app, "cleanup-images", "Clean Up Unused Images...", true, None::<&str>)?,
  ```

### [C2] Wrong shortcut lookup key for "Save All and Quit" on macOS

- **File:** `src-tauri/src/menu/custom_menu.rs:49`
- **Issue:** On macOS the shortcut lookup uses `get_accel("saveAllQuit", ...)` (camelCase) while the non-macOS variant at line 157 correctly uses `get_accel("save-all-quit", ...)` (kebab-case). The frontend shortcut store uses kebab-case IDs. Since `"saveAllQuit"` never matches, custom shortcuts for this item are silently ignored on macOS.
- **Fix:** Change `"saveAllQuit"` to `"save-all-quit"` on line 49.

---

## Warning (should fix)

### [W1] `LAST_EMITTED.lock().unwrap()` in production watcher callback

- **File:** `src-tauri/src/watcher.rs:118`
- **Issue:** Called from a `notify` watcher callback on a background thread. Poisoned mutex will crash the watcher thread silently, killing all file-system change detection.
- **Fix:** `LAST_EMITTED.lock().unwrap_or_else(|p| p.into_inner())`

### [W2] `TRANSFER_REGISTRY.lock().unwrap()` in tab-transfer path

- **File:** `src-tauri/src/tab_transfer.rs:43`
- **Issue:** A mutex poison from any tab-transfer command will crash every subsequent invocation — hard-crashing on routine drag-and-drop.
- **Fix:** `TRANSFER_REGISTRY.lock().unwrap_or_else(|p| p.into_inner())`

### [W3] `PENDING_FILE_OPENS.lock().unwrap()` in Tauri command

- **File:** `src-tauri/src/lib.rs:63`
- **Issue:** Poisoned mutex here means documents queued from Finder never open. Low probability but worth fixing for consistency.
- **Fix:** `PENDING_FILE_OPENS.lock().unwrap_or_else(|p| p.into_inner())`

### [W4] "Mindmap" menu item missing SF Symbol icon

- **File:** `src-tauri/src/macos_menu.rs` (`MENU_ICONS` array)
- **Issue:** Both `default_menu.rs:414` and `custom_menu.rs:420` define "Mindmap" but `MENU_ICONS` has no entry. The item appears without an icon on macOS, inconsistent with other Insert menu items.
- **Fix:** Add `("Mindmap", "brain")` to `MENU_ICONS` (verify symbol name in SF Symbols app).

### [W5] Multiple files exceed ~300-line guideline

| File | Lines |
|---|---|
| `src-tauri/src/mcp_bridge.rs` | 784 |
| `src-tauri/src/mcp_config.rs` | 615 |
| `src-tauri/src/window_manager.rs` | 587 |
| `src-tauri/src/genies.rs` | 578 |
| `src-tauri/src/menu/custom_menu.rs` | 549 |
| `src-tauri/src/menu/default_menu.rs` | 543 |
| `src-tauri/src/workspace.rs` | 476 |
| `src-tauri/src/hot_exit/coordinator.rs` | 479 |
| `src-tauri/src/lib.rs` | 429 |
| `src-tauri/src/menu_events.rs` | 414 |

Priority targets: `mcp_bridge.rs` (natural seams: state management, server loop, request routing), `mcp_config.rs` (provider detection vs config read/write), `genies.rs` (scanning vs parsing vs install).

---

## Info (consider)

### [I1] `watcher.rs:321` — `.unwrap()` in test code

- **File:** `src-tauri/src/watcher.rs:321`
- **Issue:** Inside `#[cfg(test)]` — no production risk.

### [I2] `ai_provider/detection.rs` — bare `Command::new` for system utilities

- **File:** `src-tauri/src/ai_provider/detection.rs:80,118`
- **Issue:** Uses `Command::new(&shell)` directly, but this is justified — `build_command` is for AI CLI tools, not for `which`/`where`. Add a comment documenting the exception.

### [I3] No timeout guard in `login_shell_path()` shell invocation

- **File:** `src-tauri/src/ai_provider/detection.rs:80-96`
- **Issue:** A pathological `.zshrc` that hangs on a network call will block Tauri startup indefinitely. Low risk in practice since it runs once and is `.ok()`-fenced.

---

## Summary

- **Critical:** 2
- **Warning:** 5 (including file size)
- **Info:** 3
- **Healthiest areas:** `genies.rs` path traversal guard (proper `canonicalize` + `starts_with`), `quit.rs` mutex handling, `mcp_bridge.rs` request routing and timeout handling, `hot_exit/coordinator.rs` poison recovery pattern.
- **Most concerning areas:** Menu divergence between `default_menu.rs` and `custom_menu.rs` — the two-function design creates an ongoing maintenance hazard. C1 and C2 are both symptoms of this structural risk.
