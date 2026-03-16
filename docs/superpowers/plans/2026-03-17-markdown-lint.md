# Markdown Lint Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add on-demand markdown structural/syntax validation to VMark with 13 rules, Source mode inline diagnostics, WYSIWYG block-level indicators, and status bar navigation.

**Architecture:** Pure lint engine (`src/lib/lintEngine/`) runs 13 rules over MDAST + raw source text. Results stored in tab-scoped Zustand store. CodeMirror `@codemirror/lint` shows diagnostics in Source mode. ProseMirror decorations show block-level indicators in WYSIWYG. Status bar badge + F2 navigation cycle through issues.

**Tech Stack:** remark (existing), @codemirror/lint (new), Zustand, ProseMirror decorations, Tiptap extension, react-i18next

**Spec:** `docs/superpowers/specs/2026-03-16-markdown-lint-design.md`

---

## Chunk 1: Types, Parser, and Lint Engine Foundation

### Task 1: Create branch and install dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Create feature branch**

```bash
git checkout -b feat/markdown-lint
```

- [ ] **Step 2: Install @codemirror/lint**

```bash
pnpm add @codemirror/lint@^6.8.0
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @codemirror/lint dependency"
```

### Task 2: Define types

**Files:**
- Create: `src/lib/lintEngine/types.ts`

- [ ] **Step 1: Write the type definitions**

```typescript
// src/lib/lintEngine/types.ts

/**
 * How the diagnostic should render in WYSIWYG mode.
 * - "exact": position maps reliably (headings, images, links)
 * - "block": gutter dot on containing block, no inline highlight
 * - "sourceOnly": cannot show in WYSIWYG; F2 switches to Source mode
 */
export type UiHint = "exact" | "block" | "sourceOnly";

export type LintSeverity = "error" | "warning";

export interface LintDiagnostic {
  /** Unique ID: `${ruleId}-${line}-${column}` */
  id: string;
  /** Rule identifier: "E01", "W03", etc. */
  ruleId: string;
  severity: LintSeverity;
  /** i18n message key: "lint.E01" */
  messageKey: string;
  /** Interpolation params for the message key */
  messageParams: Record<string, string>;
  /** 1-based line number in source markdown */
  line: number;
  /** 1-based column in source markdown */
  column: number;
  /** 0-based character offset in source */
  offset: number;
  /** End of affected range (0-based). Undefined = point diagnostic. */
  endOffset?: number;
  /** Rendering hint for WYSIWYG mode */
  uiHint: UiHint;
}

/**
 * A lint rule function. Receives the raw source text and parsed MDAST root.
 * Returns an array of diagnostics found by this rule.
 */
export type LintRule = (
  source: string,
  mdast: import("mdast").Root
) => LintDiagnostic[];
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/lintEngine/types.ts
git commit -m "feat(lint): add LintDiagnostic and LintRule types"
```

### Task 3: Extract lint-safe parser from existing pipeline

**Files:**
- Modify: `src/utils/markdownPipeline/parser.ts`
- Create: `src/lib/lintEngine/__tests__/parserIntegration.test.ts`

- [ ] **Step 1: Write the failing test**

The test verifies that `createMarkdownProcessor({ forLint: true })` returns MDAST with accurate positions and does NOT call `normalizeBareListMarkers`.

```typescript
// src/lib/lintEngine/__tests__/parserIntegration.test.ts
import { describe, it, expect } from "vitest";
import { createMarkdownProcessor } from "@/utils/markdownPipeline/parser";

describe("createMarkdownProcessor({ forLint: true })", () => {
  it("parses markdown into MDAST with position data", () => {
    const processor = createMarkdownProcessor({ forLint: true });
    const tree = processor.parse("# Hello\n\nWorld");
    expect(tree.type).toBe("root");
    expect(tree.children.length).toBeGreaterThan(0);
    // Every node must have position data
    expect(tree.children[0].position).toBeDefined();
    expect(tree.children[0].position!.start.line).toBe(1);
  });

  it("preserves positions for bare list markers (no normalization)", () => {
    const source = "  -item without space";
    const processor = createMarkdownProcessor({ forLint: true });
    const tree = processor.parse(source);
    // The raw source should be preserved — normalizeBareListMarkers NOT called
    // Position offsets should match the original source
    const firstChild = tree.children[0];
    expect(firstChild.position!.start.offset).toBe(0);
  });

  it("loads GFM plugin (tables)", () => {
    const source = "| a | b |\n| - | - |\n| 1 | 2 |";
    const processor = createMarkdownProcessor({ forLint: true });
    const tree = processor.parse(source);
    const table = tree.children.find((n) => n.type === "table");
    expect(table).toBeDefined();
  });

  it("loads math plugin", () => {
    const source = "$$\nx = 1\n$$";
    const processor = createMarkdownProcessor({ forLint: true });
    const tree = processor.parse(source);
    const math = tree.children.find((n) => n.type === "math");
    expect(math).toBeDefined();
  });

  it("loads frontmatter plugin", () => {
    const source = "---\ntitle: test\n---\n\n# Hello";
    const processor = createMarkdownProcessor({ forLint: true });
    const tree = processor.parse(source);
    const yaml = tree.children.find((n) => n.type === "yaml");
    expect(yaml).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/lintEngine/__tests__/parserIntegration.test.ts`
