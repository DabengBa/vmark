import { Mark, mergeAttributes } from "@tiptap/core";
import "./highlight.css";

/** Tiptap mark extension for text highlighting (renders as `<mark>`). */
export const highlightExtension = Mark.create({
  name: "highlight",
  parseHTML() {
    return [{ tag: "mark" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["mark", mergeAttributes(HTMLAttributes, { class: "md-highlight" }), 0];
  },
});

