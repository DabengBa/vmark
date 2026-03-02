#!/usr/bin/env node
/**
 * VMark MCP Server - Main entry point.
 *
 * Exposes VMark's Tiptap editor APIs to AI assistants via MCP protocol.
 *
 * Usage:
 *   npx @vmark/mcp-server
 *   node dist/index.js
 *
 * The server communicates with VMark via WebSocket bridge on localhost:9224.
 */

// Re-export public API
export {
  VMarkMcpServer,
  resolveWindowId,
  validateNonNegativeInteger,
  getStringArg,
  requireStringArg,
  getNumberArg,
  requireNumberArg,
  getBooleanArg,
  getWindowIdArg,
} from './server.js';
export type { VMarkMcpServerConfig, ToolArgs } from './server.js';

// Bridge implementations
export { WebSocketBridge } from './bridge/websocket.js';
export type { WebSocketBridgeConfig, Logger } from './bridge/websocket.js';

// Tool registrations (2 standalone + 10 composite = 12 tools)
export { registerProtocolTools } from './tools/protocol.js';
export { registerDocumentTool } from './tools/document.js';
export { registerStructureTool } from './tools/structure.js';
export { registerSelectionTool } from './tools/selection.js';
export { registerFormatTool } from './tools/format.js';
export { registerTableTool } from './tools/table.js';
export { registerEditorTool } from './tools/editor.js';
export { registerWorkspaceTool } from './tools/workspace.js';
export { registerTabsTool } from './tools/tabs.js';
export { registerMediaTool } from './tools/media.js';
export { registerSuggestionsTool } from './tools/suggestions.js';

// Resource registrations
export { registerDocumentResources } from './resources/document.js';

export type {
  Bridge,
  BridgeRequest,
  BridgeResponse,
  WindowId,
  Position,
  Range,
  Selection,
  CursorContext,
  Heading,
  DocumentMetadata,
  WindowInfo,
  FormatType,
  BlockType,
  ListType,
  SearchResult,
  SearchMatch,
  ReplaceResult,
  SuggestionType,
  Suggestion,
  SuggestionListResult,
  EditResult,
  RecentFile,
  WorkspaceInfo,
  ReopenedTabResult,
  // AI-Oriented MCP Design types
  ErrorCode,
  RecoveryHint,
  StructuredError,
  Capabilities,
  RevisionInfo,
  AstNode,
  AstProjection,
  NodeType,
  BlockQuery,
  BlockInfo,
  OutlineEntry,
  SectionSummary,
  DocumentDigest,
  AstResponse,
  TargetCandidate,
  TargetResolution,
  SectionInfo,
  OperationMode,
  MarkSpec,
  BatchOperation,
  BatchEditResult,
  MatchPolicy,
  MatchInfo,
  ApplyDiffResult,
  TextAnchor,
  // Section types
  SectionTarget,
  NewHeading,
  // Table batch types
  TableTarget,
  TableOperation,
  // List batch types
  ListTarget,
  ListOperation,
  // Paragraph types
  ParagraphTarget,
  ParagraphInfo,
  ParagraphOperation,
  WriteParagraphResult,
  // Smart insert types
  SmartInsertDestination,
  SmartInsertResult,
} from './bridge/types.js';

export type {
  ToolDefinition,
  ToolHandler,
  ResourceDefinition,
  ResourceHandler,
  ToolCallResult,
  ResourceReadResult,
  McpServerInterface,
} from './types.js';

import { VMarkMcpServer } from './server.js';
import { registerProtocolTools } from './tools/protocol.js';
import { registerDocumentTool } from './tools/document.js';
import { registerStructureTool } from './tools/structure.js';
import { registerSelectionTool } from './tools/selection.js';
import { registerFormatTool } from './tools/format.js';
import { registerTableTool } from './tools/table.js';
import { registerEditorTool } from './tools/editor.js';
import { registerWorkspaceTool } from './tools/workspace.js';
import { registerTabsTool } from './tools/tabs.js';
import { registerMediaTool } from './tools/media.js';
import { registerSuggestionsTool } from './tools/suggestions.js';
import { registerDocumentResources } from './resources/document.js';
import type { Bridge } from './bridge/types.js';

