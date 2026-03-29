# Documentation Audit Report (Post-Fix)

**Project**: VMark
**Date**: 2026-03-29
**Language**: TypeScript + Rust
**Framework**: VitePress

## Executive Summary

| Dimension | Score | Before | Status |
|-----------|-------|--------|--------|
| Freshness | 90/100 | 90/100 | :green_circle: |
| Accuracy  | 95/100 | 78/100 | :green_circle: |
| Coverage  | 91%    | 64%    | :green_circle: |
| Quality   | 88/100 | 83/100 | :green_circle: |

**Overall health**: 91/100 (was 74/100)

## Remaining Findings

### High (1)

#### Tab Context Menu undocumented
- **File**: `src/components/Tabs/useTabContextMenuActions.ts`
- **Related doc**: (none)
- **Detail**: Right-click tab menu has 10+ actions (Pin, Move to New Window, Copy Path, Reveal in Finder, Close Others, etc.) with no documentation.
- **Suggestion**: Add "Tab Context Menu" section to `workspace-management.md`.

### Medium (5)

| Finding | File | Suggestion |
|---------|------|------------|
| Markmap not linked from features.md | `website/guide/features.md` | Add Mindmaps subsection with link to `/guide/markmap` |
| Text Drag-and-Drop undocumented | `src/plugins/textDragDrop/tiptap.ts` | Brief mention in features.md |
| Status Bar features undocumented | `src/components/StatusBar/StatusBar.tsx` | Add Status Bar section to features.md |
| multi-cursor.md 33 days behind code | `website/guide/multi-cursor.md` | Version reference in tip is vague |
| cjk-formatting.md 35 days behind code | `website/guide/cjk-formatting.md` | AI-Assisted section is skeletal |

### Low (8)

| Finding | Suggestion |
|---------|------------|
| Code Block Line Numbers not in features.md | Add bullet under Code blocks |
| Diagram Preview toggle not in features.md | Mention in Diagrams section |
| Fit Tables to Width unexplained | Add note in Tables section |
| Future shortcuts visible but unimplemented | Mark as "Coming soon" or hide |
| Pandoc export missing from features overview | Add bullet with link to export.md |
| MCP Setup screenshot placeholders | Populate or remove |
| Settings lacks workflow examples | Add "Quick Setup Scenarios" |
| Troubleshooting could cover more areas | Cloud sync, platform-specific issues |

## Improvement Summary

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Critical findings | 2 | 0 | -2 |
| High findings | 8 | 1 | -7 |
| Medium findings | 14 | 5 | -9 |
| Accuracy rate | 96.8% | ~99% | +2.2% |
| Coverage | 64% | 91% | +27% |
| Quality score | 83 | 88 | +5 |
| Overall health | 74 | 91 | +17 |
| Files changed | — | 15 | — |
| Lines added | — | 320+ | — |

## Translation Debt

All 9 translated locales are now behind English:

| Locale | Behind by (lines) |
|--------|-------------------|
| de | ~93 |
| es | ~93 |
| fr | ~93 |
| it | ~93 |
| ja | ~93 |
| ko | ~93 |
| pt-BR | ~93 |
| zh-CN | ~93 |
| zh-TW | ~95 |

11 English guide files were updated. Run `/translate-docs` for each to sync translations.
