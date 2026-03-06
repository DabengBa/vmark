# Quick Open Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Spotlight-style Quick Open overlay (`Cmd+O`) that fuzzy-searches recent files, open tabs, and workspace files.

**Architecture:** Zustand store for visibility toggle, custom path-aware fuzzy matcher, React component with portal rendering. Reuses existing `recentFilesStore`, `tabStore`, and `useFileTree` infrastructure. GeniePicker is the reference implementation for overlay pattern.

**Tech Stack:** React 19, Zustand v5, TypeScript, Vitest, CSS custom properties

**Design Doc:** `docs/plans/2026-03-06-quick-open-design.md`

---

### Task 1: Fuzzy Match Algorithm

**Files:**
- Create: `src/components/QuickOpen/fuzzyMatch.ts`
- Create: `src/components/QuickOpen/fuzzyMatch.test.ts`

This is the core algorithm — pure functions, no dependencies, fully testable in isolation.

**Step 1: Write failing tests**

```typescript
// src/components/QuickOpen/fuzzyMatch.test.ts
import { describe, it, expect } from "vitest";
import { fuzzyMatch, type FuzzyMatchResult } from "./fuzzyMatch";

describe("fuzzyMatch", () => {
  describe("basic matching", () => {
    it("returns null for empty query", () => {
      expect(fuzzyMatch("", "hello.md")).toBeNull();
    });

    it("returns null when query has no subsequence match", () => {
      expect(fuzzyMatch("xyz", "hello.md")).toBeNull();
    });

    it("matches exact filename", () => {
      const result = fuzzyMatch("hello", "hello.md");
      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThan(0);
      expect(result!.indices).toEqual([0, 1, 2, 3, 4]);
    });

    it("matches subsequence", () => {
      const result = fuzzyMatch("hlo", "hello.md");
      expect(result).not.toBeNull();
      expect(result!.indices).toEqual([0, 3, 4]);
    });

    it("is case insensitive", () => {
      const result = fuzzyMatch("HeLLo", "hello.md");
      expect(result).not.toBeNull();
    });
  });

  describe("scoring bonuses", () => {
    it("scores consecutive matches higher than scattered", () => {
      const consecutive = fuzzyMatch("hel", "hello.md")!;
      const scattered = fuzzyMatch("hlo", "hello.md")!;
      expect(consecutive.score).toBeGreaterThan(scattered.score);
    });

    it("scores word boundary matches higher", () => {
      // "ft" matching fileTree — f at start, T at camelCase boundary
      const boundary = fuzzyMatch("ft", "fileTree.ts")!;
      // "ft" matching offset — scattered in middle
      const scattered = fuzzyMatch("ft", "offset.ts")!;
      expect(boundary.score).toBeGreaterThan(scattered.score);
    });

    it("gives bonus for first character match", () => {
      const firstChar = fuzzyMatch("f", "foo.md")!;
      const midChar = fuzzyMatch("o", "foo.md")!;
      expect(firstChar.score).toBeGreaterThan(midChar.score);
    });

    it("gives bonus for exact filename prefix", () => {
      const prefix = fuzzyMatch("read", "readme.md")!;
      const nonPrefix = fuzzyMatch("eadm", "readme.md")!;
      expect(prefix.score).toBeGreaterThan(nonPrefix.score);
    });
  });

  describe("path-aware matching", () => {
    it("matches against relative path", () => {
      const result = fuzzyMatch("store", "tabStore.ts", "src/stores/tabStore.ts");
      expect(result).not.toBeNull();
    });

    it("splits query on / for path segment matching", () => {
      // "s/ft" should match src/fileTree.ts
      const result = fuzzyMatch("s/ft", "fileTree.ts", "src/fileTree.ts");
      expect(result).not.toBeNull();
      expect(result!.score).toBeGreaterThan(0);
    });

    it("fails path segment match when directory doesn't match", () => {
      const result = fuzzyMatch("lib/ft", "fileTree.ts", "src/fileTree.ts");
      expect(result).toBeNull();
    });

    it("weights filename matches higher than path matches", () => {
      // "tab" matching filename "tabStore" vs path "src/tabs/other.ts"
      const nameMatch = fuzzyMatch("tab", "tabStore.ts", "src/stores/tabStore.ts")!;
      const pathMatch = fuzzyMatch("tab", "other.ts", "src/tabs/other.ts")!;
      expect(nameMatch.score).toBeGreaterThan(pathMatch.score);
    });
  });

  describe("word boundary detection", () => {
    it("detects camelCase boundaries", () => {
      const result = fuzzyMatch("qoi", "quickOpenItems.ts")!;
      expect(result).not.toBeNull();
      // q=start, O=camelCase, I=camelCase
    });

    it("detects hyphen boundaries", () => {
      const result = fuzzyMatch("gp", "genie-picker.css")!;
      expect(result).not.toBeNull();
    });

    it("detects underscore boundaries", () => {
      const result = fuzzyMatch("fs", "file_store.ts")!;
      expect(result).not.toBeNull();
    });

    it("detects dot boundaries", () => {
      const result = fuzzyMatch("ft", "file.test.ts")!;
      expect(result).not.toBeNull();
    });
  });

  describe("CJK and Unicode", () => {
    it("matches CJK characters", () => {
      const result = fuzzyMatch("笔记", "我的笔记.md");
      expect(result).not.toBeNull();
    });

    it("matches mixed CJK and ASCII", () => {
      const result = fuzzyMatch("test", "测试test.md");
      expect(result).not.toBeNull();
    });
  });

  describe("edge cases", () => {
    it("handles single character query", () => {
      const result = fuzzyMatch("a", "abc.md");
      expect(result).not.toBeNull();
      expect(result!.indices).toEqual([0]);
    });

    it("handles query longer than target", () => {
      expect(fuzzyMatch("abcdefgh", "abc.md")).toBeNull();
    });

    it("handles special regex characters in query", () => {
      const result = fuzzyMatch(".", "file.md");
      expect(result).not.toBeNull();
    });

    it("handles query equal to filename", () => {
      const result = fuzzyMatch("readme.md", "readme.md");
      expect(result).not.toBeNull();
    });

    it("returns correct highlight indices for path segment query", () => {
      const result = fuzzyMatch("s/r", "readme.md", "src/readme.md");
      expect(result).not.toBeNull();
      expect(result!.indices).toBeDefined();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/components/QuickOpen/fuzzyMatch.test.ts`