/**
 * Create a fully configured VMark MCP server with all tools registered.
 */
export function createVMarkMcpServer(bridge: Bridge): VMarkMcpServer {
  const server = new VMarkMcpServer({ bridge });

  // Register all composite tools (2 standalone + 10 composite = 12 total)
  registerProtocolTools(server);      // get_capabilities, get_document_revision
  registerDocumentTool(server);       // document (12 actions)
  registerStructureTool(server);      // structure (8 actions)
  registerSelectionTool(server);      // selection (5 actions)
  registerFormatTool(server);         // format (10 actions)
  registerTableTool(server);          // table (3 actions)
  registerEditorTool(server);         // editor (3 actions)
  registerWorkspaceTool(server);      // workspace (12 actions)
  registerTabsTool(server);           // tabs (6 actions)
  registerMediaTool(server);          // media (11 actions)
  registerSuggestionsTool(server);    // suggestions (5 actions)

  // Register resources
  registerDocumentResources(server);

  return server;
}

/**
 * List of all tool categories for documentation.
 */
export const TOOL_CATEGORIES = [
  {
    name: 'Protocol Tools',
    description: 'Capabilities discovery and revision tracking',
    tools: ['get_capabilities', 'get_document_revision'],
  },
  {
    name: 'Document Tool',
    description: 'Read, write, search, and transform document content (12 actions)',
    tools: ['document'],
  },
  {
    name: 'Structure Tool',
    description: 'AST access, structure queries, and section operations (8 actions)',
    tools: ['structure'],
  },
  {
    name: 'Selection Tool',
    description: 'Read and manipulate text selection and cursor (5 actions)',
    tools: ['selection'],
  },
  {
    name: 'Format Tool',
    description: 'Text formatting, block types, lists, and list batch operations (10 actions)',
    tools: ['format'],
  },
  {
    name: 'Table Tool',
    description: 'Table insert, delete, and batch modify (3 actions)',
    tools: ['table'],
  },
  {
    name: 'Editor Tool',
    description: 'Editor state operations: undo, redo, focus (3 actions)',
    tools: ['editor'],
  },
  {
    name: 'Workspace Tool',
    description: 'Window and document management (12 actions)',
    tools: ['workspace'],
  },
  {
    name: 'Tabs Tool',
    description: 'Manage editor tabs within windows (6 actions)',
    tools: ['tabs'],
  },
  {
    name: 'Media Tool',
    description: 'Math, diagrams, media, wiki links, CJK formatting (11 actions)',
    tools: ['media'],
  },
  {
    name: 'Suggestions Tool',
    description: 'Manage AI-generated edit suggestions (5 actions)',
    tools: ['suggestions'],
  },
] as const;

/**
 * Expected tool count — used by --health-check to catch stale builds.
 * Update this number whenever tools are added or removed.
 */
export const EXPECTED_TOOL_COUNT = TOOL_CATEGORIES.reduce(
  (sum, cat) => sum + cat.tools.length,
  0
);

/**
 * List of all resources for documentation.
 */
export const RESOURCES = [
  {
    uri: 'vmark://document/outline',
    name: 'Document Outline',
    description: 'Get the document heading hierarchy',
  },
  {
    uri: 'vmark://document/metadata',
    name: 'Document Metadata',
    description: 'Get document metadata (path, title, word count, etc.)',
  },
  {
    uri: 'vmark://windows/list',
    name: 'Window List',
    description: 'Get list of open AI-exposed windows',
  },
  {
    uri: 'vmark://windows/focused',
    name: 'Focused Window',
    description: 'Get the currently focused window label',
  },
] as const;
