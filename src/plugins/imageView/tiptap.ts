import Image from "@tiptap/extension-image";
import { ImageNodeView } from "./index";

/** Tiptap extension that overrides the default Image node with a custom NodeView. */
export const imageViewExtension = Image.extend({
  addNodeView() {
    return ({ node, getPos, editor }) => {
      return new ImageNodeView(node, getPos, editor);
    };
  },
}).configure({ inline: true });
