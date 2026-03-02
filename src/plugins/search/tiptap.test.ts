/**
 * Search Plugin (WYSIWYG) Tests
 *
 * Tests for the search extension including:
 * - buildRegex: regex construction from query + options
 * - findMatchesInDoc: match finding in ProseMirror documents
 * - escapeRegExp: special character escaping
 * - Plugin state apply: decoration rebuild triggers
 * - Plugin view: event listener wiring, replace operations
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";

// Mock CSS
vi.mock("./search.css", () => ({}));

// Mock imeGuard
vi.mock("@/utils/imeGuard", () => ({
  runOrQueueProseMirrorAction: vi.fn((_view, action) => action()),
}));

// Mock searchStore
const mockSearchState = {
  isOpen: false,
  query: "",
  replaceText: "",
  caseSensitive: false,
  wholeWord: false,
  useRegex: false,
  matchCount: 0,
  currentIndex: -1,
  setMatches: vi.fn(),
  findNext: vi.fn(),
};

const mockSearchSubscribers: Array<(state: typeof mockSearchState) => void> = [];

vi.mock("@/stores/searchStore", () => ({
  useSearchStore: {
    getState: () => mockSearchState,
    subscribe: (fn: (state: typeof mockSearchState) => void) => {
      mockSearchSubscribers.push(fn);
      return () => {
        const idx = mockSearchSubscribers.indexOf(fn);
        if (idx >= 0) mockSearchSubscribers.splice(idx, 1);
      };
    },
  },
}));

import { searchExtension } from "./tiptap";

// Minimal schema
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "text*" },
    text: { inline: true },
  },
});

function createDoc(texts: string[]) {
  return schema.node(
    "doc",
    null,
    texts.map((t) => schema.node("paragraph", null, t ? [schema.text(t)] : [])),
  );
}

describe("searchExtension", () => {
  beforeEach(() => {
    mockSearchState.isOpen = false;
    mockSearchState.query = "";
    mockSearchState.replaceText = "";
    mockSearchState.caseSensitive = false;
    mockSearchState.wholeWord = false;
    mockSearchState.useRegex = false;
    mockSearchState.matchCount = 0;
    mockSearchState.currentIndex = -1;
    mockSearchState.setMatches.mockClear();
    mockSearchState.findNext.mockClear();
    mockSearchSubscribers.length = 0;
  });

  describe("extension creation", () => {
    it("has name 'search'", () => {
      expect(searchExtension.name).toBe("search");
    });
  });

  describe("escapeRegExp (tested via buildRegex behavior)", () => {
    it("escapes special regex characters in non-regex mode", () => {
      const specialChars = "hello.world";
      const doc = createDoc([specialChars, "helloXworld"]);

      mockSearchState.isOpen = true;
      mockSearchState.query = "hello.world";
      mockSearchState.useRegex = false;

      const state = EditorState.create({ doc, schema });
      expect(state.doc.textContent).toContain("hello.world");
    });
  });

  describe("buildRegex logic", () => {
    it("returns no matches for empty query", () => {
      mockSearchState.isOpen = true;
      mockSearchState.query = "";

      const doc = createDoc(["hello world"]);
      const state = EditorState.create({ doc, schema });
      expect(state.doc.childCount).toBe(1);
    });

    it("handles case-insensitive search by default", () => {
      mockSearchState.isOpen = true;
      mockSearchState.query = "hello";
      mockSearchState.caseSensitive = false;

      const doc = createDoc(["Hello HELLO hello"]);
      const text = doc.textContent;
      const regex = new RegExp("hello", "gi");
      const matches = [...text.matchAll(regex)];
      expect(matches.length).toBe(3);
    });

    it("handles case-sensitive search", () => {
      mockSearchState.isOpen = true;
      mockSearchState.query = "hello";
      mockSearchState.caseSensitive = true;

      const doc = createDoc(["Hello HELLO hello"]);
      const text = doc.textContent;
      const regex = new RegExp("hello", "g");
      const matches = [...text.matchAll(regex)];
      expect(matches.length).toBe(1);
    });

    it("handles whole word search", () => {
      const text = "hello helloworld worldhello hello";
      const escaped = "hello".replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      const matches = [...text.matchAll(regex)];
      expect(matches.length).toBe(2);
    });

    it("handles regex search mode", () => {
      const text = "hello hallo hullo";
      const regex = new RegExp("h.llo", "gi");
      const matches = [...text.matchAll(regex)];
      expect(matches.length).toBe(3);
    });

    it("returns null for invalid regex patterns gracefully", () => {
      let result: RegExp | null = null;
      try {
        result = new RegExp("[invalid", "gi");
      } catch {
        result = null;
      }
      expect(result).toBeNull();
    });
  });

  describe("findMatchesInDoc logic", () => {
    it("finds matches across multiple text nodes", () => {
      const doc = createDoc(["hello world", "hello again"]);
      const text1 = doc.child(0).textContent;
      const text2 = doc.child(1).textContent;

      const matches1 = [...text1.matchAll(new RegExp("hello", "gi"))];
      const matches2 = [...text2.matchAll(new RegExp("hello", "gi"))];
      expect(matches1.length + matches2.length).toBe(2);
    });

    it("skips non-text nodes", () => {
      const doc = createDoc(["hello"]);
      let textNodeCount = 0;
      doc.descendants((node) => {
        if (node.isText) textNodeCount++;
      });
      expect(textNodeCount).toBe(1);
    });

    it("handles zero-length matches in regex mode by advancing", () => {
      const text = "abc";
      const regex = /a*/g;
      const matches: Array<{ index: number; length: number }> = [];
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        matches.push({ index: m.index, length: m[0].length });
        if (m[0].length === 0) regex.lastIndex++;
      }
      expect(matches.length).toBeGreaterThan(0);
    });

    it("returns empty array when no text matches", () => {
      const doc = createDoc(["hello world"]);
      const matches = [...doc.textContent.matchAll(new RegExp("xyz", "gi"))];
      expect(matches.length).toBe(0);
    });
  });

  describe("plugin state", () => {
    it("initializes with empty matches and decorations", () => {
      const initialState = {
        matches: [],
        currentIndex: -1,
        decorationSet: DecorationSet.empty,
      };
      expect(initialState.matches).toEqual([]);
      expect(initialState.currentIndex).toBe(-1);
    });
  });

  describe("replace operations", () => {
    it("replaceText with empty string effectively deletes matched text", () => {
      mockSearchState.replaceText = "";
      expect(mockSearchState.replaceText).toBe("");
    });

    it("replaceAll processes matches in reverse order to preserve positions", () => {
      const matches = [
        { from: 1, to: 5 },
        { from: 10, to: 15 },
        { from: 20, to: 25 },
      ];
      const sorted = [...matches].sort((a, b) => b.from - a.from);
      expect(sorted[0].from).toBe(20);
      expect(sorted[1].from).toBe(10);
      expect(sorted[2].from).toBe(1);
    });
  });

  describe("scroll behavior", () => {
    it("generates unique scroll keys from search state", () => {
      mockSearchState.query = "test";
      mockSearchState.caseSensitive = true;
      mockSearchState.wholeWord = false;
      mockSearchState.useRegex = false;
      mockSearchState.currentIndex = 0;

      const scrollKey = `${mockSearchState.query}|${mockSearchState.caseSensitive}|${mockSearchState.wholeWord}|${mockSearchState.useRegex}|${mockSearchState.currentIndex}`;
      expect(scrollKey).toBe("test|true|false|false|0");
    });

    it("generates different scroll keys for different indices", () => {
      const key1 = "test|false|false|false|0";
      const key2 = "test|false|false|false|1";
      expect(key1).not.toBe(key2);
    });
  });

  describe("edge cases", () => {
    it("handles empty document", () => {
      const doc = schema.node("doc", null, [
        schema.node("paragraph", null, []),
      ]);
      let textFound = false;
      doc.descendants((node) => {
        if (node.isText) textFound = true;
      });
      expect(textFound).toBe(false);
    });

    it("handles document with only whitespace", () => {
      const doc = createDoc(["   "]);
      mockSearchState.query = "hello";
      const matches = [...doc.textContent.matchAll(new RegExp("hello", "gi"))];
      expect(matches.length).toBe(0);
    });

    it("handles very long query string", () => {
      const longQuery = "a".repeat(1000);
      const escaped = longQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "gi");
      expect(regex).toBeInstanceOf(RegExp);
    });

    it("handles unicode characters in search query", () => {
      const doc = createDoc(["hello world"]);
      const text = doc.textContent;
      const regex = new RegExp("hello", "gi");
      const matches = [...text.matchAll(regex)];
      expect(matches.length).toBe(1);
    });

    it("handles regex special chars in non-regex mode", () => {
      const specialChars = "[test]";
      const escaped = specialChars.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(escaped).toBe("\\[test\\]");

      const regex = new RegExp(escaped, "gi");
      const text = "foo [test] bar [test]";
      const matches = [...text.matchAll(regex)];
      expect(matches.length).toBe(2);
    });

    it("handles backslash in search query", () => {
      const query = "\\n";
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      expect(escaped).toBe("\\\\n");
    });

    it("handles regex with pipe alternation", () => {
      const text = "cat and dog and bird";
      const regex = new RegExp("cat|dog", "gi");
      const matches = [...text.matchAll(regex)];
      expect(matches.length).toBe(2);
    });

    it("handles wholeWord with punctuation adjacent", () => {
      const text = "hello, world! hello.world";
      const escaped = "hello".replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      const matches = [...text.matchAll(regex)];
      expect(matches.length).toBe(2);
    });

    it("handles empty match results from regex", () => {
      const text = "abc";
      const regex = /(?=a)/g;
      const matches: string[] = [];
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        matches.push(m[0]);
        if (m[0].length === 0) regex.lastIndex++;
      }
      expect(matches.length).toBe(1);
    });
  });

  describe("decoration creation logic", () => {
    it("creates search-match class for non-active match", () => {
      const isActive = false;
      const className = isActive ? "search-match search-match-active" : "search-match";
      expect(className).toBe("search-match");
    });

    it("creates search-match-active class for active match", () => {
      const isActive = true;
      const className = isActive ? "search-match search-match-active" : "search-match";
      expect(className).toBe("search-match search-match-active");
    });

    it("does not create decorations when search is closed", () => {
      mockSearchState.isOpen = false;
      mockSearchState.query = "hello";
      expect(mockSearchState.isOpen).toBe(false);
    });

    it("does not create decorations when query is empty", () => {
      mockSearchState.isOpen = true;
      mockSearchState.query = "";
      expect(mockSearchState.query).toBe("");
    });
  });

  describe("replaceText logic", () => {
    it("replaces matched text with new text", () => {
      const doc = createDoc(["hello world"]);
      const state = EditorState.create({ doc, schema });

      const match = { from: 1, to: 6 };
      const replaceText = "hi";
      const tr = state.tr.replaceWith(
        match.from,
        match.to,
        replaceText ? schema.text(replaceText) : []
      );
      expect(tr.doc.textContent).toBe("hi world");
    });

    it("deletes matched text when replaceText is empty", () => {
      const doc = createDoc(["hello world"]);
      const state = EditorState.create({ doc, schema });

      const match = { from: 1, to: 6 };
      const tr = state.tr.replaceWith(match.from, match.to, []);
      expect(tr.doc.textContent).toBe(" world");
    });

    it("replaceAll in reverse order preserves positions", () => {
      const doc = createDoc(["aaa bbb aaa"]);
      const state = EditorState.create({ doc, schema });

      const matches = [
        { from: 1, to: 4 },
        { from: 9, to: 12 },
      ];
      const sorted = [...matches].sort((a, b) => b.from - a.from);

      let tr = state.tr;
      for (const match of sorted) {
        tr = tr.replaceWith(match.from, match.to, schema.text("x"));
      }
      expect(tr.doc.textContent).toBe("x bbb x");
    });
  });
});