Expected: FAIL — `createMarkdownProcessor` doesn't exist yet or doesn't accept `forLint`

- [ ] **Step 3: Implement createMarkdownProcessor**

Read `src/utils/markdownPipeline/parser.ts` and find the existing `createProcessor()` function (~line 316). Add a new export that wraps it:

```typescript
// Add to src/utils/markdownPipeline/parser.ts (new export)

/**
 * Create a markdown processor for lint use.
 * Same plugin stack as the editor pipeline, but skips position-mutating
 * transforms (normalizeBareListMarkers) so MDAST positions are accurate.
 */
export function createMarkdownProcessor(
  opts?: { forLint?: boolean }
): ReturnType<typeof createProcessor> {
  return createProcessor();
}
```

Then modify `parseMarkdownToMdast` to accept `forLint` option and skip `normalizeBareListMarkers` when true. Or better: have `createMarkdownProcessor` be a separate export that just calls `createProcessor()` — the key difference is that the *caller* (lintMarkdown) will NOT call `normalizeBareListMarkers` on the source before parsing.

The cleanest approach: export `createProcessor` directly (or rename to `createMarkdownProcessor`) and let the lint engine call `processor.parse(source)` directly without the normalization wrapper.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/lintEngine/__tests__/parserIntegration.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/markdownPipeline/parser.ts src/lib/lintEngine/__tests__/parserIntegration.test.ts
git commit -m "feat(lint): export createMarkdownProcessor for lint-safe MDAST parsing"
```

### Task 4: Create lint engine orchestrator

**Files:**
- Create: `src/lib/lintEngine/linter.ts`
- Create: `src/lib/lintEngine/rules/index.ts`
- Create: `src/lib/lintEngine/index.ts`
- Create: `src/lib/lintEngine/__tests__/linter.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/lintEngine/__tests__/linter.test.ts
import { describe, it, expect } from "vitest";
import { lintMarkdown } from "../linter";

