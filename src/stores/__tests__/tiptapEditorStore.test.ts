import { useTiptapEditorStore } from "../tiptapEditorStore";
import type { CursorContext } from "@/plugins/toolbarContext/types";

// Minimal mock for TiptapEditor — only the `.view` property is accessed by the store
const mockView = { state: {}, dispatch: vi.fn() } as unknown as import("@tiptap/pm/view").EditorView;
const mockEditor = { view: mockView } as unknown as import("@tiptap/core").Editor;

const mockContext: CursorContext = {
  hasSelection: false,
  atLineStart: true,
  contextMode: "insert",
  surface: "wysiwyg",
};

beforeEach(() => {
  useTiptapEditorStore.getState().clear();
});

describe("tiptapEditorStore", () => {
  it("initializes with null values", () => {
    const state = useTiptapEditorStore.getState();
    expect(state.editor).toBeNull();
    expect(state.editorView).toBeNull();
    expect(state.context).toBeNull();
  });

  it("setEditor stores editor and its view", () => {
    useTiptapEditorStore.getState().setEditor(mockEditor);
    const state = useTiptapEditorStore.getState();
    expect(state.editor).toBe(mockEditor);
    expect(state.editorView).toBe(mockView);
  });

  it("setEditor(null) clears editor and view", () => {
    useTiptapEditorStore.getState().setEditor(mockEditor);
    useTiptapEditorStore.getState().setEditor(null);
    const state = useTiptapEditorStore.getState();
    expect(state.editor).toBeNull();
    expect(state.editorView).toBeNull();
  });

  it("setContext stores context and view", () => {
    const secondView = { state: {}, dispatch: vi.fn() } as unknown as import("@tiptap/pm/view").EditorView;
    useTiptapEditorStore.getState().setContext(mockContext, secondView);
    const state = useTiptapEditorStore.getState();
    expect(state.context).toBe(mockContext);
    expect(state.editorView).toBe(secondView);
  });

  it("setContext updates view independently of setEditor", () => {
    useTiptapEditorStore.getState().setEditor(mockEditor);
    expect(useTiptapEditorStore.getState().editorView).toBe(mockView);

    const newView = { state: {}, dispatch: vi.fn() } as unknown as import("@tiptap/pm/view").EditorView;
    useTiptapEditorStore.getState().setContext(mockContext, newView);
    // editorView now reflects the view passed to setContext
    expect(useTiptapEditorStore.getState().editorView).toBe(newView);
    // editor reference is unchanged
    expect(useTiptapEditorStore.getState().editor).toBe(mockEditor);
  });

  it("clear resets all state to initial values", () => {
    useTiptapEditorStore.getState().setEditor(mockEditor);
    useTiptapEditorStore.getState().setContext(mockContext, mockView);

    useTiptapEditorStore.getState().clear();
    const state = useTiptapEditorStore.getState();
    expect(state.editor).toBeNull();
    expect(state.editorView).toBeNull();
    expect(state.context).toBeNull();
  });

  it("setContext with selection context", () => {
    const selectionContext: CursorContext = {
      hasSelection: true,
      selectionInfo: { from: 0, to: 5, text: "hello" },
      atLineStart: false,
      contextMode: "insert",
      surface: "wysiwyg",
    };
    useTiptapEditorStore.getState().setContext(selectionContext, mockView);
    const state = useTiptapEditorStore.getState();
    expect(state.context?.hasSelection).toBe(true);
    expect(state.context?.selectionInfo?.text).toBe("hello");
  });

  it("setContext with source surface", () => {
    const sourceContext: CursorContext = {
      hasSelection: false,
      atLineStart: true,
      contextMode: "insert-block",
      surface: "source",
    };
    useTiptapEditorStore.getState().setContext(sourceContext, mockView);
    expect(useTiptapEditorStore.getState().context?.surface).toBe("source");
    expect(useTiptapEditorStore.getState().context?.contextMode).toBe("insert-block");
  });
});
