---
plugin: grill
version: 1.2.0
date: 2026-03-30
target: feature/source-mode-parity branch
style: Paranoid Mode (5 agents)
addons: none
agents: [recon, architecture, error-handling, security, testing, edge-cases]
---

# Grill Report — Source Mode / WYSIWYG Parity Branch

## Executive Summary

**Verdict:** The branch is in good shape after fixes. 25 files changed (+2,627/-448 lines) implementing 14 work items for source/WYSIWYG parity. The code follows project conventions well — design tokens, store patterns, popup base classes, error narrowing. Three real bugs were found and fixed: source MCP handlers not wired into the dispatcher, stale cursor position in async clipboard paste, and missing try/catch on HTML paste conversion. Remaining issues are low severity.

**Top 3 Actions:**
1. Add tests for `smartPasteClipboardImage.ts`, `sourceHandlers.ts`, and `frontmatterPanel/nodeView.ts` (3 files with zero coverage)
2. Add video/audio detection tests to `sourceImagePopupPlugin.test.ts`
3. Validate math popup stale-offset risk with a manual test scenario

**Confidence:** High for all recommendations — findings are grounded in actual code inspection across 5 independent agents.

**Paranoid Verdict:** The stale `mathFrom`/`mathTo` offset in the Source Math Popup is the scariest edge case. If the document mutates while the popup is open (undo, MCP, auto-save), saving corrupts an unrelated region. Mitigated by the fact that document mutations are rare while actively editing math, but the risk exists.

## Findings (Fixed)

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| F1 | HIGH | Source MCP handlers were dead code — never wired into dispatcher | **FIXED** |
| F2 | HIGH | Clipboard image paste read cursor after async I/O | **FIXED** |
| F3 | MEDIUM | `htmlToMarkdown()` can throw, silently dropped paste | **FIXED** |
| F4 | MEDIUM | Hardcoded "Frontmatter" violates i18n rule | **FIXED** |
| F5 | LOW | Duplicate sourceMathPreview test files | **FIXED** |

## Findings (Remaining)

| # | Severity | Finding | File | Recommendation |
|---|----------|---------|------|----------------|
| R1 | MEDIUM | Math popup stores `mathFrom`/`mathTo` as frozen offsets — stale if doc changes | `SourceMathPopupView.ts:163` | Close popup on doc change, or re-detect range on save |
| R2 | MEDIUM | Click-outside math popup discards changes (docs say auto-save) | `SourceMathPopupView.ts` header | Either implement auto-save or fix the doc comment |
| R3 | MEDIUM | `findImageAtPos` duplicated in plugin and actions — video/audio save silently fails | `sourceImageActions.ts:58` | Unify detection into shared utility |
| R4 | MEDIUM | Hardcoded "main" window label in source MCP handlers | `sourceHandlers.ts:46` | Use `resolveWindowId()` pattern |
| R5 | MEDIUM | Width suffix parsing uses magic offsets (+20/+30) | `sourceImageActions.ts:122,149` | Parse full line instead |
| R6 | LOW | KaTeX render missing explicit `trust: false` | `SourceMathPopupView.ts:127` | Add for defense-in-depth |
| R7 | LOW | Turndown `keep(["iframe"])` preserves iframes in pasted HTML | `htmlToMarkdown.ts:103` | Pre-existing, not from this branch |
| R8 | LOW | Tilde fences (`~~~`) not recognized by `getCodeFenceBounds` | `sourceSelectOccurrence.ts:20` | Add tilde pattern |
| R9 | LOW | CJK word count in source handlers uses `split(/\s+/)` | `sourceHandlers.ts:105` | Use Intl.Segmenter |
| R10 | LOW | Frontmatter blur timer: edits silently lost if node deleted | `nodeView.ts:132` | Show toast on failed commit |

## Test Coverage Gaps

| File | Lines | Tests | Risk |
|------|-------|-------|------|
| `smartPasteClipboardImage.ts` | 89 | 0 | HIGH |
| `sourceHandlers.ts` | 141 | 0 | HIGH |
| `SourceMathPopupView.ts` | 200 | 0 | HIGH |
| `frontmatterPanel/nodeView.ts` | 176 | 0 | MEDIUM |
| `sourceImagePopupPlugin.ts` (video/audio) | +40 | 0 | MEDIUM |

## Edge Case Risk Matrix

| Scenario | Likelihood | Impact | Risk | File |
|----------|-----------|--------|------|------|
| Stale mathFrom/mathTo corrupts doc on save | Medium | High | **HIGH** | `SourceMathPopupView.ts:188` |
| Width suffix +20/+30 heuristic mismatch | Medium | Medium | **MEDIUM** | `sourceImageActions.ts:122,149` |
| O(matches*lines) on large docs with Cmd+Shift+L | Medium | Medium | **MEDIUM** | `sourceSelectOccurrence.ts:119` |
| MCP returns wrong window's content in multi-window | Medium | Medium | **MEDIUM** | `sourceHandlers.ts:46` |
| Tilde fences not recognized | Medium | Low | **LOW** | `sourceSelectOccurrence.ts:20` |

## Fixing Plan

### Phase 1: Critical (already done)
All HIGH findings fixed in commit `7975352c`.

### Phase 2: This sprint
- R1: Close math popup on document change (1h)
- R2: Fix click-outside to auto-save or fix docs (30min)
- R3: Unify findImageAtPos into shared utility (2h)
- R4: Use resolveWindowId in source handlers (30min)
- R5: Parse full line for width suffix (1h)
- Tests for 5 untested files (4h)

### Phase 3: Next sprint
- R6: Add `trust: false` to KaTeX calls (15min)
- R8: Add tilde fence support (1h)
- R9: CJK word count with Intl.Segmenter (1h)
- R10: Toast on failed frontmatter commit (30min)

### Phase 4: Opportunistic
- R7: Remove iframe from Turndown keep list (pre-existing)

### Estimated total effort
- Phase 1: Done
- Phase 2: ~1 day
- Phase 3: ~0.5 day
- Phase 4: Opportunistic
- **Total remaining: ~1.5 days**