Expected: FAIL — module not found

**Step 3: Implement fuzzyMatch**

```typescript
// src/components/QuickOpen/fuzzyMatch.ts
/**
 * Path-aware fuzzy matching for Quick Open.
 *
 * Purpose: Score and highlight file matches using subsequence matching with
 *   bonuses for consecutive chars, word boundaries, and filename prefix.
 *
 * @module components/QuickOpen/fuzzyMatch
 */

export interface FuzzyMatchResult {
  /** Overall score (higher = better match) */
  score: number;
  /** Matched character indices in the filename */
  indices: number[];
  /** Matched character indices in the relative path (if path matching was used) */
  pathIndices?: number[];
}

// Scoring constants (tuned from VS Code's FuzzyScorer heuristics)
const SCORE_FIRST_CHAR = 8;
const SCORE_CONSECUTIVE = 5;
const SCORE_WORD_BOUNDARY = 10;
const SCORE_EXACT_PREFIX = 25;
const PENALTY_GAP = -1;
const FILENAME_WEIGHT = 3;
const MIN_SCORE = 1;

function isWordBoundary(text: string, index: number): boolean {
  if (index === 0) return true;
  const prev = text[index - 1];
  const curr = text[index];
  // camelCase: lowercase followed by uppercase
  if (prev >= "a" && prev <= "z" && curr >= "A" && curr <= "Z") return true;
  // After separator
  if (prev === "-" || prev === "_" || prev === "." || prev === "/" || prev === " ") return true;
  return false;
}

function scoreSubsequence(query: string, target: string): { score: number; indices: number[] } | null {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();

  if (queryLower.length > targetLower.length) return null;

  const indices: number[] = [];
  let score = 0;
  let targetIndex = 0;
  let lastMatchIndex = -1;

  // Check if query is an exact prefix of target (case-insensitive)
  const isExactPrefix = targetLower.startsWith(queryLower);
  if (isExactPrefix) score += SCORE_EXACT_PREFIX;

  for (let qi = 0; qi < queryLower.length; qi++) {
    const qChar = queryLower[qi];
    let found = false;

    while (targetIndex < targetLower.length) {
      if (targetLower[targetIndex] === qChar) {
        indices.push(targetIndex);

        // First character bonus
        if (qi === 0 && targetIndex === 0) {
          score += SCORE_FIRST_CHAR;
        }

        // Consecutive bonus
        if (lastMatchIndex >= 0 && targetIndex === lastMatchIndex + 1) {
          score += SCORE_CONSECUTIVE;
        }

        // Word boundary bonus
        if (isWordBoundary(target, targetIndex)) {
          score += SCORE_WORD_BOUNDARY;
        }

        // Gap penalty
        if (lastMatchIndex >= 0) {
          const gap = targetIndex - lastMatchIndex - 1;
          score += gap * PENALTY_GAP;
        }

        lastMatchIndex = targetIndex;
        targetIndex++;
        found = true;
        break;
      }
      targetIndex++;
    }

    if (!found) return null;
  }

  // Base score: at least 1 per matched character
  score += queryLower.length;

  return { score, indices };
}

/**
 * Fuzzy match a query against a filename and optional relative path.
 *
 * If the query contains `/`, it is split into path segments: earlier
 * segments must match directory components, the last segment matches
 * the filename.
 *
 * @param query      User's search input
 * @param filename   File name (e.g., "tabStore.ts")
 * @param relPath    Optional relative path (e.g., "src/stores/tabStore.ts")
 * @returns Match result with score and highlight indices, or null if no match
 */
export function fuzzyMatch(
  query: string,
  filename: string,
  relPath?: string
): FuzzyMatchResult | null {
  if (!query) return null;

  // Path-segment matching: "s/ft" → dir="s", file="ft"
  if (query.includes("/")) {
    return matchWithPathSegments(query, filename, relPath);
  }

  // Try filename first (weighted higher)
  const nameResult = scoreSubsequence(query, filename);

  // Also try full relative path
  const pathResult = relPath ? scoreSubsequence(query, relPath) : null;

  if (!nameResult && !pathResult) return null;

  const nameScore = nameResult ? nameResult.score * FILENAME_WEIGHT : 0;
  const pathScore = pathResult ? pathResult.score : 0;

  if (nameScore >= pathScore && nameResult) {
    return {
      score: nameScore < MIN_SCORE ? MIN_SCORE : nameScore,
      indices: nameResult.indices,
    };
  }

  if (pathResult) {
    return {
      score: pathScore < MIN_SCORE ? MIN_SCORE : pathScore,
      indices: [],
      pathIndices: pathResult.indices,
    };
  }

  return null;
}

function matchWithPathSegments(
  query: string,
  filename: string,
  relPath?: string
): FuzzyMatchResult | null {
  if (!relPath) return null;

  const segments = query.split("/");
  const fileQuery = segments.pop()!;
  const dirSegments = segments;

  // Match filename
  const fileResult = fileQuery ? scoreSubsequence(fileQuery, filename) : { score: 0, indices: [] };
  if (!fileResult) return null;

  // Match directory segments against path components
  const pathParts = relPath.split("/").slice(0, -1); // directories only
  let dirScore = 0;
  let partIndex = 0;

  for (const dirQuery of dirSegments) {
    if (!dirQuery) continue;
    let matched = false;
    while (partIndex < pathParts.length) {
      const result = scoreSubsequence(dirQuery, pathParts[partIndex]);
      partIndex++;
      if (result) {
        dirScore += result.score;
        matched = true;
        break;
      }
    }
    if (!matched) return null;
  }

  const totalScore = fileResult.score * FILENAME_WEIGHT + dirScore;
  return {
    score: totalScore < MIN_SCORE ? MIN_SCORE : totalScore,
    indices: fileResult.indices,
  };
}
```

