import { Mark, mergeAttributes } from "@tiptap/core";
import "./underline.css";

export const underlineExtension = Mark.create({
  name: "underline",
  parseHTML() {
    return [{ tag: "u" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["u", mergeAttributes(HTMLAttributes, { class: "md-underline" }), 0];
  },
});
