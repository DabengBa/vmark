/**
 * MCP Bridge — VMark-Specific Operation Handlers
 *
 * Purpose: VMark-specific operations — insert inline/block math, mermaid diagrams,
 *   SVG blocks, wiki links, and CJK spacing formatting.
 *
 * @module hooks/mcpBridge/vmarkHandlers
 */

import { respond, getEditor } from "./utils";
import { requireString, optionalString } from "./validateArgs";

/**
 * Handle vmark.insertMathInline request.
 * Inserts inline math at cursor position.
 */
export async function handleInsertMathInline(
  id: string,
  args: Record<string, unknown>
): Promise<void> {
  try {
    const editor = getEditor();
    if (!editor) throw new Error("No active editor");

    const latex = requireString(args, "latex");

    // Insert math_inline node with content attribute
    editor
      .chain()
      .focus()
      .insertContent({
        type: "math_inline",
        attrs: { content: latex },
      })
      .run();

    await respond({ id, success: true, data: null });
  } catch (error) {
    await respond({
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Handle vmark.insertMathBlock request.
 * Inserts block math (latex code block) at cursor position.
 */
export async function handleInsertMathBlock(
  id: string,
  args: Record<string, unknown>
): Promise<void> {
  try {
    const editor = getEditor();
    if (!editor) throw new Error("No active editor");

    const latex = requireString(args, "latex");

    // Insert as a code block with latex language
    editor
      .chain()
      .focus()
      .insertContent({
        type: "codeBlock",
        attrs: { language: "latex" },
        content: [{ type: "text", text: latex }],
      })
      .run();

    await respond({ id, success: true, data: null });
  } catch (error) {
    await respond({
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Insert a code block with the given language at cursor position.
 * Shared by mermaid and SVG insert handlers.
 */
async function handleInsertCodeBlock(
  id: string,
  args: Record<string, unknown>,
  language: string,
): Promise<void> {
  try {
    const editor = getEditor();
    if (!editor) throw new Error("No active editor");

    const code = requireString(args, "code");

    editor
      .chain()
      .focus()
      .insertContent({
        type: "codeBlock",
        attrs: { language },
        content: [{ type: "text", text: code }],
      })
      .run();

    await respond({ id, success: true, data: null });
  } catch (error) {
    await respond({
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/** Handle vmark.insertMermaid — insert mermaid code block at cursor. */
export async function handleInsertMermaid(
  id: string,
  args: Record<string, unknown>,
): Promise<void> {
  return handleInsertCodeBlock(id, args, "mermaid");
}

/** Handle vmark.insertMarkmap — insert markmap code block at cursor. */
export async function handleInsertMarkmap(
  id: string,
  args: Record<string, unknown>,
): Promise<void> {
  return handleInsertCodeBlock(id, args, "markmap");
}

/** Handle vmark.insertSvg — insert SVG code block at cursor. */
export async function handleInsertSvg(
  id: string,
  args: Record<string, unknown>,
): Promise<void> {
  return handleInsertCodeBlock(id, args, "svg");
}

/**
 * Handle vmark.insertWikiLink request.
 * Inserts wiki-style link [[target]] or [[target|alias]] at cursor position.
 */
export async function handleInsertWikiLink(
  id: string,
  args: Record<string, unknown>
): Promise<void> {
  try {
    const editor = getEditor();
    if (!editor) throw new Error("No active editor");

    const target = requireString(args, "target");
    const displayText = optionalString(args, "displayText");

    // Insert wikiLink node with value and optional alias
    editor
      .chain()
      .focus()
      .insertContent({
        type: "wikiLink",
        attrs: {
          value: target,
          alias: displayText || null,
        },
      })
      .run();

    await respond({ id, success: true, data: null });
  } catch (error) {
    await respond({
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

// CJK handlers are in cjkHandlers.ts