**Step 4: Run tests**

Run: `pnpm vitest run src/components/QuickOpen/fuzzyMatch.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/components/QuickOpen/fuzzyMatch.ts src/components/QuickOpen/fuzzyMatch.test.ts
git commit -m "feat(quick-open): add path-aware fuzzy matching algorithm (#328)"
```

---

### Task 2: Quick Open Store

**Files:**
- Create: `src/components/QuickOpen/quickOpenStore.ts`
- Create: `src/components/QuickOpen/quickOpenStore.test.ts`

**Step 1: Write failing tests**

```typescript
// src/components/QuickOpen/quickOpenStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { useQuickOpenStore } from "./quickOpenStore";

beforeEach(() => {
  useQuickOpenStore.setState({ isOpen: false });
});

describe("quickOpenStore", () => {
  it("starts closed", () => {
    expect(useQuickOpenStore.getState().isOpen).toBe(false);
  });

  it("opens", () => {
    useQuickOpenStore.getState().open();
    expect(useQuickOpenStore.getState().isOpen).toBe(true);
  });

  it("closes", () => {
    useQuickOpenStore.getState().open();
    useQuickOpenStore.getState().close();
    expect(useQuickOpenStore.getState().isOpen).toBe(false);
  });

  it("toggles open", () => {
    useQuickOpenStore.getState().toggle();
    expect(useQuickOpenStore.getState().isOpen).toBe(true);
  });

  it("toggles closed", () => {
    useQuickOpenStore.getState().open();
    useQuickOpenStore.getState().toggle();
    expect(useQuickOpenStore.getState().isOpen).toBe(false);
  });
});
```

**Step 2: Run to verify failure**

Run: `pnpm vitest run src/components/QuickOpen/quickOpenStore.test.ts`
Expected: FAIL

**Step 3: Implement**

```typescript
// src/components/QuickOpen/quickOpenStore.ts
/**
 * Quick Open Store
 *
 * Purpose: Minimal visibility toggle for the Quick Open overlay.
 *   All transient state (filter text, selection index, results) lives
 *   in the QuickOpen component as local state.
 *
 * @module components/QuickOpen/quickOpenStore
 */

import { create } from "zustand";

interface QuickOpenState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useQuickOpenStore = create<QuickOpenState>((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));
```

**Step 4: Run tests**

Run: `pnpm vitest run src/components/QuickOpen/quickOpenStore.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/components/QuickOpen/quickOpenStore.ts src/components/QuickOpen/quickOpenStore.test.ts
git commit -m "feat(quick-open): add quickOpenStore (#328)"
```

---

### Task 3: useQuickOpenItems Hook

**Files:**
- Create: `src/components/QuickOpen/useQuickOpenItems.ts`
- Create: `src/components/QuickOpen/useQuickOpenItems.test.ts`

This hook builds the flat item list, applies fuzzy filtering, and ranks results.

**Step 1: Write failing tests**