describe("lintMarkdown", () => {
  it("returns empty array for valid markdown", () => {
    const result = lintMarkdown("# Hello\n\nThis is valid markdown.");
    expect(result).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    const result = lintMarkdown("");
    expect(result).toEqual([]);
  });

  it("returns empty array for frontmatter-only document", () => {
    const result = lintMarkdown("---\ntitle: test\n---");
    expect(result).toEqual([]);
  });

  it("returns diagnostics sorted by line then column", () => {
    // Document with multiple issues — verify sort order
    const source = "## Skip\n\n#### Double skip\n\n![](img.png)";
    const result = lintMarkdown(source);
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1];
      const curr = result[i];
      expect(
        prev.line < curr.line ||
          (prev.line === curr.line && prev.column <= curr.column)
      ).toBe(true);
    }
  });

  it("each diagnostic has a unique id", () => {
    const source = "## Skip\n\n#### Double skip\n\n![](img.png)";
    const result = lintMarkdown(source);
    const ids = result.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("completes in under 100ms for 5000-line document", () => {
    const lines = Array.from({ length: 5000 }, (_, i) => `Line ${i + 1}`);
    lines[0] = "# Title";
    const source = lines.join("\n");
    const start = performance.now();
    lintMarkdown(source);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/lintEngine/__tests__/linter.test.ts`
Expected: FAIL — module doesn't exist

- [ ] **Step 3: Create rule registry (empty)**

```typescript
// src/lib/lintEngine/rules/index.ts
import type { LintRule } from "../types";

/** All registered lint rules. Order doesn't matter — diagnostics are sorted after collection. */
export const allRules: LintRule[] = [];
```

- [ ] **Step 4: Create linter orchestrator**

```typescript
// src/lib/lintEngine/linter.ts
import { createMarkdownProcessor } from "@/utils/markdownPipeline/parser";
import type { Root } from "mdast";
import type { LintDiagnostic } from "./types";
import { allRules } from "./rules";

const processor = createMarkdownProcessor({ forLint: true });

/**
 * Run all lint rules against a markdown source string.
 * Returns diagnostics sorted by position.
 */
export function lintMarkdown(source: string): LintDiagnostic[] {
  if (!source.trim()) return [];

  const mdast = processor.parse(source) as Root;
  const diagnostics: LintDiagnostic[] = [];

  for (const rule of allRules) {
    diagnostics.push(...rule(source, mdast));
  }

  // Sort by line, then column
  diagnostics.sort((a, b) => a.line - b.line || a.column - b.column);

  return diagnostics;
}
```

- [ ] **Step 5: Create barrel export**

```typescript
// src/lib/lintEngine/index.ts
export { lintMarkdown } from "./linter";
export type { LintDiagnostic, LintRule, LintSeverity, UiHint } from "./types";
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm vitest run src/lib/lintEngine/__tests__/linter.test.ts`
Expected: PASS (empty rule set returns no diagnostics)

- [ ] **Step 7: Commit**

```bash
git add src/lib/lintEngine/
git commit -m "feat(lint): add lint engine orchestrator with empty rule registry"
```

---

## Chunk 2: MDAST-Based Rules (E01, E02, E06, E07, W01-W05)

### Task 5: Rule E01 — no-undefined-references

**Files:**
- Create: `src/lib/lintEngine/rules/noUndefinedRefs.ts`
- Create: `src/lib/lintEngine/rules/__tests__/noUndefinedRefs.test.ts`
- Modify: `src/lib/lintEngine/rules/index.ts`

- [ ] **Step 1: Write the failing test**

Table-driven tests covering: valid refs, undefined refs, case-insensitive matching, whitespace normalization, image refs, footnotes excluded.

```typescript
// src/lib/lintEngine/rules/__tests__/noUndefinedRefs.test.ts
import { describe, it, expect } from "vitest";
import { lintMarkdown } from "../../linter";

// Register only this rule for isolated testing
import { noUndefinedRefs } from "../noUndefinedRefs";
import { allRules } from "../index";

describe("E01: no-undefined-references", () => {
  it.each([
    { name: "valid full reference", input: "[text][ref]\n\n[ref]: http://example.com", expected: 0 },
    { name: "valid collapsed reference", input: "[ref][]\n\n[ref]: http://example.com", expected: 0 },
    { name: "valid shortcut reference", input: "[ref]\n\n[ref]: http://example.com", expected: 0 },
    { name: "undefined reference", input: "[text][missing]", expected: 1 },
    { name: "case insensitive match", input: "[text][REF]\n\n[ref]: http://example.com", expected: 0 },
    { name: "whitespace normalized", input: "[text][ref  label]\n\n[ref label]: http://example.com", expected: 0 },
    { name: "multiple undefined", input: "[a][x]\n\n[b][y]", expected: 2 },
    { name: "inline link not flagged", input: "[text](http://example.com)", expected: 0 },
    { name: "empty document", input: "", expected: 0 },
  ])("$name → $expected diagnostic(s)", ({ input, expected }) => {
    const result = lintMarkdown(input);
    const e01 = result.filter((d) => d.ruleId === "E01");
    expect(e01.length).toBe(expected);
  });

  it("diagnostic has correct fields", () => {
    const result = lintMarkdown("[text][missing]");
    const d = result.find((d) => d.ruleId === "E01")!;
    expect(d.severity).toBe("error");
    expect(d.messageKey).toBe("lint.E01");
    expect(d.messageParams).toHaveProperty("ref");
    expect(d.uiHint).toBe("exact");
    expect(d.line).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/lintEngine/rules/__tests__/noUndefinedRefs.test.ts`

- [ ] **Step 3: Implement the rule**

Walk MDAST for `linkReference` and `imageReference` nodes. Collect all `definition` nodes. Flag references with no matching definition. Use CommonMark label normalization (lowercase, collapse whitespace).

- [ ] **Step 4: Register in rules/index.ts**

```typescript
import { noUndefinedRefs } from "./noUndefinedRefs";
export const allRules: LintRule[] = [noUndefinedRefs];
```

- [ ] **Step 5: Run test to verify it passes**

- [ ] **Step 6: Commit**

```bash
git add src/lib/lintEngine/rules/
git commit -m "feat(lint): add E01 no-undefined-references rule"
```

### Task 6: Rule E02 — table-column-count

**Files:**
- Create: `src/lib/lintEngine/rules/tableColumnCount.ts`
- Create: `src/lib/lintEngine/rules/__tests__/tableColumnCount.test.ts`
- Modify: `src/lib/lintEngine/rules/index.ts`

- [ ] **Step 1: Write the failing test**

Test cases: valid table (3 cols), row with fewer cells, row with more cells, single-column table, table with inline code containing pipes (`\|` not a separator), empty cells, table with escaped pipes, table inside blockquote, alignment row itself not flagged.

- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement** — Walk MDAST for `table` nodes. First row defines expected column count. Check each subsequent `tableRow`.
- [ ] **Step 4: Register in rules/index.ts**
- [ ] **Step 5: Run test to verify it passes**
- [ ] **Step 6: Commit**

```bash
git commit -m "feat(lint): add E02 table-column-count rule"
```

### Task 7: Rule E06 — no-empty-link-text

**Files:**
- Create: `src/lib/lintEngine/rules/noEmptyLinkText.ts`
- Create: `src/lib/lintEngine/rules/__tests__/noEmptyLinkText.test.ts`

- [ ] **Step 1: Write the failing test**

Test cases: `[](url)` flagged, `[text](url)` clean, `![](url)` NOT flagged (that's alt text, separate rule), autolinks clean.

- [ ] **Step 2-6: Implement, register, test, commit**

```bash
git commit -m "feat(lint): add E06 no-empty-link-text rule"
```

### Task 8: Rule E07 — no-duplicate-definitions

**Files:**
- Create: `src/lib/lintEngine/rules/noDuplicateDefs.ts`
- Create: `src/lib/lintEngine/rules/__tests__/noDuplicateDefs.test.ts`

- [ ] **Step 1: Write the failing test**

Test cases: unique definitions clean, duplicate labels flagged (second occurrence), case-insensitive matching, whitespace-normalized labels.

- [ ] **Step 2-6: Implement, register, test, commit**

```bash
git commit -m "feat(lint): add E07 no-duplicate-definitions rule"
```

### Task 9: Rules W01-W05 (warnings)

**Files:**
- Create: `src/lib/lintEngine/rules/headingIncrement.ts` + test — W01
- Create: `src/lib/lintEngine/rules/requireAltText.ts` + test — W02
- Create: `src/lib/lintEngine/rules/noUnusedDefs.ts` + test — W03
- Create: `src/lib/lintEngine/rules/linkFragments.ts` + test — W04 (uses `makeUniqueSlug` from `src/utils/headingSlug.ts`)
- Create: `src/lib/lintEngine/rules/noEmptyLinkHref.ts` + test — W05

Each rule follows the same RED → GREEN → REGISTER → COMMIT pattern.

- [ ] **Step 1: W01 headingIncrement** — Walk heading nodes, check depth increases by max 1. Test: h1→h3 flagged, h1→h2→h3 clean, h2→h1 clean (decreases OK), document starting at h2 (no h1) NOT flagged (not a heading-increment issue), h3→h3 clean.
- [ ] **Step 2: Commit** `feat(lint): add W01 heading-increment rule`
- [ ] **Step 3: W02 requireAltText** — Walk `image` nodes, check `alt` is non-empty. Test: `![](img)` flagged, `![alt](img)` clean, `![""](img)` flagged.
- [ ] **Step 4: Commit** `feat(lint): add W02 require-alt-text rule`
- [ ] **Step 5: W03 noUnusedDefs** — Collect all `definition` labels and all `linkReference`/`imageReference` identifiers. Flag definitions not referenced. Test: used def clean, orphan def flagged.
- [ ] **Step 6: Commit** `feat(lint): add W03 no-unused-definitions rule`
- [ ] **Step 7: W04 linkFragments** — Walk `link` nodes with `url` starting with `#`. Extract all heading texts, generate slugs via `makeUniqueSlug`. Flag links whose fragment doesn't match any slug. Test: `#valid-heading` clean, `#nonexistent` flagged, duplicate headings with `-1` suffix, CJK heading slug (e.g., `#开始`), heading with inline code (`` # `code` heading `` → slug `code-heading`), case sensitivity of slugs.
- [ ] **Step 8: Commit** `feat(lint): add W04 link-fragments rule`
- [ ] **Step 9: W05 noEmptyLinkHref** — Walk `link` nodes, check `url` is non-empty string. Test: `[text]()` flagged, `[text](url)` clean.
- [ ] **Step 10: Commit** `feat(lint): add W05 no-empty-link-href rule`

---

## Chunk 3: Source-Text Rules (E03, E04, E05, E08)

### Task 10: Rule E03 — no-reversed-link-syntax

**Files:**
- Create: `src/lib/lintEngine/rules/noReversedLink.ts` + test

- [ ] **Step 1: Write the failing test**

Test cases: `(text)[url]` flagged with correct position, `[text](url)` clean, inside code block NOT flagged, inside inline code NOT flagged, `(text)[ref]` (reversed reference link) flagged, inside blockquote flagged, multiple on same line both caught.

- [ ] **Step 2-6: Implement as source-text regex, register, test, commit**

Regex: `/^\(([^)]+)\)\[([^\]]+)\]/gm` — scan each line. Skip lines inside fenced code blocks (track fence state). Use `uiHint: "sourceOnly"`.

```bash
git commit -m "feat(lint): add E03 no-reversed-link-syntax rule"
```

### Task 11: Rule E04 — no-missing-space-atx

**Files:**
- Create: `src/lib/lintEngine/rules/noMissingSpaceAtx.ts` + test

- [ ] **Step 1: Write the failing test**

Test cases: `#heading` flagged, `# heading` clean, `##heading` flagged, `#hashtag` in paragraph NOT flagged, `#` in code block NOT flagged, `    #heading` (indented code) NOT flagged, line starting with 4+ spaces excluded.

- [ ] **Step 2-6: Implement, register, test, commit**

Regex: `/^[ ]{0,3}(#{1,6})\S/` per line. Skip fenced code blocks. Use `uiHint: "sourceOnly"`.

```bash
git commit -m "feat(lint): add E04 no-missing-space-atx rule"
```

### Task 12: Rule E05 — no-space-in-emphasis

**Files:**
- Create: `src/lib/lintEngine/rules/noSpaceInEmphasis.ts` + test

- [ ] **Step 1: Write the failing test**

Test cases: `** bold **` flagged, `**bold**` clean, `* italic *` flagged, `*italic*` clean, `__ bold __` flagged, inside code NOT flagged, `** ` at line end NOT flagged (partial).

- [ ] **Step 2-6: Implement, register, test, commit**

Regex patterns for `** text **`, `* text *`, `__ text __`, `_ text _` with space after opening or before closing marker. Skip fenced code and inline code regions. Use `uiHint: "sourceOnly"`.

```bash
git commit -m "feat(lint): add E05 no-space-in-emphasis rule"
```

### Task 13: Rule E08 — unclosed-fenced-code

**Files:**
- Create: `src/lib/lintEngine/rules/unclosedFencedCode.ts` + test

- [ ] **Step 1: Write the failing test**

Test cases: matched fences clean, opening without close flagged, closing fence with wrong character NOT matched (``` vs ~~~), indented opening (1-3 spaces) still counts, 4+ space indent is indented code NOT a fence, nested fences (longer fence closes shorter).

- [ ] **Step 2-6: Implement as line-by-line scanner, register, test, commit**

Scan lines for fence openings (`/^[ ]{0,3}(`{3,}|~{3,})/`). Track open fence (char + length). Close when matching or longer fence found. Flag unclosed at EOF. Use `uiHint: "sourceOnly"`.

```bash
git commit -m "feat(lint): add E08 unclosed-fenced-code rule"
```

---

## Chunk 4: Lint Store and Status Bar Badge

### Task 14: Create lintStore

**Files:**
- Create: `src/stores/lintStore.ts`
- Create: `src/stores/__tests__/lintStore.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/stores/__tests__/lintStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useLintStore } from "../lintStore";

describe("lintStore", () => {
  beforeEach(() => {
    useLintStore.getState().clearAllDiagnostics();
  });

  it("starts with empty diagnostics", () => {
    const { diagnosticsByTab } = useLintStore.getState();
    expect(diagnosticsByTab).toEqual({});
  });

  it("runLint stores diagnostics keyed by tabId", () => {
    useLintStore.getState().runLint("tab-1", "## Skip\n\n#### Double");
    const diags = useLintStore.getState().diagnosticsByTab["tab-1"];
    expect(diags).toBeDefined();
    expect(diags!.length).toBeGreaterThan(0);
  });

  it("clearDiagnostics removes for specific tab", () => {
    useLintStore.getState().runLint("tab-1", "## Skip\n\n#### Double");
    useLintStore.getState().runLint("tab-2", "## Skip\n\n#### Double");
    useLintStore.getState().clearDiagnostics("tab-1");
    expect(useLintStore.getState().diagnosticsByTab["tab-1"]).toBeUndefined();
    expect(useLintStore.getState().diagnosticsByTab["tab-2"]).toBeDefined();
  });

  it("selectNext wraps around", () => {
    useLintStore.getState().runLint("tab-1", "## Skip\n\n#### Double\n\n![](img.png)");
    const count = useLintStore.getState().diagnosticsByTab["tab-1"]!.length;
    // selectNext takes tabId to know which diagnostics to navigate
    for (let i = 0; i < count + 1; i++) {
      useLintStore.getState().selectNext("tab-1");
    }
    expect(useLintStore.getState().selectedIndex).toBe(0);
  });

  it("selectPrev wraps to last from index 0", () => {
    useLintStore.getState().runLint("tab-1", "## Skip\n\n#### Double");
    useLintStore.getState().selectPrev("tab-1");
    const count = useLintStore.getState().diagnosticsByTab["tab-1"]!.length;
    expect(useLintStore.getState().selectedIndex).toBe(count - 1);
  });

  it("selectNext/Prev with no diagnostics is a no-op", () => {
    useLintStore.getState().selectNext("tab-1");
    expect(useLintStore.getState().selectedIndex).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement lintStore**

Zustand store with `diagnosticsByTab`, `sourceHashByTab`, `selectedIndex`. `runLint` calls `lintMarkdown()` and stores results. Navigation methods update `selectedIndex` with wrap-around.

- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Commit**

```bash
git add src/stores/lintStore.ts src/stores/__tests__/lintStore.test.ts
git commit -m "feat(lint): add tab-scoped lintStore with navigation"
```

### Task 15: Create LintBadge status bar component

**Files:**
- Create: `src/components/StatusBar/LintBadge.tsx`
- Modify: `src/components/StatusBar/StatusBarRight.tsx`

- [ ] **Step 1: Create LintBadge component**

Reads from `useLintStore` via selector for active tab's diagnostics. Shows `⚠ N` badge when count > 0. Amber if warnings only, red if any errors. Click calls `selectNext`. Tooltip shows localized count message.

- [ ] **Step 2: Add to StatusBarRight**

Add `<LintBadge />` between the word count and update indicator (~line 150 in StatusBarRight.tsx). Pass `activeTabId` as prop.

- [ ] **Step 3: Commit**

```bash
git add src/components/StatusBar/LintBadge.tsx src/components/StatusBar/StatusBarRight.tsx
git commit -m "feat(lint): add LintBadge status bar component"
```

---

## Chunk 5: Source Mode CodeMirror Integration

### Task 16: Create CodeMirror lint extension

**Files:**
- Create: `src/plugins/codemirror/sourceLint.ts`
- Modify: `src/plugins/codemirror/index.ts`
- Modify: `src/utils/sourceEditorExtensions.ts`

- [ ] **Step 0: Write failing test for CM lint adapter**

Create `src/plugins/codemirror/__tests__/sourceLint.test.ts`. Test that `convertToCMDiagnostics()` correctly maps `LintDiagnostic` line/column (1-based) to CM offsets (0-based). Test cases: single-line diagnostic, multi-line, diagnostic at end of document, empty diagnostics array.

Run: `pnpm vitest run src/plugins/codemirror/__tests__/sourceLint.test.ts`
Expected: FAIL

- [ ] **Step 1: Create sourceLint.ts**

Uses `@codemirror/lint`'s `linter()` function. Reads diagnostics from `lintStore` for active tab and converts `LintDiagnostic[]` to CM `Diagnostic[]` (mapping line/column to CM offsets). Export the conversion function separately for testability.

- [ ] **Step 2: Export from codemirror/index.ts**

```typescript
export { createSourceLintExtension } from "./sourceLint";
```

- [ ] **Step 3: Add to sourceEditorExtensions.ts**

Import and add to the extensions array. Gated by `lintEnabled` setting.

- [ ] **Step 4: Commit**

```bash
git add src/plugins/codemirror/sourceLint.ts src/plugins/codemirror/index.ts src/utils/sourceEditorExtensions.ts
git commit -m "feat(lint): add CodeMirror lint extension for Source mode"
```

### Task 17: Wire up keyboard shortcut and menu events

**Files:**
- Modify: `src/stores/shortcutsStore.ts`
- Modify: `src/hooks/useViewShortcuts.ts`
- Modify: `src/hooks/useViewMenuEvents.ts`
- Modify: `src-tauri/src/menu/localized.rs`
- Modify: `src-tauri/src/macos_menu.rs`

- [ ] **Step 0: Write failing tests for shortcut and menu handlers**

Add tests to existing `useViewShortcuts.test.ts` and `useViewMenuEvents.test.ts` (or create if they don't exist):
- Test: `Alt-Mod-v` triggers `lintStore.runLint` with active tab content
- Test: `F2` calls `lintStore.selectNext`
- Test: `Shift-F2` calls `lintStore.selectPrev`
- Test: Menu events `menu:check-markdown`, `menu:lint-next`, `menu:lint-prev` trigger same actions
- Test: When `runLint` returns zero diagnostics, a toast is shown with `t("statusbar:lint.clean")`
- Test: When `lintEnabled` setting is false, shortcut is a no-op

Run tests to verify they fail, then proceed with implementation.

- [ ] **Step 1: Add shortcut definitions to shortcutsStore.ts**

```typescript
{ id: "validateMarkdown", label: "Check Markdown", category: "view", defaultKey: "Alt-Mod-v", menuId: "check-markdown" },
{ id: "lintNext", label: "Next Issue", category: "view", defaultKey: "F2", menuId: "lint-next" },
{ id: "lintPrev", label: "Previous Issue", category: "view", defaultKey: "Shift-F2", menuId: "lint-prev" },
```

- [ ] **Step 2: Add handler in useViewShortcuts.ts**

On `validateMarkdown` shortcut: check `lintEnabled` setting first (no-op if disabled). Get active tab content (source mode: CM content, WYSIWYG: serialize), call `lintStore.runLint(tabId, source)`. If result is zero diagnostics, show transient toast with `t("statusbar:lint.clean")` (auto-dismiss 2s). On `lintNext`/`lintPrev`: call store navigation with active tabId.

- [ ] **Step 3: Add menu event listeners in useViewMenuEvents.ts**

Listen for `menu:check-markdown`, `menu:lint-next`, `menu:lint-prev`. Same handlers as shortcuts.

- [ ] **Step 4: Add menu items in localized.rs**

Add "Check Markdown", "Next Issue", "Previous Issue" to the View menu with accelerators.

- [ ] **Step 5: Add SF Symbol icons in macos_menu.rs**

Add to MENU_ICONS: `("check-markdown", "checkmark.circle")`, `("lint-next", "chevron.down")`, `("lint-prev", "chevron.up")`.

- [ ] **Step 6: Commit**

```bash
git add src/stores/shortcutsStore.ts src/hooks/useViewShortcuts.ts src/hooks/useViewMenuEvents.ts src-tauri/src/menu/localized.rs src-tauri/src/macos_menu.rs
git commit -m "feat(lint): wire up Alt+Mod+V shortcut and View menu items"
```

---

## Chunk 6: Settings, Lint CSS, and Diagnostic Dismissal

### Task 18: Add lint setting to MarkdownSettings

**Files:**
- Modify: `src/stores/settingsTypes.ts`
- Modify: `src/stores/settingsStore.ts`

- [ ] **Step 1: Add `lintEnabled` to MarkdownSettings**

Add to `MarkdownSettings` interface (~line 160): `lintEnabled: boolean;`

- [ ] **Step 2: Set default in settingsStore.ts**

Set `lintEnabled: true` in the defaults.

- [ ] **Step 3: Add toggle to Markdown settings UI**

Find the Markdown settings section in `src/pages/settings/MarkdownSettings.tsx` (or equivalent). Add a toggle row for "Markdown Validation" using the same pattern as other boolean settings (e.g., `preserveLineBreaks`). Label: `t("settings:markdown.lintEnabled")`. Description: `t("settings:markdown.lintEnabled.description")`.

- [ ] **Step 4: Commit**

```bash
git add src/stores/settingsTypes.ts src/stores/settingsStore.ts src/pages/settings/
git commit -m "feat(lint): add lintEnabled setting to MarkdownSettings with UI toggle"
```

### Task 19: Create lint.css

**Files:**
- Create: `src/plugins/lint/lint.css`

- [ ] **Step 1: Write CSS for gutter dots and line highlights**

Use design tokens: `--error-color`, `--warning-color`. Gutter dot 6px, line highlight via `color-mix()`. Dark theme adapts automatically via token values.

- [ ] **Step 2: Commit**

```bash
git add src/plugins/lint/lint.css
git commit -m "feat(lint): add lint indicator CSS (gutter dots + line highlights)"
```

### Task 20: Clear diagnostics on document change

**Files:**
- Modify: `src/plugins/codemirror/sourceLint.ts` — add CM `EditorView.updateListener` that clears on docChanged
- Modify: `src/plugins/lint/index.ts` — in PM plugin's `apply()`, check `tr.docChanged` and clear

- [ ] **Step 1: In Source mode (`sourceLint.ts`)** — Add a CM `EditorView.updateListener.of()` extension that calls `useLintStore.getState().clearDiagnostics(tabId)` when `update.docChanged` is true.

- [ ] **Step 2: In WYSIWYG mode (`src/plugins/lint/index.ts`)** — In the ProseMirror lint plugin's `apply()` method, check `tr.docChanged` and call `useLintStore.getState().clearDiagnostics(tabId)` if true.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(lint): clear diagnostics on document change"
```

---

## Chunk 7: WYSIWYG Block-Level Integration

### Task 21: Create ProseMirror lint plugin

**Files:**
- Create: `src/plugins/lint/index.ts`
- Create: `src/plugins/lint/tiptap.ts`

- [ ] **Step 0: Write failing test for PM lint plugin**

Create `src/plugins/lint/__tests__/lintPlugin.test.ts`. Test:
- Empty diagnostics → no decorations
- `uiHint: "block"` diagnostic → `Decoration.node()` on containing block
- `uiHint: "sourceOnly"` diagnostic → excluded from decorations
- Multiple diagnostics on same block → single decoration with highest severity

Run: `pnpm vitest run src/plugins/lint/__tests__/lintPlugin.test.ts`
Expected: FAIL

- [ ] **Step 1: Create ProseMirror plugin**

Follow `cjkLetterSpacing` pattern. Read diagnostics from `lintStore` for active tab. For each diagnostic with `uiHint !== "sourceOnly"`:
- Find the block node at the diagnostic's line number
- Create `Decoration.node()` with lint CSS class for gutter dot + line highlight
- Attach diagnostic message as a data attribute for hover tooltip

- [ ] **Step 2: Create Tiptap extension wrapper**

```typescript
// src/plugins/lint/tiptap.ts
import { Extension } from "@tiptap/core";
import { createLintPlugin } from "./index";
import "./lint.css";

export const LintExtension = Extension.create({
  name: "lint",
  addProseMirrorPlugins() {
    return [createLintPlugin()];
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/plugins/lint/
git commit -m "feat(lint): add ProseMirror lint plugin with block-level decorations"
```

### Task 22: sourceOnly navigation (F2 switches to Source mode)

**Files:**
- Modify: `src/hooks/useViewShortcuts.ts`

- [ ] **Step 1: Update F2 handler**

When `selectNext` returns a diagnostic with `uiHint: "sourceOnly"` and current mode is WYSIWYG:
1. Switch to Source mode
2. Scroll to the diagnostic's line/column position in the CM editor

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(lint): F2 on sourceOnly diagnostic switches to Source mode"
```

---

## Chunk 8: i18n and Documentation

### Task 23: Add i18n keys

**Files:**
- Modify: `src/locales/en/editor.json` — lint message keys
- Modify: `src/locales/en/statusbar.json` — badge/toast keys
- Modify: `src/locales/en/settings.json` — settings keys
- Modify: `src-tauri/locales/en.yml` — menu label keys
- Modify: All 9 non-English locale files (zh-CN, zh-TW, ja, ko, es, fr, de, it, pt-BR)

- [ ] **Step 1: Add English keys** per spec i18n section
- [ ] **Step 2: Add translated keys** for all 9 languages (use translation agents)
- [ ] **Step 3: Run `pnpm lint:i18n`** to verify key parity
- [ ] **Step 4: Commit**

```bash
git commit -m "feat(lint): add i18n keys for lint messages, badge, settings (10 languages)"
```

### Task 24: Update shortcuts documentation

**Files:**
- Modify: `website/guide/shortcuts.md`

- [ ] **Step 1: Add new shortcuts** to the appropriate table:
  - `Alt + Mod + V` — Check Markdown (View section)
  - `F2` — Next Issue (View section)
  - `Shift + F2` — Previous Issue (View section)

- [ ] **Step 2: Commit**

```bash
git commit -m "docs: add lint shortcuts to website guide"
```

---

## Chunk 9: Full Integration Test and Gate

### Task 25: Run full gate

- [ ] **Step 1: Run `pnpm check:all`** — must pass (lint, tests, coverage, build)
- [ ] **Step 2: Run `pnpm lint:i18n`** — verify all locale keys match
- [ ] **Step 3: Verify shortcut conflicts**

```bash
grep -oE 'defaultKey: "[^"]*"' src/stores/shortcutsStore.ts | sort | uniq -c | sort -rn | head -5
```

Expected: no duplicates.

- [ ] **Step 4: Verify Rust compiles**

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```

- [ ] **Step 5: Manual test** — Ask user to:
  1. Open VMark, create a document with known issues
  2. Press `Alt+Mod+V` — verify gutter dots and badge appear
  3. Press `F2` — verify cycling through issues
  4. Edit the document — verify diagnostics clear
  5. Switch to WYSIWYG — verify block-level dots appear
  6. Toggle lint setting off — verify shortcut becomes no-op

- [ ] **Step 6: Final commit if any fixes needed**
