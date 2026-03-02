/**
 * Selection composite tool — read and manipulate text selection and cursor.
 */

import {
  VMarkMcpServer,
  validateNonNegativeInteger,
  requireStringArgAllowEmpty,
  requireNumberArg,
  getNumberArg,
  getWindowIdArg,
} from '../server.js';
import type { Selection, CursorContext, EditResult } from '../bridge/types.js';

export function registerSelectionTool(server: VMarkMcpServer): void {
  server.registerTool(
    {
      name: 'selection',
      description:
        'Read and manipulate text selection and cursor.\n\n' +
        'Actions:\n' +
        '- get: Get selected text, range (from/to), and empty flag\n' +
        '- set: Set selection range (same from/to = cursor only)\n' +
        '- replace: Replace selected text (or insert at cursor)\n' +
        '- get_context: Get text surrounding cursor (lines before/after, paragraph)\n' +
        '- set_cursor: Set cursor position (clears selection)',
      inputSchema: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['get', 'set', 'replace', 'get_context', 'set_cursor'],
          },
          from: {
            type: 'number',
            description: 'Start position (for set action, 0-indexed inclusive).',
          },
          to: {
            type: 'number',
            description: 'End position (for set action, 0-indexed exclusive).',
          },
          text: {
            type: 'string',
            description: 'Replacement text (for replace action).',
          },
          position: {
            type: 'number',
            description: 'Cursor position (for set_cursor action, 0-indexed).',
          },
          linesBefore: {
            type: 'number',
            description: 'Lines before cursor (for get_context, default 3).',
          },
          linesAfter: {
            type: 'number',
            description: 'Lines after cursor (for get_context, default 3).',
          },
          windowId: {
            type: 'string',
            description: 'Optional window identifier. Defaults to focused window.',
          },
        },
      },
    },
    async (args) => {
      const action = args.action as string;
      const windowId = getWindowIdArg(args);

      switch (action) {
        case 'get':
          return handleGet(server, windowId);
        case 'set':
          return handleSet(server, windowId, args);
        case 'replace':
          return handleReplace(server, windowId, args);
        case 'get_context':
          return handleGetContext(server, windowId, args);
        case 'set_cursor':
          return handleSetCursor(server, windowId, args);
        default:
          return VMarkMcpServer.errorResult(`Unknown selection action: ${action}`);
      }
    }
  );
}

async function handleGet(server: VMarkMcpServer, windowId: string) {
  try {
    const selection = await server.sendBridgeRequest<Selection>({
      type: 'selection.get',
      windowId,
    });
    return VMarkMcpServer.successJsonResult(selection);
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to get selection: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleSet(
  server: VMarkMcpServer,
  windowId: string,
  args: Record<string, unknown>
) {
  try {
    const from = requireNumberArg(args, 'from');
    const to = requireNumberArg(args, 'to');

    const fromError = validateNonNegativeInteger(from, 'from');
    if (fromError) return VMarkMcpServer.errorResult(fromError);
    const toError = validateNonNegativeInteger(to, 'to');
    if (toError) return VMarkMcpServer.errorResult(toError);
    if (from > to) return VMarkMcpServer.errorResult('from cannot be greater than to');

    await server.sendBridgeRequest<null>({
      type: 'selection.set',
      from,
      to,
      windowId,
    });

    const message =
      from === to
        ? `Cursor positioned at ${from}`
        : `Selected range ${from}-${to} (${to - from} characters)`;
    return VMarkMcpServer.successResult(message);
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to set selection: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleReplace(
  server: VMarkMcpServer,
  windowId: string,
  args: Record<string, unknown>
) {
  try {
    const text = requireStringArgAllowEmpty(args, 'text');
    const result = await server.sendBridgeRequest<EditResult>({
      type: 'selection.replace',
      text,
      windowId,
    });

    return VMarkMcpServer.successJsonResult({
      message: result.message,
      range: result.range,
      originalContent: result.originalContent,
      suggestionId: result.suggestionId,
      applied: !result.suggestionId,
    });
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to replace selection: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleGetContext(
  server: VMarkMcpServer,
  windowId: string,
  args: Record<string, unknown>
) {
  const linesBefore = getNumberArg(args, 'linesBefore') ?? 3;
  const linesAfter = getNumberArg(args, 'linesAfter') ?? 3;

  const linesBeforeError = validateNonNegativeInteger(linesBefore, 'linesBefore');
  if (linesBeforeError) return VMarkMcpServer.errorResult(linesBeforeError);
  const linesAfterError = validateNonNegativeInteger(linesAfter, 'linesAfter');
  if (linesAfterError) return VMarkMcpServer.errorResult(linesAfterError);

  try {
    const context = await server.sendBridgeRequest<CursorContext>({
      type: 'cursor.getContext',
      linesBefore,
      linesAfter,
      windowId,
    });
    return VMarkMcpServer.successJsonResult(context);
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to get cursor context: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleSetCursor(
  server: VMarkMcpServer,
  windowId: string,
  args: Record<string, unknown>
) {
  try {
    const position = requireNumberArg(args, 'position');
    const positionError = validateNonNegativeInteger(position, 'position');
    if (positionError) return VMarkMcpServer.errorResult(positionError);

    await server.sendBridgeRequest<null>({
      type: 'cursor.setPosition',
      position,
      windowId,
    });
    return VMarkMcpServer.successResult(`Cursor positioned at ${position}`);
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to set cursor position: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