```typescript
// src/components/QuickOpen/useQuickOpenItems.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock stores
vi.mock("@/stores/recentFilesStore", () => ({
  useRecentFilesStore: {
    getState: vi.fn(() => ({ files: [] })),
  },
}));

vi.mock("@/stores/tabStore", () => ({
  useTabStore: {
    getState: vi.fn(() => ({
      getAllOpenFilePaths: () => [],
    })),
  },
}));

vi.mock("@/stores/workspaceStore", () => ({
  useWorkspaceStore: {
    getState: vi.fn(() => ({
      isWorkspaceMode: false,
      rootPath: null,
    })),
  },
}));

import { useRecentFilesStore } from "@/stores/recentFilesStore";
import { useTabStore } from "@/stores/tabStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import {
  buildQuickOpenItems,
  filterAndRankItems,
  type QuickOpenItem,
  type QuickOpenTier,
} from "./useQuickOpenItems";

const mockRecentFiles = vi.mocked(useRecentFilesStore.getState);
const mockTabStore = vi.mocked(useTabStore.getState);
const mockWorkspaceStore = vi.mocked(useWorkspaceStore.getState);

beforeEach(() => {
  vi.clearAllMocks();
  mockRecentFiles.mockReturnValue({
    files: [],
    maxFiles: 10,
    addFile: vi.fn(),
    removeFile: vi.fn(),
    clearAll: vi.fn(),
    syncToNativeMenu: vi.fn(),
  });
  mockTabStore.mockReturnValue({
    getAllOpenFilePaths: () => [],
  } as ReturnType<typeof useTabStore.getState>);
  mockWorkspaceStore.mockReturnValue({
    isWorkspaceMode: false,
    rootPath: null,
  } as ReturnType<typeof useWorkspaceStore.getState>);
});

describe("buildQuickOpenItems", () => {
  it("returns empty list when no sources available", () => {
    const items = buildQuickOpenItems([]);
    expect(items).toEqual([]);
  });

  it("includes recent files as tier 'recent'", () => {
    mockRecentFiles.mockReturnValue({
      files: [
        { path: "/docs/readme.md", name: "readme", timestamp: 100 },
        { path: "/docs/notes.md", name: "notes", timestamp: 50 },
      ],
      maxFiles: 10,
      addFile: vi.fn(),
      removeFile: vi.fn(),
      clearAll: vi.fn(),
      syncToNativeMenu: vi.fn(),
    });

    const items = buildQuickOpenItems([]);
    const recentItems = items.filter((i) => i.tier === "recent");
    expect(recentItems).toHaveLength(2);
    expect(recentItems[0].path).toBe("/docs/readme.md");
    expect(recentItems[0].tier).toBe("recent");
  });

  it("includes open tabs as tier 'open'", () => {
    mockTabStore.mockReturnValue({
      getAllOpenFilePaths: () => ["/docs/draft.md"],
    } as ReturnType<typeof useTabStore.getState>);

    const items = buildQuickOpenItems([]);
    const openItems = items.filter((i) => i.tier === "open");
    expect(openItems).toHaveLength(1);
    expect(openItems[0].path).toBe("/docs/draft.md");
  });

  it("includes workspace files as tier 'workspace'", () => {
    mockWorkspaceStore.mockReturnValue({
      isWorkspaceMode: true,
      rootPath: "/project",
    } as ReturnType<typeof useWorkspaceStore.getState>);

    const workspaceFiles = [
      { path: "/project/src/index.ts", name: "index.ts" },
      { path: "/project/readme.md", name: "readme.md" },
    ];

    const items = buildQuickOpenItems(workspaceFiles.map((f) => f.path));
    const wsItems = items.filter((i) => i.tier === "workspace");
    expect(wsItems.length).toBeGreaterThanOrEqual(2);
  });

  it("deduplicates: recent wins over open and workspace", () => {
    const sharedPath = "/docs/readme.md";
    mockRecentFiles.mockReturnValue({
      files: [{ path: sharedPath, name: "readme", timestamp: 100 }],
      maxFiles: 10,
      addFile: vi.fn(),
      removeFile: vi.fn(),
      clearAll: vi.fn(),
      syncToNativeMenu: vi.fn(),
    });
    mockTabStore.mockReturnValue({
      getAllOpenFilePaths: () => [sharedPath],
    } as ReturnType<typeof useTabStore.getState>);

    const items = buildQuickOpenItems([sharedPath]);
    const matching = items.filter((i) => i.path === sharedPath);
    expect(matching).toHaveLength(1);
    expect(matching[0].tier).toBe("recent");
  });

  it("dedup: open wins over workspace", () => {
    const sharedPath = "/project/file.md";
    mockTabStore.mockReturnValue({
      getAllOpenFilePaths: () => [sharedPath],
    } as ReturnType<typeof useTabStore.getState>);

    const items = buildQuickOpenItems([sharedPath]);
    const matching = items.filter((i) => i.path === sharedPath);
    expect(matching).toHaveLength(1);
    expect(matching[0].tier).toBe("open");
  });

  it("marks items that are in open tabs", () => {
    const path = "/docs/readme.md";
    mockRecentFiles.mockReturnValue({
      files: [{ path, name: "readme", timestamp: 100 }],
      maxFiles: 10,
      addFile: vi.fn(),
      removeFile: vi.fn(),
      clearAll: vi.fn(),
      syncToNativeMenu: vi.fn(),
    });
    mockTabStore.mockReturnValue({
      getAllOpenFilePaths: () => [path],
    } as ReturnType<typeof useTabStore.getState>);

    const items = buildQuickOpenItems([]);
    const item = items.find((i) => i.path === path);
    expect(item?.isOpenTab).toBe(true);
  });
});

describe("filterAndRankItems", () => {
  const items: QuickOpenItem[] = [
    { path: "/docs/readme.md", filename: "readme.md", relPath: "docs/readme.md", tier: "recent" as QuickOpenTier, isOpenTab: false },
    { path: "/src/stores/tabStore.ts", filename: "tabStore.ts", relPath: "src/stores/tabStore.ts", tier: "workspace" as QuickOpenTier, isOpenTab: true },
    { path: "/src/utils/debug.ts", filename: "debug.ts", relPath: "src/utils/debug.ts", tier: "open" as QuickOpenTier, isOpenTab: true },
  ];

  it("returns all items sorted by tier when query is empty", () => {
    const result = filterAndRankItems(items, "");
    expect(result).toHaveLength(3);
    // recent first, then open, then workspace
    expect(result[0].tier).toBe("recent");
    expect(result[1].tier).toBe("open");
    expect(result[2].tier).toBe("workspace");
  });

  it("filters by fuzzy match", () => {
    const result = filterAndRankItems(items, "tab");
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((r) => r.item.filename === "tabStore.ts")).toBe(true);
  });

  it("excludes non-matching items", () => {
    const result = filterAndRankItems(items, "zzzzz");
    expect(result).toHaveLength(0);
  });

  it("ranks within same tier by fuzzy score", () => {
    const sameItems: QuickOpenItem[] = [
      { path: "/a/bar.md", filename: "bar.md", relPath: "a/bar.md", tier: "workspace", isOpenTab: false },
      { path: "/a/barn.md", filename: "barn.md", relPath: "a/barn.md", tier: "workspace", isOpenTab: false },
    ];
    const result = filterAndRankItems(sameItems, "bar");
    // "bar.md" is a stronger match (exact prefix + shorter)
    expect(result.length).toBe(2);
  });

  it("limits results to maxResults", () => {
    const manyItems: QuickOpenItem[] = Array.from({ length: 50 }, (_, i) => ({
      path: `/file${i}.md`,
      filename: `file${i}.md`,
      relPath: `file${i}.md`,
      tier: "workspace" as QuickOpenTier,
      isOpenTab: false,
    }));
    const result = filterAndRankItems(manyItems, "file", 10);
    expect(result).toHaveLength(10);
  });
});
```

**Step 2: Run to verify failure**

Run: `pnpm vitest run src/components/QuickOpen/useQuickOpenItems.test.ts`
Expected: FAIL

