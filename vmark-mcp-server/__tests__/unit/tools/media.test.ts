/**
 * Tests for media tools — URL scheme validation (ALLOWED_SCHEMES).
 *
 * Covers the security fix ensuring insert_video and insert_audio
 * only accept http:, https:, and file: URL schemes.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VMarkMcpServer } from '../../../src/server.js';
import { registerMediaTools } from '../../../src/tools/media.js';
import { MockBridge } from '../../mocks/mockBridge.js';
import { McpTestClient } from '../../utils/McpTestClient.js';

describe('media tools', () => {
  let bridge: MockBridge;
  let server: VMarkMcpServer;
  let client: McpTestClient;

  beforeEach(() => {
    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerMediaTools(server);
    client = new McpTestClient(server);

    // insertMedia is not in MockBridge's default handler, so add one
    bridge.setResponseHandler('insertMedia', () => ({
      success: true,
      data: { message: 'Media inserted' },
    }));
  });

  // ============================================================
  // Tool registration
  // ============================================================

  describe('tool registration', () => {
    it('should register insert_video', () => {
      const tool = client.getTool('insert_video');
      expect(tool).toBeDefined();
      expect(tool?.description).toContain('video');
    });

    it('should register insert_audio', () => {
      const tool = client.getTool('insert_audio');
      expect(tool).toBeDefined();
      expect(tool?.description).toContain('audio');
    });

    it('should register insert_video_embed', () => {
      const tool = client.getTool('insert_video_embed');
      expect(tool).toBeDefined();
      expect(tool?.description).toContain('embed');
    });

    it('insert_video should require src and baseRevision', () => {
      const tool = client.getTool('insert_video');
      expect(tool?.inputSchema.required).toContain('src');
      expect(tool?.inputSchema.required).toContain('baseRevision');
    });

    it('insert_audio should require src and baseRevision', () => {
      const tool = client.getTool('insert_audio');
      expect(tool?.inputSchema.required).toContain('src');
      expect(tool?.inputSchema.required).toContain('baseRevision');
    });
  });

  // ============================================================
  // ALLOWED_SCHEMES — must-accept URLs
  // ============================================================

  describe('URL scheme validation — accepted URLs', () => {
    const validUrls = [
      { url: 'https://example.com/video.mp4', label: 'https URL' },
      { url: 'http://example.com/audio.mp3', label: 'http URL' },
      { url: 'HTTP://EXAMPLE.COM/VIDEO.MP4', label: 'uppercase HTTP' },
      { url: 'HTTPS://EXAMPLE.COM/VIDEO.MP4', label: 'uppercase HTTPS' },
      { url: 'https://cdn.example.com/path/to/media.webm', label: 'nested path' },
      { url: 'file:///Users/test/video.mp4', label: 'file:// local path' },
      { url: 'https://www.youtube.com/watch?v=xxxxx', label: 'YouTube URL with query' },
      { url: 'https://player.vimeo.com/video/12345', label: 'Vimeo embed URL' },
      { url: 'https://example.com/video.mp4?quality=hd&t=120#chapter2', label: 'URL with query params and fragment' },
      { url: 'https://example.com/path/to/%E4%B8%AD%E6%96%87.mp4', label: 'URL with encoded CJK characters' },
      { url: 'https://example.com/vid%C3%A9o.mp4', label: 'URL with encoded accented chars' },
      { url: 'https://example.com/' + 'a'.repeat(9990), label: 'very long URL (10,000 chars)' },
      { url: 'https://example.com/видео.mp4', label: 'URL with unicode characters' },
      { url: 'File:///tmp/test.mp4', label: 'mixed-case File scheme' },
    ];

    describe('insert_video accepts valid URLs', () => {
      it.each(validUrls)('should accept $label: $url', async ({ url }) => {
        const result = await client.callTool('insert_video', {
          src: url,
          baseRevision: 'rev-1',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('insert_audio accepts valid URLs', () => {
      it.each(validUrls)('should accept $label: $url', async ({ url }) => {
        const result = await client.callTool('insert_audio', {
          src: url,
          baseRevision: 'rev-1',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  // ============================================================
  // ALLOWED_SCHEMES — must-reject URLs (adversarial)
  // ============================================================

  describe('URL scheme validation — rejected URLs', () => {
    const invalidUrls = [
      { url: 'javascript:alert(1)', label: 'javascript: XSS' },
      { url: 'javascript:void(0)', label: 'javascript:void variant' },
      { url: 'JAVASCRIPT:alert(1)', label: 'uppercase JAVASCRIPT: bypass attempt' },
      { url: 'JaVaScRiPt:alert(1)', label: 'mixed-case javascript:' },
      { url: 'data:text/html,<script>alert(1)</script>', label: 'data: with HTML' },
      { url: 'data:audio/mp3;base64,AAAA', label: 'data: with audio MIME' },
      { url: 'vbscript:msgbox', label: 'vbscript: scheme' },
      { url: 'blob:http://evil.com/uuid', label: 'blob: scheme' },
      { url: '//evil.com/video.mp4', label: 'protocol-relative URL (no scheme)' },
      { url: 'ftp://example.com/video.mp4', label: 'ftp: scheme' },
      { url: 'ws://example.com/stream', label: 'ws: scheme' },
      { url: 'wss://example.com/stream', label: 'wss: scheme' },
      { url: 'custom://evil.com/video.mp4', label: 'custom: scheme' },
    ];

    describe('insert_video rejects invalid URLs', () => {
      it.each(invalidUrls)('should reject $label: $url', async ({ url }) => {
        const result = await client.callTool('insert_video', {
          src: url,
          baseRevision: 'rev-1',
        });
        expect(result.success).toBe(false);
        expect(McpTestClient.getTextContent(result)).toContain('http');
      });
    });

    describe('insert_audio rejects invalid URLs', () => {
      it.each(invalidUrls)('should reject $label: $url', async ({ url }) => {
        const result = await client.callTool('insert_audio', {
          src: url,
          baseRevision: 'rev-1',
        });
        expect(result.success).toBe(false);
        expect(McpTestClient.getTextContent(result)).toContain('http');
      });
    });
  });

  // ============================================================
  // Whitespace / injection bypass attempts
  // ============================================================

  describe('URL scheme validation — whitespace bypass attempts', () => {
    const whitespaceUrls = [
      { url: ' javascript:alert(1)', label: 'leading space' },
      { url: '\tjavascript:alert(1)', label: 'leading tab' },
      { url: '\njavascript:alert(1)', label: 'leading newline' },
      { url: '\rjavascript:alert(1)', label: 'leading carriage return' },
      { url: ' \t\n\rjavascript:alert(1)', label: 'mixed leading whitespace' },
      { url: 'java\nscript:alert(1)', label: 'newline injection in scheme' },
      { url: 'java\tscript:alert(1)', label: 'tab injection in scheme' },
      { url: 'java\x00script:alert(1)', label: 'null byte injection in scheme' },
    ];

    describe('insert_video rejects whitespace bypass attempts', () => {
      it.each(whitespaceUrls)('should reject $label', async ({ url }) => {
        const result = await client.callTool('insert_video', {
          src: url,
          baseRevision: 'rev-1',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('insert_audio rejects whitespace bypass attempts', () => {
      it.each(whitespaceUrls)('should reject $label', async ({ url }) => {
        const result = await client.callTool('insert_audio', {
          src: url,
          baseRevision: 'rev-1',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  // ============================================================
  // Encoded scheme bypass attempts
  // ============================================================

  describe('URL scheme validation — encoded bypass attempts', () => {
    it('insert_video should reject percent-encoded javascript: scheme', async () => {
      // %6A%61%76%61%73%63%72%69%70%74 = "javascript"
      const result = await client.callTool('insert_video', {
        src: '%6A%61%76%61%73%63%72%69%70%74:alert(1)',
        baseRevision: 'rev-1',
      });
      expect(result.success).toBe(false);
    });

    it('insert_audio should reject percent-encoded javascript: scheme', async () => {
      const result = await client.callTool('insert_audio', {
        src: '%6A%61%76%61%73%63%72%69%70%74:alert(1)',
        baseRevision: 'rev-1',
      });
      expect(result.success).toBe(false);
    });

    it('insert_video should reject HTML entity-encoded javascript:', async () => {
      const result = await client.callTool('insert_video', {
        src: '&#106;avascript:alert(1)',
        baseRevision: 'rev-1',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // Empty / missing src
  // ============================================================

  describe('empty or missing src', () => {
    it('insert_video should reject empty string src', async () => {
      const result = await client.callTool('insert_video', {
        src: '',
        baseRevision: 'rev-1',
      });
      expect(result.success).toBe(false);
    });

    it('insert_audio should reject empty string src', async () => {
      const result = await client.callTool('insert_audio', {
        src: '',
        baseRevision: 'rev-1',
      });
      expect(result.success).toBe(false);
    });

    it('insert_video should reject missing src', async () => {
      const result = await client.callTool('insert_video', {
        baseRevision: 'rev-1',
      });
      expect(result.success).toBe(false);
    });

    it('insert_audio should reject missing src', async () => {
      const result = await client.callTool('insert_audio', {
        baseRevision: 'rev-1',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================
  // insert_video handler integration
  // ============================================================

  describe('insert_video — handler integration', () => {
    it('should send insertMedia bridge request for valid URL', async () => {
      const result = await client.callTool('insert_video', {
        src: 'https://example.com/video.mp4',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(true);
      const requests = bridge.getRequestsOfType('insertMedia');
      expect(requests).toHaveLength(1);
      expect((requests[0].request as { mediaHtml: string }).mediaHtml).toContain('<video');
      expect((requests[0].request as { mediaHtml: string }).mediaHtml).toContain('src="https://example.com/video.mp4"');
    });

    it('should include title attribute when provided', async () => {
      await client.callTool('insert_video', {
        src: 'https://example.com/video.mp4',
        title: 'My Video',
        baseRevision: 'rev-1',
      });

      const requests = bridge.getRequestsOfType('insertMedia');
      expect((requests[0].request as { mediaHtml: string }).mediaHtml).toContain('title="My Video"');
    });

    it('should include poster attribute when provided', async () => {
      await client.callTool('insert_video', {
        src: 'https://example.com/video.mp4',
        poster: 'https://example.com/thumb.jpg',
        baseRevision: 'rev-1',
      });

      const requests = bridge.getRequestsOfType('insertMedia');
      expect((requests[0].request as { mediaHtml: string }).mediaHtml).toContain('poster="https://example.com/thumb.jpg"');
    });

    it('should escape HTML special characters in src', async () => {
      await client.callTool('insert_video', {
        src: 'https://example.com/video.mp4?a=1&b=2',
        baseRevision: 'rev-1',
      });

      const requests = bridge.getRequestsOfType('insertMedia');
      const html = (requests[0].request as { mediaHtml: string }).mediaHtml;
      expect(html).toContain('&amp;');
      expect(html).not.toContain('?a=1&b=2"');
    });

    it('should escape HTML special characters in title', async () => {
      await client.callTool('insert_video', {
        src: 'https://example.com/video.mp4',
        title: 'A "quoted" <title>',
        baseRevision: 'rev-1',
      });

      const requests = bridge.getRequestsOfType('insertMedia');
      const html = (requests[0].request as { mediaHtml: string }).mediaHtml;
      expect(html).toContain('&quot;');
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
    });

    it('should not send bridge request for rejected URLs', async () => {
      await client.callTool('insert_video', {
        src: 'javascript:alert(1)',
        baseRevision: 'rev-1',
      });

      const requests = bridge.getRequestsOfType('insertMedia');
      expect(requests).toHaveLength(0);
    });

    it('should use focused window by default', async () => {
      await client.callTool('insert_video', {
        src: 'https://example.com/video.mp4',
        baseRevision: 'rev-1',
      });

      const requests = bridge.getRequestsOfType('insertMedia');
      expect((requests[0].request as { windowId: string }).windowId).toBe('focused');
    });

    it('should use specified windowId', async () => {
      bridge.addWindow('other');
      await client.callTool('insert_video', {
        src: 'https://example.com/video.mp4',
        baseRevision: 'rev-1',
        windowId: 'other',
      });

      const requests = bridge.getRequestsOfType('insertMedia');
      expect((requests[0].request as { windowId: string }).windowId).toBe('other');
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Connection lost'));

      const result = await client.callTool('insert_video', {
        src: 'https://example.com/video.mp4',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Connection lost');
    });
  });

  // ============================================================
  // insert_audio handler integration
  // ============================================================

  describe('insert_audio — handler integration', () => {
    it('should send insertMedia bridge request for valid URL', async () => {
      const result = await client.callTool('insert_audio', {
        src: 'https://example.com/audio.mp3',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(true);
      const requests = bridge.getRequestsOfType('insertMedia');
      expect(requests).toHaveLength(1);
      expect((requests[0].request as { mediaHtml: string }).mediaHtml).toContain('<audio');
      expect((requests[0].request as { mediaHtml: string }).mediaHtml).toContain('src="https://example.com/audio.mp3"');
    });

    it('should include title attribute when provided', async () => {
      await client.callTool('insert_audio', {
        src: 'https://example.com/audio.mp3',
        title: 'My Audio',
        baseRevision: 'rev-1',
      });

      const requests = bridge.getRequestsOfType('insertMedia');
      expect((requests[0].request as { mediaHtml: string }).mediaHtml).toContain('title="My Audio"');
    });

    it('should not send bridge request for rejected URLs', async () => {
      await client.callTool('insert_audio', {
        src: 'data:audio/mp3;base64,AAAA',
        baseRevision: 'rev-1',
      });

      const requests = bridge.getRequestsOfType('insertMedia');
      expect(requests).toHaveLength(0);
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Timeout'));

      const result = await client.callTool('insert_audio', {
        src: 'https://example.com/audio.mp3',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Timeout');
    });
  });

  // ============================================================
  // insert_video_embed — provider validation
  // ============================================================

  describe('insert_video_embed', () => {
    it('should accept valid YouTube ID', async () => {
      const result = await client.callTool('insert_video_embed', {
        videoId: 'dQw4w9WgXcQ',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(true);
      const requests = bridge.getRequestsOfType('insertMedia');
      expect(requests).toHaveLength(1);
      expect((requests[0].request as { mediaHtml: string }).mediaHtml).toContain('youtube-nocookie.com');
    });

    it('should accept valid Vimeo ID', async () => {
      const result = await client.callTool('insert_video_embed', {
        videoId: '123456789',
        provider: 'vimeo',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(true);
      const requests = bridge.getRequestsOfType('insertMedia');
      expect((requests[0].request as { mediaHtml: string }).mediaHtml).toContain('player.vimeo.com');
    });

    it('should accept valid Bilibili BV ID', async () => {
      const result = await client.callTool('insert_video_embed', {
        videoId: 'BV1xx411c7mD',
        provider: 'bilibili',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(true);
      const requests = bridge.getRequestsOfType('insertMedia');
      expect((requests[0].request as { mediaHtml: string }).mediaHtml).toContain('player.bilibili.com');
    });

    it('should reject invalid YouTube ID (too short)', async () => {
      const result = await client.callTool('insert_video_embed', {
        videoId: 'abc',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid');
    });

    it('should reject invalid YouTube ID with special chars', async () => {
      const result = await client.callTool('insert_video_embed', {
        videoId: 'abc<script>1',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid Vimeo ID (non-numeric)', async () => {
      const result = await client.callTool('insert_video_embed', {
        videoId: 'abc123',
        provider: 'vimeo',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid Bilibili ID (wrong prefix)', async () => {
      const result = await client.callTool('insert_video_embed', {
        videoId: 'AV12345678901',
        provider: 'bilibili',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(false);
    });

    it('should reject invalid provider', async () => {
      const result = await client.callTool('insert_video_embed', {
        videoId: 'dQw4w9WgXcQ',
        provider: 'dailymotion',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Invalid provider');
    });

    it('should default provider to youtube', async () => {
      const result = await client.callTool('insert_video_embed', {
        videoId: 'dQw4w9WgXcQ',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(true);
      const requests = bridge.getRequestsOfType('insertMedia');
      expect((requests[0].request as { mediaHtml: string }).mediaHtml).toContain('youtube-nocookie.com');
    });

    it('should not send bridge request for invalid provider', async () => {
      await client.callTool('insert_video_embed', {
        videoId: 'dQw4w9WgXcQ',
        provider: 'dailymotion',
        baseRevision: 'rev-1',
      });

      const requests = bridge.getRequestsOfType('insertMedia');
      expect(requests).toHaveLength(0);
    });

    it('should handle bridge errors', async () => {
      bridge.setNextError(new Error('Bridge down'));

      const result = await client.callTool('insert_video_embed', {
        videoId: 'dQw4w9WgXcQ',
        baseRevision: 'rev-1',
      });

      expect(result.success).toBe(false);
      expect(McpTestClient.getTextContent(result)).toContain('Bridge down');
    });
  });
});
