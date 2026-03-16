import { EditorView } from "@codemirror/view";
import { useSourceCursorContextStore } from "@/stores/sourceCursorContextStore";
import { computeSourceCursorContext } from "@/plugins/sourceContextDetection/cursorContext";

/** Creates a CodeMirror plugin that updates the source cursor context store on selection changes. */
export function createSourceCursorContextPlugin() {
  return EditorView.updateListener.of((update) => {
    const store = useSourceCursorContextStore.getState();
    /* v8 ignore next -- @preserve short-circuit branches and else path not all covered in tests */
    if (store.editorView !== update.view || update.selectionSet || update.docChanged) {
      store.setContext(computeSourceCursorContext(update.view), update.view);
    }
  });
}
