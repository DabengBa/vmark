/**
 * Editor composite tool — undo, redo, focus.
 */

import { VMarkMcpServer, getWindowIdArg } from '../server.js';

export function registerEditorTool(server: VMarkMcpServer): void {
  server.registerTool(
    {
      name: 'editor',
      description:
        'Editor state operations.\n\n' +
        'Actions:\n' +
        '- undo: Undo the last editing action\n' +
        '- redo: Redo the last undone action\n' +
        '- focus: Focus the editor, ready for input',
      inputSchema: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['undo', 'redo', 'focus'],
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
        case 'undo':
          return handleUndo(server, windowId);
        case 'redo':
          return handleRedo(server, windowId);
        case 'focus':
          return handleFocus(server, windowId);
        default:
          return VMarkMcpServer.errorResult(`Unknown editor action: ${action}`);
      }
    }
  );
}

async function handleUndo(server: VMarkMcpServer, windowId: string) {
  try {
    await server.sendBridgeRequest<null>({ type: 'editor.undo', windowId });
    return VMarkMcpServer.successResult('Undo completed');
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to undo: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleRedo(server: VMarkMcpServer, windowId: string) {
  try {
    await server.sendBridgeRequest<null>({ type: 'editor.redo', windowId });
    return VMarkMcpServer.successResult('Redo completed');
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to redo: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleFocus(server: VMarkMcpServer, windowId: string) {
  try {
    await server.sendBridgeRequest<null>({ type: 'editor.focus', windowId });
    return VMarkMcpServer.successResult('Editor focused');
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to focus editor: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
