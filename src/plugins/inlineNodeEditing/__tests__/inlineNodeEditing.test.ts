/**
 * Tests for inlineNodeEditing — extension structure and computeState logic.
 */

import { describe, it, expect } from "vitest";
import { Schema } from "@tiptap/pm/model";
import { EditorState } from "@tiptap/pm/state";
import { inlineNodeEditingExtension, inlineNodeEditingKey } from "../tiptap";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    text: { group: "inline" },
  },
});

describe("inlineNodeEditingExtension", () => {
  it("has the correct name", () => {
    expect(inlineNodeEditingExtension.name).toBe("inlineNodeEditing");
  });

  it("is an Extension type", () => {
    expect(inlineNodeEditingExtension.type).toBe("extension");
  });

  it("defines ProseMirror plugins via addProseMirrorPlugins", () => {
    const config = inlineNodeEditingExtension.config;
    expect(config.addProseMirrorPlugins).toBeDefined();
    expect(typeof config.addProseMirrorPlugins).toBe("function");
  });

  it("exports a PluginKey", () => {
    expect(inlineNodeEditingKey).toBeDefined();
  });
});

describe("inlineNodeEditing plugin state", () => {
  it("creates state with empty decorations for text-only content", () => {
    const state = EditorState.create({
      doc: schema.node("doc", null, [
        schema.node("paragraph", null, [schema.text("hello world")]),
      ]),
      plugins: inlineNodeEditingExtension.config.addProseMirrorPlugins!.call({
        name: "inlineNodeEditing",
        options: {},
        storage: {},
        parent: null as never,
        editor: {} as never,
        type: "extension" as never,
      }),
    });

    const pluginState = inlineNodeEditingKey.getState(state);
    expect(pluginState).toBeDefined();
    expect(pluginState!.editingNodePos).toBeNull();
    expect(pluginState!.entryDirection).toBeNull();
  });
});