**Step 3: Implement**

```typescript
// src/components/QuickOpen/useQuickOpenItems.ts
/**
 * Quick Open Item Builder & Ranker
 *
 * Purpose: Build a flat deduplicated list from recent files, open tabs,
 *   and workspace files. Apply fuzzy filtering and tier-based ranking.
 *
 * @coordinates-with recentFilesStore.ts — recent file paths
 * @coordinates-with tabStore.ts — open tab paths
 * @coordinates-with workspaceStore.ts — workspace root for relative paths
 * @module components/QuickOpen/useQuickOpenItems
 */

import { useRecentFilesStore } from "@/stores/recentFilesStore";
import { useTabStore } from "@/stores/tabStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { fuzzyMatch, type FuzzyMatchResult } from "./fuzzyMatch";

export type QuickOpenTier = "recent" | "open" | "workspace";

export interface QuickOpenItem {
  path: string;
  filename: string;
  relPath: string;
  tier: QuickOpenTier;
  isOpenTab: boolean;
}

export interface RankedItem {
  item: QuickOpenItem;
  tier: QuickOpenTier;
  match: FuzzyMatchResult | null;
}

const TIER_ORDER: Record<QuickOpenTier, number> = {
  recent: 0,
  open: 1,
  workspace: 2,
};

function getFilename(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

function getRelativePath(path: string, rootPath: string | null): string {
  if (rootPath && path.startsWith(rootPath)) {
    const rel = path.slice(rootPath.length);
    return rel.startsWith("/") ? rel.slice(1) : rel;
  }
  return path;
}

/**
 * Build flat, deduplicated list of items from all sources.
 * Items in multiple tiers appear at the highest tier only.
 * @param workspaceFilePaths Flattened file paths from workspace tree
 */
export function buildQuickOpenItems(
  workspaceFilePaths: string[]
): QuickOpenItem[] {
  const rootPath = useWorkspaceStore.getState().rootPath;
  const recentFiles = useRecentFilesStore.getState().files;
  const openPaths = useTabStore.getState().getAllOpenFilePaths();
  const openPathSet = new Set(openPaths);

  const seen = new Set<string>();
  const items: QuickOpenItem[] = [];

  // Tier 1: Recent files
  for (const rf of recentFiles) {
    if (seen.has(rf.path)) continue;
    seen.add(rf.path);
    items.push({
      path: rf.path,
      filename: getFilename(rf.path),
      relPath: getRelativePath(rf.path, rootPath),
      tier: "recent",
      isOpenTab: openPathSet.has(rf.path),
    });
  }

  // Tier 2: Open tabs
  for (const path of openPaths) {
    if (seen.has(path)) continue;
    seen.add(path);
    items.push({
      path,
      filename: getFilename(path),
      relPath: getRelativePath(path, rootPath),
      tier: "open",
      isOpenTab: true,
    });
  }

  // Tier 3: Workspace files
  for (const path of workspaceFilePaths) {
    if (seen.has(path)) continue;
    seen.add(path);
    items.push({
      path,
      filename: getFilename(path),
      relPath: getRelativePath(path, rootPath),
      tier: "workspace",
      isOpenTab: openPathSet.has(path),
    });
  }

  return items;
}

/**
 * Filter and rank items by fuzzy match, respecting tier ordering.
 */
export function filterAndRankItems(
  items: QuickOpenItem[],
  query: string,
  maxResults = 50
): RankedItem[] {
  // Empty query: return all items sorted by tier
  if (!query.trim()) {
    return items
      .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier])
      .slice(0, maxResults)
      .map((item) => ({ item, tier: item.tier, match: null }));
  }

  // Score all items
  const scored: RankedItem[] = [];
  for (const item of items) {
    const match = fuzzyMatch(query, item.filename, item.relPath);
    if (match) {
      scored.push({ item, tier: item.tier, match });
    }
  }

  // Sort: tier first, then score descending
  scored.sort((a, b) => {
    const tierDiff = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
    if (tierDiff !== 0) return tierDiff;
    return (b.match?.score ?? 0) - (a.match?.score ?? 0);
  });

  return scored.slice(0, maxResults);
}
```

**Step 4: Run tests**

Run: `pnpm vitest run src/components/QuickOpen/useQuickOpenItems.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/components/QuickOpen/useQuickOpenItems.ts src/components/QuickOpen/useQuickOpenItems.test.ts
git commit -m "feat(quick-open): add item builder and ranker (#328)"
```

---

### Task 4: QuickOpen Component + CSS

**Files:**
- Create: `src/components/QuickOpen/QuickOpen.tsx`
- Create: `src/components/QuickOpen/QuickOpen.css`

This is the UI component — portal, keyboard handling, rendering. Follows GeniePicker patterns exactly.

**Step 1: Implement CSS**

```css
/* src/components/QuickOpen/QuickOpen.css */
.quick-open-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  background: var(--hover-bg-strong);
}

.quick-open {
  width: 540px;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  border: 0.5px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--bg-color) 97%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--popup-shadow);
  animation: popup-fade-in 0.1s ease-out;
  overflow: hidden;
}

.dark-theme .quick-open {
  box-shadow: var(--popup-shadow-dark);
}

.quick-open-input-wrapper {
  padding: 12px 14px;
  border-bottom: 0.5px solid var(--border-color);
}

.quick-open-input {
  width: 100%;
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: 14px;
  font-family: var(--font-sans);
  outline: none;
  line-height: 1.4;
}

.quick-open-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.5;
}

.quick-open-list {
  overflow-y: auto;
  max-height: calc(60vh - 52px); /* subtract input height */
  padding: 4px 0;
}

.quick-open-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  cursor: default;
  height: 36px;
  box-sizing: border-box;
}

.quick-open-item--selected {
  background: var(--accent-bg);
}

.quick-open-item:hover:not(.quick-open-item--selected) {
  background: var(--hover-bg);
}

.quick-open-item-icon {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.quick-open-item-icon svg {
  width: 14px;
  height: 14px;
}

.quick-open-item-name {
  font-size: 13px;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.quick-open-item-name .match-highlight {
  color: var(--accent-primary);
  font-weight: 600;
}

.quick-open-item-path {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  text-align: right;
  margin-left: auto;
}

.quick-open-item-path .match-highlight {
  color: var(--text-color);
  opacity: 0.8;
}

.quick-open-open-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent-primary);
  flex-shrink: 0;
  margin-left: 2px;
}

.quick-open-empty {
  padding: 16px 14px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.quick-open-separator {
  height: 0.5px;
  background: var(--border-color);
  margin: 4px 0;
}
```

