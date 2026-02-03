/**
 * Tests for smart-insert tool (Writer mode).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VMarkMcpServer } from '../../../src/server.js';
import { registerSmartInsertTool } from '../../../src/tools/smart-insert.js';
import { MockBridge } from '../../mocks/mockBridge.js';
import { McpTestClient } from '../../utils/McpTestClient.js';

describe('smart-insert tool', () => {
  let bridge: MockBridge;
  let server: VMarkMcpServer;
  let client: McpTestClient;

  beforeEach(() => {
    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerSmartInsertTool(server);
    client = new McpTestClient(server);
  });

  describe('smart_insert', () => {
    it('should be registered as a tool', () => {
      const tool = client.getTool('smart_insert');
      expect(tool).toBeDefined();
      expect(tool?.description).toContain('Insert');
    });

    it('should require content parameter', () => {
      const tool = client.getTool('smart_insert');
      expect(tool?.inputSchema.required).toContain('content');
    });

    it('should have destination parameter with oneOf schema', () => {
      const tool = client.getTool('smart_insert');
      const destParam = (tool?.inputSchema.properties as Record<string, { oneOf?: unknown[] }>)?.destination;
      expect(destParam?.oneOf).toBeDefined();
      expect(destParam?.oneOf?.length).toBeGreaterThan(0);
    });

    it('should have mode parameter with enum values', () => {
      const tool = client.getTool('smart_insert');
      const modeParam = (tool?.inputSchema.properties as Record<string, { enum?: string[] }>)?.mode;
      expect(modeParam?.enum).toContain('apply');
      expect(modeParam?.enum).toContain('suggest');
    });

    it('should insert at end of document', async () => {
      bridge.setContent('Existing content');

      const result = await client.callTool('smart_insert', {
        content: 'New paragraph',
        destination: 'end_of_document',
        baseRevision: 'mock-rev',
      });

      expect(result.success).toBe(true);
      expect(McpTestClient.getTextContent(result)).toContain('inserted');
    });

    it('should insert at start of document', async () => {
      bridge.setContent('Existing content');

      const result = await client.callTool('smart_insert', {
        content: 'New first paragraph',
        destination: 'start_of_document',
        baseRevision: 'mock-rev',
      });

      expect(result.success).toBe(true);
      expect(McpTestClient.getTextContent(result)).toContain('inserted');
    });

    it('should insert after specific paragraph by index', async () => {
      bridge.setContent('First paragraph\n\nSecond paragraph');

      const result = await client.callTool('smart_insert', {
        content: 'Inserted paragraph',
        destination: { after_paragraph: 0 },
        baseRevision: 'mock-rev',
      });

      expect(result.success).toBe(true);
      expect(McpTestClient.getTextContent(result)).toContain('inserted');
    });

    it('should insert after paragraph by content match', async () => {
      bridge.setContent('Introduction\n\nMain content\n\nConclusion');

      const result = await client.callTool('smart_insert', {
        content: 'Additional content',
        destination: { after_paragraph_containing: 'Main content' },
        baseRevision: 'mock-rev',
      });

      expect(result.success).toBe(true);
      expect(McpTestClient.getTextContent(result)).toContain('inserted');
    });

    it('should insert after section', async () => {
      bridge.setContent('# Introduction\n\nIntro text\n\n# Main\n\nMain text');

      const result = await client.callTool('smart_insert', {
        content: 'New section content',
        destination: { after_section: 'Introduction' },
        baseRevision: 'mock-rev',
      });

      expect(result.success).toBe(true);
      expect(McpTestClient.getTextContent(result)).toContain('inserted');
    });

    it('should handle empty document for end_of_document', async () => {
      bridge.setContent('');

      const result = await client.callTool('smart_insert', {
        content: 'First content',
        destination: 'end_of_document',
        baseRevision: 'mock-rev',
      });

      expect(result.success).toBe(true);
    });

    it('should fail with invalid destination', async () => {
      bridge.setContent('Some content');

      const result = await client.callTool('smart_insert', {
        content: 'New text',
        destination: 'invalid_location',
        baseRevision: 'mock-rev',
      });

      expect(result.success).toBe(false);
    });

    it('should require destination parameter', () => {
      const tool = client.getTool('smart_insert');
      expect(tool?.inputSchema.required).toContain('destination');
    });
  });
});
