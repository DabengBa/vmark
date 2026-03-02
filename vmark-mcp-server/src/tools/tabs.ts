/**
 * Tabs composite tool — manage editor tabs within windows.
 */

import { VMarkMcpServer, getWindowIdArg, getStringArg } from '../server.js';
import type { ReopenedTabResult } from '../bridge/types.js';

interface TabInfo {
  id: string;
  title: string;
  filePath: string | null;
  isDirty: boolean;
  isActive: boolean;
}

export function registerTabsTool(server: VMarkMcpServer): void {
  server.registerTool(
    {
      name: 'tabs',
      description:
        'Manage editor tabs.\n\n' +
        'Actions:\n' +
        '- list: List all tabs (returns id, title, path, dirty state)\n' +
        '- switch: Switch to tab by tabId\n' +
        '- close: Close tab (by tabId, or active tab if omitted)\n' +
        '- create: Create new empty tab\n' +
        '- get_info: Get tab details (by tabId, or active tab)\n' +
        '- reopen_closed: Reopen most recently closed tab',
      inputSchema: {
        type: 'object',
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['list', 'switch', 'close', 'create', 'get_info', 'reopen_closed'],
          },
          tabId: {
            type: 'string',
            description: 'Tab ID (for switch, close, get_info). Optional for close/get_info.',
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
        case 'list':
          return handleList(server, windowId);
        case 'switch':
          return handleSwitch(server, windowId, args);
        case 'close':
          return handleClose(server, windowId, args);
        case 'create':
          return handleCreate(server, windowId);
        case 'get_info':
          return handleGetInfo(server, windowId, args);
        case 'reopen_closed':
          return handleReopenClosed(server, windowId);
        default:
          return VMarkMcpServer.errorResult(`Unknown tabs action: ${action}`);
      }
    }
  );
}

async function handleList(server: VMarkMcpServer, windowId: string) {
  try {
    const tabs = await server.sendBridgeRequest<TabInfo[]>({
      type: 'tabs.list',
      windowId,
    });
    return VMarkMcpServer.successJsonResult(tabs);
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to list tabs: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleSwitch(
  server: VMarkMcpServer,
  windowId: string,
  args: Record<string, unknown>
) {
  const tabId = getStringArg(args, 'tabId');
  if (!tabId) {
    return VMarkMcpServer.errorResult('tabId is required for switch action');
  }

  try {
    await server.sendBridgeRequest<null>({
      type: 'tabs.switch',
      tabId,
      windowId,
    });
    return VMarkMcpServer.successResult(`Switched to tab: ${tabId}`);
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to switch tab: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleClose(
  server: VMarkMcpServer,
  windowId: string,
  args: Record<string, unknown>
) {
  const tabId = getStringArg(args, 'tabId');

  try {
    await server.sendBridgeRequest<null>({
      type: 'tabs.close',
      tabId,
      windowId,
    });
    return VMarkMcpServer.successResult(tabId ? `Closed tab: ${tabId}` : 'Closed active tab');
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to close tab: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleCreate(server: VMarkMcpServer, windowId: string) {
  try {
    const result = await server.sendBridgeRequest<{ tabId: string }>({
      type: 'tabs.create',
      windowId,
    });

    const tabId = result?.tabId;
    if (!tabId) {
      return VMarkMcpServer.errorResult('Tab created but no tab ID returned');
    }
    return VMarkMcpServer.successResult(`Created new tab: ${tabId}`);
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to create tab: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleGetInfo(
  server: VMarkMcpServer,
  windowId: string,
  args: Record<string, unknown>
) {
  const tabId = getStringArg(args, 'tabId');

  try {
    const tab = await server.sendBridgeRequest<TabInfo>({
      type: 'tabs.getInfo',
      tabId,
      windowId,
    });
    return VMarkMcpServer.successJsonResult(tab);
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to get tab info: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function handleReopenClosed(server: VMarkMcpServer, windowId: string) {
  try {
    const result = await server.sendBridgeRequest<ReopenedTabResult | null>({
      type: 'tabs.reopenClosed',
      windowId,
    });

    if (!result) {
      return VMarkMcpServer.successResult('No closed tabs to reopen');
    }
    return VMarkMcpServer.successJsonResult(result);
  } catch (error) {
    return VMarkMcpServer.errorResult(
      `Failed to reopen closed tab: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