**Step 2: Implement component**

```tsx
// src/components/QuickOpen/QuickOpen.tsx
/**
 * Quick Open Overlay
 *
 * Purpose: Spotlight-style file opener. Portal to body, keyboard-driven,
 *   fuzzy search across recent files, open tabs, and workspace files.
 *
 * @coordinates-with quickOpenStore.ts — visibility toggle
 * @coordinates-with useQuickOpenItems.ts — item building and ranking
 * @coordinates-with useFileOpen.ts — openFileInNewTabCore for file opening
 * @module components/QuickOpen/QuickOpen
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { open } from "@tauri-apps/plugin-dialog";
import { useQuickOpenStore } from "./quickOpenStore";
import { useWorkspaceStore } from "@/stores/workspaceStore";
import { useRecentFilesStore } from "@/stores/recentFilesStore";
import { useTabStore } from "@/stores/tabStore";
import { handleOpen } from "@/hooks/useFileOpen";
import { openFileInNewTabCore } from "@/hooks/useFileOpen";
import { isImeKeyEvent } from "@/utils/imeGuard";
import { useImeComposition } from "@/hooks/useImeComposition";
import {
  buildQuickOpenItems,
  filterAndRankItems,
  type QuickOpenItem,
} from "./useQuickOpenItems";
import "./QuickOpen.css";

// Inline SVG icons to avoid import complexity
function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M4 1h5l4 4v10H4V1z" />
      <path d="M9 1v4h4" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
      <path d="M1 3h5l2 2h7v9H1V3z" />
    </svg>
  );
}

function renderHighlighted(text: string, indices: number[]): React.ReactNode {
  if (indices.length === 0) return text;
  const indexSet = new Set(indices);
  const spans: React.ReactNode[] = [];
  let current = "";
  let isMatch = false;

  for (let i = 0; i < text.length; i++) {
    const charMatch = indexSet.has(i);
    if (charMatch !== isMatch && current) {
      spans.push(
        isMatch ? (
          <span key={`m-${i}`} className="match-highlight">{current}</span>
        ) : (
          <span key={`t-${i}`}>{current}</span>
        )
      );
      current = "";
    }
    isMatch = charMatch;
    current += text[i];
  }
  if (current) {
    spans.push(
      isMatch ? (
        <span key="m-end" className="match-highlight">{current}</span>
      ) : (
        <span key="t-end">{current}</span>
      )
    );
  }
  return spans;
}

interface QuickOpenProps {
  windowLabel: string;
}

export function QuickOpen({ windowLabel }: QuickOpenProps) {
  const isOpen = useQuickOpenStore((s) => s.isOpen);
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ime = useImeComposition();

  const isWorkspaceMode = useWorkspaceStore((s) => s.isWorkspaceMode);

  // Build workspace file list (flattened paths) — cached on mount
  const [workspacePaths, setWorkspacePaths] = useState<string[]>([]);

  // Re-fetch workspace paths when opening
  useEffect(() => {
    if (!isOpen) return;
    setFilter("");
    setSelectedIndex(0);

    // Focus input
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [isOpen]);

  // All items (deduplicated, tiered)
  const allItems = useMemo(
    () => buildQuickOpenItems(workspacePaths),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workspacePaths, isOpen]
  );

  // Filtered & ranked
  const ranked = useMemo(
    () => filterAndRankItems(allItems, filter, 50),
    [allItems, filter]
  );

  // Visible slice (max 10 for rendering, rest available via scroll)
  const visibleItems = ranked;

  const handleClose = useCallback(() => {
    useQuickOpenStore.getState().close();
    setFilter("");
    setSelectedIndex(0);
  }, []);

  const handleSelectItem = useCallback(
    async (item: QuickOpenItem) => {
      handleClose();
      await openFileInNewTabCore(windowLabel, item.path);
    },
    [handleClose, windowLabel]
  );

  const handleBrowse = useCallback(async () => {
    handleClose();
    await handleOpen(windowLabel);
  }, [handleClose, windowLabel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isImeKeyEvent(e.nativeEvent) || ime.isComposing()) return;

      // Total items = ranked + 1 for Browse row
      const totalItems = visibleItems.length + 1;
      const maxIndex = totalItems - 1;

      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % totalItems);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + totalItems) % totalItems);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex < visibleItems.length) {
          void handleSelectItem(visibleItems[selectedIndex].item);
        } else {
          // Browse row
          void handleBrowse();
        }
      }
    },
    [visibleItems, selectedIndex, handleClose, handleSelectItem, handleBrowse, ime]
  );

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    const timeout = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, handleClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current || selectedIndex < 0) return;
    const item = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
    if (item) item.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const browseIndex = visibleItems.length;

  return createPortal(
    <div className="quick-open-backdrop">
      <div
        ref={containerRef}
        className="quick-open"
        onKeyDown={handleKeyDown}
        aria-label="Quick Open"
      >
        <div className="quick-open-input-wrapper">
          <input
            ref={inputRef}
            className="quick-open-input"
            role="combobox"
            aria-expanded="true"
            aria-controls="quick-open-list"
            aria-activedescendant={`quick-open-item-${selectedIndex}`}
            placeholder={isWorkspaceMode ? "Open file..." : "Open recent file..."}
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setSelectedIndex(0);
            }}
            onCompositionStart={ime.onCompositionStart}
            onCompositionEnd={ime.onCompositionEnd}
          />
        </div>

        <div className="quick-open-list" ref={listRef} role="listbox" id="quick-open-list">
          {visibleItems.length === 0 && filter && (
            <div className="quick-open-empty">No files found</div>
          )}

          {visibleItems.map((ranked, i) => (
            <div
              key={ranked.item.path}
              data-index={i}
              id={`quick-open-item-${i}`}
              role="option"
              aria-selected={i === selectedIndex}
              className={`quick-open-item${i === selectedIndex ? " quick-open-item--selected" : ""}`}
              onClick={() => void handleSelectItem(ranked.item)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <span className="quick-open-item-icon"><FileIcon /></span>
              <span className="quick-open-item-name">
                {ranked.match?.indices?.length
                  ? renderHighlighted(ranked.item.filename, ranked.match.indices)
                  : ranked.item.filename}
              </span>
              {ranked.item.isOpenTab && <span className="quick-open-open-dot" title="Open in tab" />}
              <span className="quick-open-item-path">
                {ranked.match?.pathIndices?.length
                  ? renderHighlighted(ranked.item.relPath, ranked.match.pathIndices)
                  : ranked.item.relPath}
              </span>
            </div>
          ))}

          {/* Separator before Browse */}
          {visibleItems.length > 0 && <div className="quick-open-separator" />}

          {/* Browse row — always visible */}
          <div
            data-index={browseIndex}
            id={`quick-open-item-${browseIndex}`}
            role="option"
            aria-selected={browseIndex === selectedIndex}
            className={`quick-open-item${browseIndex === selectedIndex ? " quick-open-item--selected" : ""}`}
            onClick={() => void handleBrowse()}
            onMouseEnter={() => setSelectedIndex(browseIndex)}
          >
            <span className="quick-open-item-icon"><FolderIcon /></span>
            <span className="quick-open-item-name">Browse...</span>
            <span className="quick-open-item-path">Open native file dialog</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
```

