/**
 * Markdown Copy Extension
 *
 * Customizes the text/plain clipboard content on copy/cut.
 * When the "Copy format" setting is "markdown", converts the
 * selection to markdown syntax instead of flattened plain text.
 *
 * Uses ProseMirror's `clipboardTextSerializer` prop — the designed
 * extension point for customizing text/plain on copy/cut.
 * text/html remains untouched (ProseMirror handles it).
 */

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { Fragment, Slice, type Schema, type Node as PMNode, type NodeType } from "@tiptap/pm/model";
import { serializeMarkdown } from "@/utils/markdownPipeline";
import { useSettingsStore } from "@/stores/settingsStore";

const markdownCopyPluginKey = new PluginKey("markdownCopy");

/**
 * Ensures content has at least one block node.
 * Wraps inline content in a paragraph if needed.
 */
function ensureBlockContent(content: Fragment, paragraphType: NodeType | undefined): Fragment {
  if (content.childCount === 0 && paragraphType) {
    return Fragment.from(paragraphType.create());
  }
  const firstChild = content.firstChild;
  if (firstChild && !firstChild.isBlock && paragraphType) {
    return Fragment.from(paragraphType.create(null, content));
  }
  return content;
}

function createDocFromSlice(schema: Schema, slice: Slice): PMNode {
  const docType = schema.topNodeType;
  const content = ensureBlockContent(slice.content, schema.nodes.paragraph);

  try {
    return docType.create(null, content);
  } catch {
    return docType.createAndFill() ?? docType.create();
  }
}

export const markdownCopyExtension = Extension.create({
  name: "markdownCopy",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: markdownCopyPluginKey,
        props: {
          clipboardTextSerializer(slice: Slice, view: EditorView) {
            const { copyFormat } = useSettingsStore.getState().markdown;
            if (copyFormat !== "markdown") {
              // Return empty string — PM falls through to default textBetween
              return "";
            }

            try {
              const { schema } = view.state;
              const doc = createDocFromSlice(schema, slice);
              const md = serializeMarkdown(schema, doc);
              // Collapse 3+ consecutive newlines to 2 (one blank line max)
              return md.replace(/\n{3,}/g, "\n\n");
            } catch (error) {
              if (import.meta.env.DEV) {
                console.warn("[markdownCopy] Serialization failed, falling back to plain text:", error);
              }
              return "";
            }
          },
        },
      }),
    ];
  },
});
