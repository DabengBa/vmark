# Audit: MCP Server

**Scope:** `vmark-mcp-server/src/`
**Files scanned:** 27 source files
**Findings:** 11

---

## Critical (must fix)

### [C1] Command injection via `ppid` in `getParentProcessName`

- **File:** `vmark-mcp-server/src/cli.ts:231,236`
- **Issue:** `process.ppid` is a number from the Node.js runtime, so in practice it cannot be attacker-controlled. However, the value is interpolated directly into a shell string passed to `execSync` with no sanitisation or validation. If this function were ever refactored to accept a PID from a different source, the injection surface opens up immediately. The Windows branch also interpolates `ppid` into a PowerShell command string. The pattern establishes a dangerous template that future developers may copy.
- **Fix:** Use `execFileSync` with an argument array instead of `execSync` with a template string:

```typescript
import { execFileSync } from 'child_process';

// macOS/Linux
const result = execFileSync('ps', ['-p', String(ppid), '-o', 'comm='], { encoding: 'utf8' }).trim();

// Windows
if (!/^\d+$/.test(String(ppid))) return undefined;
const result = execFileSync('powershell', ['-NoProfile', '-Command', `(Get-Process -Id ${ppid}).ProcessName`], { encoding: 'utf8' }).trim();
```

---

### [C2] `document_set_content` validates type after extraction — dead guard

- **File:** `vmark-mcp-server/src/tools/document.ts:75-79`
- **Issue:** The handler casts `args.content` to `string` on line 75 without checking, then checks `typeof content !== 'string'` on line 78. The cast always "succeeds" at runtime, so the guard is dead. Same pattern in `document_insert_at_cursor` (lines 122, 125) and 6+ other tools.
- **Fix:** Use `requireStringArg` / `requireStringArgAllowEmpty` helpers consistently.

---

## Warning (should fix)

### [W1] Three files significantly exceed the 300-line guideline

- **File:** `vmark-mcp-server/src/cli.ts` — 573 lines
- **File:** `vmark-mcp-server/src/bridge/types.ts` — 870 lines
- **File:** `vmark-mcp-server/src/index.ts` — 413 lines
- **Issue:** Per AGENTS.md: "Keep code files under ~300 lines." `bridge/types.ts` at 870 lines mixes transport types, document types, protocol types, and workspace types.
- **Fix:** Split `bridge/types.ts` into `core-types.ts`, `document-types.ts`, `protocol-types.ts`, `workspace-types.ts`. Re-export from barrel `types.ts`.

---

### [W2] `update_section` rejects empty `newContent` — breaks valid "clear section body" use case

- **File:** `vmark-mcp-server/src/tools/sections.ts:80`
- **Issue:** `requireStringArg(args, 'newContent')` throws on empty string. But clearing a section body (leaving only the heading) is a valid operation.
- **Fix:** Use `requireStringArgAllowEmpty(args, 'newContent')`.

---

### [W3] `read_genie` accepts arbitrary file path without restriction

- **File:** `vmark-mcp-server/src/tools/genies.ts:97-105`
- **Issue:** The `path` argument is passed directly to the bridge without sanitisation. No defence-in-depth at MCP layer.
- **Fix:** Validate path does not contain `..` traversal segments and ends with `.md`.

---

### [W4] `insert_video` / `insert_audio` accept arbitrary URL schemes

- **File:** `vmark-mcp-server/src/tools/media.ts:99-108`, `159-165`
- **Issue:** `escapeAttr` neutralises quote injection but does not block `javascript:` or `data:` scheme URLs.
- **Fix:** Add scheme allowlist: `const ALLOWED_SCHEMES = /^(https?|file):\/\//i;`

---

### [W5] `batch_edit` passes raw operations without per-operation validation

- **File:** `vmark-mcp-server/src/tools/mutations.ts:133-151`
- **Issue:** Operations array checked for length but individual operations not structurally validated. Missing `type`, `nodeId`, etc. could cause unhandled errors in bridge.
- **Fix:** Add per-operation type/field validation before forwarding.

---

### [W6] `getParentProcessName` uses synchronous `execSync`, blocking stdin

- **File:** `vmark-mcp-server/src/cli.ts:225-246`
- **Issue:** Blocks Node.js event loop during startup. PowerShell on Windows can take 1-2 seconds.
- **Fix:** Add `timeout: 500` to `execSync` options, or use async detection.

---

### [W7] `EXPECTED_TOOL_COUNT` is a magic number requiring manual maintenance

- **File:** `vmark-mcp-server/src/index.ts:386`
- **Issue:** Must be manually updated when tools change.
- **Fix:** Derive from `TOOL_CATEGORIES`: `TOOL_CATEGORIES.reduce((sum, cat) => sum + cat.tools.length, 0)`

---

## Info (consider)

### [I1] `cursor_get_context` casts optional numbers before validating

- **File:** `vmark-mcp-server/src/tools/selection.ts:193-204`
- **Issue:** Uses `(args.linesBefore as number) ?? 3` instead of `getNumberArg`. Null values bypass default.
- **Fix:** Use `getNumberArg(args, 'linesBefore') ?? 3`.

---

### [I2] `validateNonNegativeInt` deprecated alias has no callers

- **File:** `vmark-mcp-server/src/server.ts:291`
- **Issue:** Marked `@deprecated Remove in v0.5.0` but has zero references. Can be removed now.
- **Fix:** Remove the alias.

---

### [I3] Two different version strings in MCP server

- **File:** `vmark-mcp-server/src/cli.ts:21` and `vmark-mcp-server/src/server.ts:59`
- **Issue:** `cli.ts` has `VERSION = '0.4.32'` and `server.ts` has `version: '0.1.0'`. Not documented whether `0.1.0` is MCP protocol version or app version.
- **Fix:** Document the distinction or share via imported constant.

---

## Summary

- **Critical:** 2
- **Warning:** 6
- **Info:** 3
- **Healthiest areas:** Error handling is consistent — every handler wraps in try/catch with proper error narrowing. WebSocket bridge has solid reconnect, timeout, and queue overflow protection.
- **Most concerning areas:** `cli.ts` command injection pattern (C1), dead type-guard pattern in 6+ tools (C2), three oversized files (W1).