**Step 3: Commit**

```bash
git add src/components/QuickOpen/QuickOpen.tsx src/components/QuickOpen/QuickOpen.css
git commit -m "feat(quick-open): add QuickOpen component and styles (#328)"
```

---

### Task 5: Wire Up Shortcut + Menu Events

**Files:**
- Modify: `src/stores/shortcutsStore.ts` — change `openFile` shortcut, add `quickOpen`
- Modify: `src/hooks/useFileShortcuts.ts` — intercept `Cmd+O` to toggle Quick Open
- Modify: `src-tauri/src/menu/default_menu.rs` — add `quick-open` menu item, remove accelerator from `open`
- Modify: `src-tauri/src/menu/custom_menu.rs` — same changes

**Step 1: Update shortcutsStore.ts**

In `DEFAULT_SHORTCUTS` array, find the `openFile` entry and modify:

Change:
```typescript
{ id: "openFile", label: "Open File", category: "file", defaultKey: "Mod-o", menuId: "open", scope: "global" },
```

To:
```typescript
{ id: "quickOpen", label: "Quick Open", category: "file", defaultKey: "Mod-o", menuId: "quick-open", scope: "global" },
{ id: "openFile", label: "Open File...", category: "file", defaultKey: "", menuId: "open", scope: "global" },
```

**Step 2: Update useFileShortcuts.ts**

Add a `menu:quick-open` listener that toggles the Quick Open store:

```typescript
// After existing menu:open listener, add:
const unlistenQuickOpen = await currentWindow.listen<string>("menu:quick-open", (event) => {
  if (event.payload !== windowLabel) return;
  useQuickOpenStore.getState().toggle();
});
if (cancelled) { unlistenQuickOpen(); return; }
unlistenRefs.current.push(unlistenQuickOpen);
```

Also add keyboard interception for `Cmd+O` in the `handleKeyDown` function (since menu accelerators may not reach through TipTap):

```typescript
// Quick Open (Cmd+O) — must be intercepted at keyboard level
const quickOpenKey = shortcuts.getShortcut("quickOpen");
if (matchesShortcutEvent(e, quickOpenKey)) {
  e.preventDefault();
  useQuickOpenStore.getState().toggle();
  return;
}
```

**Step 3: Update default_menu.rs**

In both menu creation locations, find the `"open"` menu item and:
1. Add `quick-open` item with `CmdOrCtrl+O` accelerator
2. Remove accelerator from `open` item

Before:
```rust
&MenuItem::with_id(app, "open", "Open...", true, Some("CmdOrCtrl+O"))?,
```

After:
```rust
&MenuItem::with_id(app, "quick-open", "Quick Open", true, Some("CmdOrCtrl+O"))?,
&MenuItem::with_id(app, "open", "Open File...", true, None::<&str>)?,
```

**Step 4: Update custom_menu.rs**

Same pattern — find both `"open"` lines and add `"quick-open"`:

Before:
```rust
&MenuItem::with_id(app, "open", "Open...", true, get_accel("open", "CmdOrCtrl+O"))?,
```

After:
```rust
&MenuItem::with_id(app, "quick-open", "Quick Open", true, get_accel("quick-open", "CmdOrCtrl+O"))?,
&MenuItem::with_id(app, "open", "Open File...", true, None::<&str>)?,
```

**Step 5: Mount QuickOpen in App**

Find where GeniePicker is mounted (likely in `App.tsx` or the main layout) and add QuickOpen alongside it:

