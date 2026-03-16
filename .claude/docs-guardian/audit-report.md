# Documentation Audit Report

**Project**: VMark
**Date**: 2026-03-16
**Language**: TypeScript + Rust
**Framework**: VitePress

## Executive Summary

| Dimension | Score | Status |
|-----------|-------|--------|
| Freshness | 85/100 | Green |
| Accuracy  | 89/100 | Yellow |
| Coverage  | 70%    | Yellow |
| Quality   | 91/100 | Green |

**Overall health: 84/100**

## Critical Findings (fix immediately)

### 1. Ollama listed as CLI provider but only REST API is implemented

- **Doc**: `website/guide/ai-providers.md` (CLI Providers table)
- **Code**: `src-tauri/src/ai_provider/detection.rs:20-24` detects only `claude`, `codex`, `gemini`. Ollama is absent.
- **Impact**: Users will not find an "Ollama (CLI)" option after clicking Detect. Ollama exists only as REST API (`ollama-api`).
- **Fix**: Remove "Ollama" row from CLI Providers table and "Setup: Ollama (CLI)" section. Keep Ollama in REST API section only.

### 2. Terminal line height default documented as 1.4 but code defaults to 1.2

- **Doc**: `website/guide/terminal.md:88` says default is `1.4`
- **Code**: `src/stores/settingsStore.ts:219` sets `lineHeight: 1.2`
- **Also**: `src/stores/settingsTypes.ts:204` comment says `Default: 1.4` (intra-code inconsistency)
- **Fix**: Update doc and type comment to `1.2`, or change code default to `1.4`.

### 3. Terminal "Copy on Select" default documented as On but code defaults to Off

- **Doc**: `website/guide/terminal.md:89` says default is `On`
- **Code**: `src/stores/settingsStore.ts:222` sets `copyOnSelect: false`
- **Fix**: Update doc default to `Off`.

## High Findings (fix soon)

### 4. `mcp-setup.md` caption references outdated flat tool name `document_set_content`

- **Doc**: `website/guide/mcp-setup.md:76` — caption reads "calls `document_set_content`"
- **Code**: Tool is now composite `document` with `action: "set_content"`
- **Fix**: Update caption to "calls `document` with action `set_content`"

### 5. `markmap.md` instructs users to call non-existent `insert_markmap` tool

- **Doc**: `website/guide/markmap.md:33` — "Call `insert_markmap` from your AI coding assistant"
- **Code**: `vmark-mcp-server/src/tools/media.ts:95` — actual API is `media` tool with `action: "markmap"`
- **Fix**: Replace with "Use the `media` tool with `action: \"markmap\"` and parameter `code`"

### 6. Settings panel — 60+ user-configurable options lack documentation

- **Source**: `src/stores/settingsTypes.ts` (80+ settings across 10 sections)
- **Doc**: No `website/guide/settings.md` exists
- **Impact**: Settings are a "black box" to new users
- **Fix**: Create `website/guide/settings.md` covering all settings sections

## Medium Findings (fix when convenient)

### 7. `features.md` text transformation shortcuts omit Windows/Linux variants

- **Doc**: `website/guide/features.md:103-108` lists only `Ctrl+Shift+U/L/T`
- **Code**: `shortcutsStore.ts:150-152` has `defaultKeyOther: "Alt-Shift-u/l/t"` for non-macOS
- **Fix**: Add Windows/Linux column or note

### 8. `mcp-setup.md` "Pulsing" status indicator description is vague

- **Doc**: `website/guide/mcp-setup.md:163-173` — three status colors described without visual detail
- **Fix**: Add brief description of pulsing animation and typical startup duration

### 9. `mcp-tools.md` hard-codes tool count ("10 composite tools")

- **Doc**: `website/guide/mcp-tools.md:5`
- **Risk**: Count will go stale when tools are added/removed
- **Fix**: Remove exact count or auto-generate from source

### 10. `export.md` incomplete Pandoc error handling documentation

- **Doc**: `website/guide/export.md:51-76` — unclear what happens if Pandoc not installed
- **Fix**: Add "if Pandoc is not found" section with fallback guidance

### 11. `popups.md` missing URL tooltip truncation example

- **Doc**: `website/guide/popups.md:25`
- **Fix**: Add screenshot or description of truncated URL hover behavior

### 12. Workspace management — no dedicated guide

- **Source**: Menu items open-folder, close-workspace; `src/stores/workspaceStore.ts`
- **Fix**: Create `website/guide/workspace-management.md`

### 13. Search & Replace — sparse documentation

- **Source**: `src/plugins/search/`, Edit menu
- **Current**: 3-line mention in features.md
- **Fix**: Expand with regex syntax, replace-all behavior, case/whole-word modes

### 14. `settingsTypes.ts` internal comment for terminal lineHeight default is wrong

- **Code**: `src/stores/settingsTypes.ts:204` comment says `Default: 1.4`, actual is `1.2`
- **Fix**: Update comment to match code

## Low Findings (nice to have)

- Inconsistent shortcut notation spacing across docs (`Mod + F` vs `Alt+Mod+L`)
- Missing troubleshooting sections in `markmap.md` and `media-support.md`
- `license.md` lacks introductory paragraph
- `ai-genies.md` doesn't explain empty-selection fallback for "selection" scope
- External links (Mermaid docs, Pandoc install) are not periodically verified
- Some VitePress custom container usage inconsistent (`::: info` vs none)
- Dense shortcut tables in `shortcuts.md` could use category summaries
- `cjk-formatting.md` has bare code blocks without language tags
- Missing cross-document links in `export.md` (VMark Reader reference)
- `vmark-mcp-server/src/index.ts:11` has stale `localhost:9224` comment (internal only)
- 3 unmapped docs approaching 30-day staleness: `svg.md` (31d), `markmap.md` (33d), `popups.md` (28d)

## Fixing Plan

Priority-ordered actions:

1. **Fix 3 critical accuracy errors** in `terminal.md` and `ai-providers.md` (15 min)
2. **Fix 2 high accuracy errors** in `mcp-setup.md` and `markmap.md` (10 min)
3. **Fix internal code comment** in `settingsTypes.ts:204` (2 min)
4. **Create `website/guide/settings.md`** — comprehensive settings reference (~2000 words)
5. **Create `website/guide/workspace-management.md`** (~800 words)
6. **Expand `features.md`** — View Modes, Search & Replace, Source Mode sections (+500 words)
7. **Add Windows/Linux shortcut variants** to `features.md` tables
8. **Add source-to-doc mappings** for svg, markmap, popups in config
9. **Polish low-priority items** — consistency, cross-links, containers

## Agent Scores

| Agent | Score | Findings |
|-------|-------|----------|
| Staleness detector | 85/100 | 0 stale (all within 30-day threshold) |
| Accuracy checker | 89/100 | 3 CRITICAL, 2 HIGH, 2 MEDIUM, 1 LOW |
| Coverage scanner | 70% | Settings undocumented (25%), workspace/view modes sparse |
| Quality rater | 91/100 | 0 CRITICAL, 0 HIGH, 4 MEDIUM, 21 LOW |
