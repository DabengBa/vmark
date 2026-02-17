import { describe, it, expect, beforeEach } from "vitest";
import { useGeniesStore } from "../geniesStore";
import type { GenieDefinition } from "@/types/aiGenies";

function makeGenie(overrides: Partial<GenieDefinition> & { name: string }): GenieDefinition {
  return {
    metadata: {
      name: overrides.name,
      description: overrides.metadata?.description ?? `Description for ${overrides.name}`,
      scope: overrides.metadata?.scope ?? "selection",
      category: overrides.metadata?.category,
    },
    template: overrides.template ?? "template",
    filePath: overrides.filePath ?? `/genies/${overrides.name}.md`,
    source: "global",
  };
}

describe("geniesStore", () => {
  beforeEach(() => {
    useGeniesStore.setState({
      genies: [],
      loading: false,
      recentGenieNames: [],
      favoriteGenieNames: [],
    });
  });

  // ── Initialization ──────────────────────────────────────────────────

  it("initializes with empty genies", () => {
    const state = useGeniesStore.getState();
    expect(state.genies).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.recentGenieNames).toEqual([]);
    expect(state.favoriteGenieNames).toEqual([]);
  });

  // ── addRecent ───────────────────────────────────────────────────────

  it("adds a genie name to recents", () => {
    useGeniesStore.getState().addRecent("Translate");
    expect(useGeniesStore.getState().recentGenieNames).toEqual(["Translate"]);
  });

  it("moves duplicate to the top (MRU order)", () => {
    const { addRecent } = useGeniesStore.getState();
    addRecent("A");
    addRecent("B");
    addRecent("C");
    addRecent("A"); // re-add
    expect(useGeniesStore.getState().recentGenieNames).toEqual(["A", "C", "B"]);
  });

  it("caps recents at 10", () => {
    const { addRecent } = useGeniesStore.getState();
    for (let i = 0; i < 15; i++) {
      addRecent(`genie-${i}`);
    }
    const { recentGenieNames } = useGeniesStore.getState();
    expect(recentGenieNames).toHaveLength(10);
    expect(recentGenieNames[0]).toBe("genie-14");
    expect(recentGenieNames).not.toContain("genie-0");
  });

  // ── toggleFavorite / isFavorite ─────────────────────────────────────

  it("toggles favorite on", () => {
    useGeniesStore.getState().toggleFavorite("Summarize");
    expect(useGeniesStore.getState().favoriteGenieNames).toEqual(["Summarize"]);
    expect(useGeniesStore.getState().isFavorite("Summarize")).toBe(true);
  });

  it("toggles favorite off", () => {
    useGeniesStore.getState().toggleFavorite("Summarize");
    useGeniesStore.getState().toggleFavorite("Summarize");
    expect(useGeniesStore.getState().favoriteGenieNames).toEqual([]);
    expect(useGeniesStore.getState().isFavorite("Summarize")).toBe(false);
  });

  it("isFavorite returns false for unknown name", () => {
    expect(useGeniesStore.getState().isFavorite("nonexistent")).toBe(false);
  });

  // ── searchGenies ────────────────────────────────────────────────────

  describe("searchGenies", () => {
    beforeEach(() => {
      useGeniesStore.setState({
        genies: [
          makeGenie({ name: "Translate", metadata: { name: "Translate", description: "Translate text", scope: "selection", category: "Language" } }),
          makeGenie({ name: "Summarize", metadata: { name: "Summarize", description: "Create summary", scope: "document", category: "Writing" } }),
          makeGenie({ name: "Fix Grammar", metadata: { name: "Fix Grammar", description: "Fix grammar issues", scope: "selection", category: "Language" } }),
        ],
      });
    });

    it("returns all genies when query is empty", () => {
      const result = useGeniesStore.getState().searchGenies("");
      expect(result).toHaveLength(3);
    });

    it("searches by name case-insensitively", () => {
      const result = useGeniesStore.getState().searchGenies("translate");
      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe("Translate");
    });

    it("searches by description", () => {
      const result = useGeniesStore.getState().searchGenies("summary");
      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe("Summarize");
    });

    it("searches by category", () => {
      const result = useGeniesStore.getState().searchGenies("language");
      expect(result).toHaveLength(2);
    });

    it("filters by scope", () => {
      const result = useGeniesStore.getState().searchGenies("", "document");
      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe("Summarize");
    });

    it("combines query and scope filter", () => {
      const result = useGeniesStore.getState().searchGenies("fix", "selection");
      expect(result).toHaveLength(1);
      expect(result[0].metadata.name).toBe("Fix Grammar");
    });

    it("returns empty when nothing matches", () => {
      const result = useGeniesStore.getState().searchGenies("zzz");
      expect(result).toEqual([]);
    });

    it("returns empty when scope doesn't match", () => {
      const result = useGeniesStore.getState().searchGenies("translate", "document");
      expect(result).toEqual([]);
    });
  });

  // ── getGroupedByCategory ────────────────────────────────────────────

  describe("getGroupedByCategory", () => {
    it("returns empty map when no genies loaded", () => {
      const grouped = useGeniesStore.getState().getGroupedByCategory();
      expect(grouped.size).toBe(0);
    });

    it("groups genies by category", () => {
      useGeniesStore.setState({
        genies: [
          makeGenie({ name: "A", metadata: { name: "A", description: "a", scope: "selection", category: "Writing" } }),
          makeGenie({ name: "B", metadata: { name: "B", description: "b", scope: "selection", category: "Language" } }),
          makeGenie({ name: "C", metadata: { name: "C", description: "c", scope: "selection", category: "Writing" } }),
        ],
      });
      const grouped = useGeniesStore.getState().getGroupedByCategory();
      expect(grouped.get("Writing")).toHaveLength(2);
      expect(grouped.get("Language")).toHaveLength(1);
    });

    it("uses 'Uncategorized' for genies without category", () => {
      useGeniesStore.setState({
        genies: [
          makeGenie({ name: "NoCat", metadata: { name: "NoCat", description: "x", scope: "selection" } }),
        ],
      });
      const grouped = useGeniesStore.getState().getGroupedByCategory();
      expect(grouped.get("Uncategorized")).toHaveLength(1);
    });
  });

  // ── getRecent ───────────────────────────────────────────────────────

  describe("getRecent", () => {
    it("returns matching genie definitions in MRU order", () => {
      const genies = [
        makeGenie({ name: "A" }),
        makeGenie({ name: "B" }),
        makeGenie({ name: "C" }),
      ];
      useGeniesStore.setState({
        genies,
        recentGenieNames: ["C", "A"],
      });
      const recent = useGeniesStore.getState().getRecent();
      expect(recent.map((g) => g.metadata.name)).toEqual(["C", "A"]);
    });

    it("skips recent names that no longer have a genie definition", () => {
      useGeniesStore.setState({
        genies: [makeGenie({ name: "A" })],
        recentGenieNames: ["A", "Deleted"],
      });
      const recent = useGeniesStore.getState().getRecent();
      expect(recent).toHaveLength(1);
      expect(recent[0].metadata.name).toBe("A");
    });

    it("returns empty when no recents", () => {
      useGeniesStore.setState({ genies: [makeGenie({ name: "A" })] });
      expect(useGeniesStore.getState().getRecent()).toEqual([]);
    });
  });

  // ── SSR guard ───────────────────────────────────────────────────────

  it("store is functional (SSR guard does not break initialization)", () => {
    const state = useGeniesStore.getState();
    expect(Array.isArray(state.genies)).toBe(true);
    expect(typeof state.loadGenies).toBe("function");
    expect(typeof state.searchGenies).toBe("function");
    expect(typeof state.addRecent).toBe("function");
    expect(typeof state.toggleFavorite).toBe("function");
    expect(typeof state.isFavorite).toBe("function");
    expect(typeof state.getRecent).toBe("function");
    expect(typeof state.getGroupedByCategory).toBe("function");
  });
});