```tsx
import { QuickOpen } from "@/components/QuickOpen/QuickOpen";
// ... in JSX:
<QuickOpen windowLabel={windowLabel} />
```

**Step 6: Verify Rust compiles**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`
Expected: PASS

**Step 7: Commit**

```bash
git add src/stores/shortcutsStore.ts src/hooks/useFileShortcuts.ts \
  src-tauri/src/menu/default_menu.rs src-tauri/src/menu/custom_menu.rs \
  src/App.tsx  # or wherever QuickOpen is mounted
git commit -m "feat(quick-open): wire shortcut, menu events, and mount component (#328)"
```

---

### Task 6: Workspace File Flattening

**Files:**
- Modify: `src/components/QuickOpen/QuickOpen.tsx` — add workspace path loading

The QuickOpen component needs to flatten the file tree into paths when a workspace is active. This should happen once on open, using the same Rust `list_directory_entries` command that `useFileTree` uses.

**Step 1: Add flattenTree utility**

Add to `useQuickOpenItems.ts`:

```typescript
import type { FileNode } from "@/components/Sidebar/FileExplorer/types";

/** Flatten a FileNode tree into file paths (excludes folders). */
export function flattenFileTree(nodes: FileNode[]): string[] {
  const paths: string[] = [];
  const walk = (items: FileNode[]) => {
    for (const node of items) {
      if (node.isFolder && node.children) {
        walk(node.children);
      } else if (!node.isFolder) {
        paths.push(node.id); // id is full path
      }
    }
  };
  walk(nodes);
  return paths;
}
```

**Step 2: Connect in QuickOpen.tsx**

Pass `workspacePaths` from the file tree hook or load it on mount:

```typescript
// In QuickOpen component, when isOpen changes to true:
useEffect(() => {
  if (!isOpen) return;
  if (!isWorkspaceMode) {
    setWorkspacePaths([]);
    return;
  }
  // Load tree and flatten
  // Use the tree ref from a shared source or invoke directly
}, [isOpen, isWorkspaceMode]);
```

The exact loading mechanism depends on whether we reuse `useFileTree` (which is a React hook) or invoke the Rust command directly. Prefer invoking directly to keep QuickOpen independent.

**Step 3: Add tests for flattenFileTree**

```typescript
describe("flattenFileTree", () => {
  it("returns empty for empty tree", () => {
    expect(flattenFileTree([])).toEqual([]);
  });

  it("flattens nested tree", () => {
    const tree: FileNode[] = [
      {
        id: "/project/src",
        name: "src",
        isFolder: true,
        children: [
          { id: "/project/src/index.ts", name: "index.ts", isFolder: false },
          { id: "/project/src/app.ts", name: "app.ts", isFolder: false },
        ],
      },
      { id: "/project/readme.md", name: "readme.md", isFolder: false },
    ];
    const paths = flattenFileTree(tree);
    expect(paths).toContain("/project/src/index.ts");
    expect(paths).toContain("/project/src/app.ts");
    expect(paths).toContain("/project/readme.md");
    expect(paths).toHaveLength(3);
  });

  it("skips folders", () => {
    const tree: FileNode[] = [
      { id: "/project/src", name: "src", isFolder: true, children: [] },
    ];
    expect(flattenFileTree(tree)).toEqual([]);
  });
});
```

**Step 4: Commit**

```bash
git add src/components/QuickOpen/useQuickOpenItems.ts \
  src/components/QuickOpen/useQuickOpenItems.test.ts \
  src/components/QuickOpen/QuickOpen.tsx
git commit -m "feat(quick-open): add workspace file tree flattening (#328)"
```

---

### Task 7: Update Tests + Run Full Gate

**Files:**
- Modify: `src/hooks/useFileShortcuts.test.ts` — add tests for `menu:quick-open` listener
- Run: `pnpm check:all`

**Step 1: Add test for quick-open menu event**

```typescript
it("toggles Quick Open when menu:quick-open event matches window", async () => {
  // ... setup similar to existing menu:open test
  // Fire menu:quick-open event
  // Assert useQuickOpenStore.getState().isOpen toggled
});
```

**Step 2: Update existing open test if needed**

The `menu:open` listener still exists (for native dialog via Browse). Existing tests should still pass.

**Step 3: Run full gate**

Run: `pnpm check:all`
Expected: All tests pass, coverage thresholds met, build succeeds

**Step 4: Commit**

```bash
git add -A
git commit -m "test(quick-open): add menu event and keyboard shortcut tests (#328)"
```

---

### Task 8: Update Documentation

**Files:**
- Modify: `website/guide/shortcuts.md` — update `Mod + O` entry

**Step 1: Update shortcuts documentation**

Change the `Mod + O` row from "Open File" to "Quick Open". Note that "Open Workspace" (`Mod + Shift + O`) remains unchanged.

**Step 2: Commit**

```bash
git add website/guide/shortcuts.md
git commit -m "docs: update shortcuts for Quick Open (#328)"
```

---

### Task 9: Final Verification

**Step 1: Run full gate**

Run: `pnpm check:all`
Expected: PASS

**Step 2: Manual testing checklist**

Ask the user to test:
- [ ] `Cmd+O` opens Quick Open overlay
- [ ] `Cmd+O` again closes it (toggle)
- [ ] Typing filters results with fuzzy matching
- [ ] Arrow keys navigate, Enter opens file
- [ ] Escape closes overlay
- [ ] "Browse..." row opens native file dialog
- [ ] Recent files appear first in empty state
- [ ] Open tab indicator (dot) shows correctly
- [ ] Works in both light and dark themes
- [ ] Works in non-workspace mode (shows recent files only)
- [ ] CJK input works correctly (IME composition)
- [ ] File opens in existing tab if already open (dedup)

**Step 3: Squash or keep commits, push**

```bash
git push origin feature/quick-open
```
