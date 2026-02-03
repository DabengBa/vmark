/**
 * Tests for paragraph tools (Writer mode).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VMarkMcpServer } from '../../../src/server.js';
import { registerParagraphTools } from '../../../src/tools/paragraphs.js';
import { MockBridge } from '../../mocks/mockBridge.js';
import { McpTestClient } from '../../utils/McpTestClient.js';

describe('paragraph tools', () => {
  let bridge: MockBridge;
  let server: VMarkMcpServer;
  let client: McpTestClient;

  beforeEach(() => {
    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerParagraphTools(server);
    client = new McpTestClient(server);
  });

  describe('read_paragraph', () => {
    it('should be registered as a tool', () => {
      const tool = client.getTool('read_paragraph');
      expect(tool).toBeDefined();
      expect(tool?.description).toContain('paragraph');
    });

    it('should require target parameter', () => {
      const tool = client.getTool('read_paragraph');
      expect(tool?.inputSchema.required).toContain('target');
    });

    it('should find paragraph by index', async () => {
      bridge.setContent('First paragraph\n\nSecond paragraph\n\nThird paragraph');

      const result = await client.callTool('read_paragraph', {
        target: { index: 1 },
      });

      expect(result.success).toBe(true);
      const text = McpTestClient.getTextContent(result);
      expect(text).toContain('Second paragraph');
    });

    it('should find paragraph by content match', async () => {
      bridge.setContent('Introduction text\n\nThe key point is here\n\nConclusion');

      const result = await client.callTool('read_paragraph', {
        target: { containing: 'key point' },
      });

      expect(result.success).toBe(true);
      const text = McpTestClient.getTextContent(result);
      expect(text).toContain('key point');
    });

    it('should fail when target has neither index nor containing', async () => {
      bridge.setContent('Some content');

      const result = await client.callTool('read_paragraph', {
        target: {},
      });

      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('target must specify');
    });

    it('should return not_found for missing paragraph', async () => {
      bridge.setContent('Only one paragraph');

      const result = await client.callTool('read_paragraph', {
        target: { index: 99 },
      });

      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('not found');
    });

    it('should return not_found for no content match', async () => {
      bridge.setContent('Some content here');

      const result = await client.callTool('read_paragraph', {
        target: { containing: 'nonexistent text' },
      });

      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('not found');
    });
  });

  describe('write_paragraph', () => {
    it('should be registered as a tool', () => {
      const tool = client.getTool('write_paragraph');
      expect(tool).toBeDefined();
      expect(tool?.description).toContain('paragraph');
    });

    it('should require target and operation parameters', () => {
      const tool = client.getTool('write_paragraph');
      expect(tool?.inputSchema.required).toContain('target');
      expect(tool?.inputSchema.required).toContain('operation');
    });

    it('should replace paragraph content', async () => {
      bridge.setContent('First paragraph\n\nSecond paragraph');

      const result = await client.callTool('write_paragraph', {
        target: { index: 0 },
        operation: 'replace',
        content: 'New first paragraph',
        baseRevision: 'mock-rev',
      });

      expect(result.success).toBe(true);
      expect(McpTestClient.getTextContent(result)).toContain('replaced');
    });

    it('should append to paragraph', async () => {
      bridge.setContent('Start content');

      const result = await client.callTool('write_paragraph', {
        target: { index: 0 },
        operation: 'append',
        content: 'Additional text',
        baseRevision: 'mock-rev',
      });

      expect(result.success).toBe(true);
      expect(McpTestClient.getTextContent(result)).toContain('appended');
    });

    it('should prepend to paragraph', async () => {
      bridge.setContent('End content');

      const result = await client.callTool('write_paragraph', {
        target: { index: 0 },
        operation: 'prepend',
        content: 'Start text',
        baseRevision: 'mock-rev',
      });

      expect(result.success).toBe(true);
      expect(McpTestClient.getTextContent(result)).toContain('prepended');
    });

    it('should delete paragraph', async () => {
      bridge.setContent('Keep this\n\nDelete this');

      const result = await client.callTool('write_paragraph', {
        target: { index: 1 },
        operation: 'delete',
        baseRevision: 'mock-rev',
      });

      expect(result.success).toBe(true);
      expect(McpTestClient.getTextContent(result)).toContain('deleted');
    });

    it('should have mode parameter with enum values', () => {
      const tool = client.getTool('write_paragraph');
      const modeParam = (tool?.inputSchema.properties as Record<string, { enum?: string[] }>)?.mode;
      expect(modeParam?.enum).toContain('apply');
      expect(modeParam?.enum).toContain('suggest');
    });

    it('should have operation parameter with enum values', () => {
      const tool = client.getTool('write_paragraph');
      const opParam = (tool?.inputSchema.properties as Record<string, { enum?: string[] }>)?.operation;
      expect(opParam?.enum).toContain('replace');
      expect(opParam?.enum).toContain('append');
      expect(opParam?.enum).toContain('prepend');
      expect(opParam?.enum).toContain('delete');
    });
  });
});