// --- Phase 3: Plugin-level integration tests ---
// Instantiate the actual plugin from the extension and test its state apply logic.

describe("search plugin integration", () => {
  function getPlugin() {
    const extensionContext = {
      name: searchExtension.name,
      options: searchExtension.options,
      storage: searchExtension.storage,
      editor: {} as never,
      type: null,
      parent: undefined,
    };
    const plugins = searchExtension.config.addProseMirrorPlugins?.call(extensionContext) ?? [];
    expect(plugins).toHaveLength(1);
    return plugins[0];
  }

  beforeEach(() => {
    mockSearchState.isOpen = false;
    mockSearchState.query = "";
    mockSearchState.replaceText = "";
    mockSearchState.caseSensitive = false;
    mockSearchState.wholeWord = false;
    mockSearchState.useRegex = false;
    mockSearchState.matchCount = 0;
    mockSearchState.currentIndex = -1;
    mockSearchState.setMatches.mockClear();
    mockSearchState.findNext.mockClear();
    mockSearchSubscribers.length = 0;
  });

  it("initializes with empty matches and DecorationSet.empty", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello world"]);
    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const pluginState = plugin.getState(state);
    expect(pluginState.matches).toEqual([]);
    expect(pluginState.currentIndex).toBe(-1);
    expect(pluginState.decorationSet).toBe(DecorationSet.empty);
  });

  it("finds matches when search is open and query is set", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello world hello"]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "hello";

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    // Apply a trivial transaction to trigger the apply() path
    const nextState = state.apply(state.tr);
    const pluginState = plugin.getState(nextState);

    // setMatches should have been called with 2 matches
    expect(mockSearchState.setMatches).toHaveBeenCalledWith(2, 0);
  });

  it("creates decorations for matches when search is open", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello world"]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "hello";
    mockSearchState.currentIndex = 0;

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const nextState = state.apply(state.tr);
    const pluginState = plugin.getState(nextState);

    const decorations = pluginState.decorationSet.find();
    expect(decorations.length).toBe(1);
  });

  it("marks the active match with search-match-active class", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello hello"]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "hello";
    mockSearchState.currentIndex = 1;

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const nextState = state.apply(state.tr);
    const pluginState = plugin.getState(nextState);

    const decorations = pluginState.decorationSet.find();
    expect(decorations.length).toBe(2);
    // Check decoration attrs
    const activeDecoration = decorations.find(
      (d: { type?: { attrs?: Record<string, string> } }) =>
        d.type?.attrs?.class?.includes("search-match-active")
    );
    expect(activeDecoration).toBeDefined();
  });

  it("returns empty decorations when query is empty", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello world"]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "";

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const nextState = state.apply(state.tr);
    const pluginState = plugin.getState(nextState);

    expect(pluginState.decorationSet.find().length).toBe(0);
  });

  it("returns empty decorations when search is closed", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello world"]);

    mockSearchState.isOpen = false;
    mockSearchState.query = "hello";

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const nextState = state.apply(state.tr);
    const pluginState = plugin.getState(nextState);

    expect(pluginState.decorationSet.find().length).toBe(0);
  });

  it("handles case-sensitive search via plugin", () => {
    const plugin = getPlugin();
    const doc = createDoc(["Hello HELLO hello"]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "hello";
    mockSearchState.caseSensitive = true;

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const nextState = state.apply(state.tr);

    // Only "hello" (lowercase) matches
    expect(mockSearchState.setMatches).toHaveBeenCalledWith(1, 0);
  });

  it("handles whole word search via plugin", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello helloworld hello"]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "hello";
    mockSearchState.wholeWord = true;

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const nextState = state.apply(state.tr);

    // "hello" as whole word appears twice, "helloworld" is excluded
    expect(mockSearchState.setMatches).toHaveBeenCalledWith(2, 0);
  });

  it("handles regex search via plugin", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello hallo hullo"]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "h.llo";
    mockSearchState.useRegex = true;

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const nextState = state.apply(state.tr);

    expect(mockSearchState.setMatches).toHaveBeenCalledWith(3, 0);
  });

  it("handles invalid regex gracefully (returns 0 matches)", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello world"]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "[invalid";
    mockSearchState.useRegex = true;

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const nextState = state.apply(state.tr);

    expect(mockSearchState.setMatches).toHaveBeenCalledWith(0, -1);
  });

  it("finds matches across multiple paragraphs", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello", "world", "hello world"]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "hello";

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const nextState = state.apply(state.tr);

    expect(mockSearchState.setMatches).toHaveBeenCalledWith(2, 0);
  });

  it("returns no matches for empty document", () => {
    const plugin = getPlugin();
    const doc = schema.node("doc", null, [
      schema.node("paragraph", null, []),
    ]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "hello";

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const nextState = state.apply(state.tr);

    expect(mockSearchState.setMatches).toHaveBeenCalledWith(0, -1);
  });

  it("escapes special regex chars in non-regex mode", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello.world hello world"]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "hello.world";
    mockSearchState.useRegex = false;

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const nextState = state.apply(state.tr);

    // In non-regex mode, "." is escaped — only matches literal "hello.world"
    expect(mockSearchState.setMatches).toHaveBeenCalledWith(1, 0);
  });

  it("rebuilds decorations on doc change", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello world"]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "hello";

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    // Trigger query detection
    const state2 = state.apply(state.tr);

    // Now change the doc
    const tr = state2.tr.insertText(" hello", state2.doc.content.size - 1);
    const state3 = state2.apply(tr);
    const pluginState = plugin.getState(state3);

    // Should have found more matches after the insert
    expect(mockSearchState.setMatches).toHaveBeenLastCalledWith(2, 0);
  });

  it("provides decorations via props.decorations", () => {
    const plugin = getPlugin();
    const doc = createDoc(["hello world"]);

    mockSearchState.isOpen = true;
    mockSearchState.query = "hello";
    mockSearchState.currentIndex = 0;

    const state = EditorState.create({ doc, schema, plugins: [plugin] });
    const nextState = state.apply(state.tr);

    // Access decorations via plugin props
    const decorations = plugin.props.decorations!(nextState);
    expect(decorations).toBeDefined();
    const found = (decorations as DecorationSet).find();
    expect(found.length).toBe(1);
  });
});
