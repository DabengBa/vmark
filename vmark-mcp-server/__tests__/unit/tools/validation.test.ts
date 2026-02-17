/**
 * Tests for typed arg extractor helpers from server.ts.
 *
 * Covers: requireStringArg, requireStringArgAllowEmpty, requireNumberArg,
 * getStringArg, getNumberArg, getBooleanArg, getWindowIdArg,
 * validateNonNegativeInteger, validateHeadingLevel, validateByIndex.
 */

import { describe, it, expect } from 'vitest';
import {
  getStringArg,
  requireStringArg,
  requireStringArgAllowEmpty,
  getNumberArg,
  requireNumberArg,
  getBooleanArg,
  getWindowIdArg,
  validateNonNegativeInteger,
  validateHeadingLevel,
  validateByIndex,
} from '../../../src/server.js';
import type { ToolArgs } from '../../../src/server.js';

// ============================================================
// getStringArg
// ============================================================

describe('getStringArg', () => {
  it('returns string when value is a string', () => {
    expect(getStringArg({ name: 'hello' }, 'name')).toBe('hello');
  });

  it('returns empty string when value is ""', () => {
    expect(getStringArg({ name: '' }, 'name')).toBe('');
  });

  it('returns undefined when key is missing', () => {
    expect(getStringArg({}, 'name')).toBeUndefined();
  });

  it('returns undefined when value is undefined', () => {
    expect(getStringArg({ name: undefined }, 'name')).toBeUndefined();
  });

  it('returns undefined when value is null', () => {
    expect(getStringArg({ name: null }, 'name')).toBeUndefined();
  });

  it('returns undefined when value is a number', () => {
    expect(getStringArg({ name: 42 }, 'name')).toBeUndefined();
  });

  it('returns undefined when value is a boolean', () => {
    expect(getStringArg({ name: true }, 'name')).toBeUndefined();
  });

  it('returns undefined when value is an object', () => {
    expect(getStringArg({ name: { nested: true } }, 'name')).toBeUndefined();
  });

  it('returns undefined when value is an array', () => {
    expect(getStringArg({ name: ['a', 'b'] }, 'name')).toBeUndefined();
  });

  it('handles unicode/CJK strings', () => {
    expect(getStringArg({ name: '你好世界' }, 'name')).toBe('你好世界');
  });

  it('handles string with only whitespace', () => {
    expect(getStringArg({ name: '   ' }, 'name')).toBe('   ');
  });
});

// ============================================================
// requireStringArg
// ============================================================

describe('requireStringArg', () => {
  it('returns string when value is a non-empty string', () => {
    expect(requireStringArg({ text: 'hello' }, 'text')).toBe('hello');
  });

  it('returns whitespace-only string (not empty)', () => {
    expect(requireStringArg({ text: '  ' }, 'text')).toBe('  ');
  });

  it('returns unicode string', () => {
    expect(requireStringArg({ text: '日本語テスト' }, 'text')).toBe('日本語テスト');
  });

  it('throws when value is an empty string', () => {
    expect(() => requireStringArg({ text: '' }, 'text')).toThrow(
      'text must be a non-empty string'
    );
  });

  it('throws when key is missing from args', () => {
    expect(() => requireStringArg({}, 'text')).toThrow(
      'text must be a non-empty string'
    );
  });

  it('throws when value is undefined', () => {
    expect(() => requireStringArg({ text: undefined }, 'text')).toThrow(
      'text must be a non-empty string'
    );
  });

  it('throws when value is null', () => {
    expect(() => requireStringArg({ text: null }, 'text')).toThrow(
      'text must be a non-empty string'
    );
  });

  it('throws when value is a number', () => {
    expect(() => requireStringArg({ text: 123 }, 'text')).toThrow(
      'text must be a non-empty string'
    );
  });

  it('throws when value is a boolean', () => {
    expect(() => requireStringArg({ text: false }, 'text')).toThrow(
      'text must be a non-empty string'
    );
  });

  it('throws when value is an object', () => {
    expect(() => requireStringArg({ text: {} }, 'text')).toThrow(
      'text must be a non-empty string'
    );
  });

  it('includes the key name in the error message', () => {
    expect(() => requireStringArg({}, 'myField')).toThrow('myField');
  });
});

// ============================================================
// requireStringArgAllowEmpty
// ============================================================

describe('requireStringArgAllowEmpty', () => {
  it('returns string when value is a non-empty string', () => {
    expect(requireStringArgAllowEmpty({ text: 'hello' }, 'text')).toBe('hello');
  });

  it('returns empty string when value is ""', () => {
    expect(requireStringArgAllowEmpty({ text: '' }, 'text')).toBe('');
  });

  it('returns whitespace-only string', () => {
    expect(requireStringArgAllowEmpty({ text: '  ' }, 'text')).toBe('  ');
  });

  it('throws when key is missing', () => {
    expect(() => requireStringArgAllowEmpty({}, 'text')).toThrow(
      'text must be a string'
    );
  });

  it('throws when value is undefined', () => {
    expect(() => requireStringArgAllowEmpty({ text: undefined }, 'text')).toThrow(
      'text must be a string'
    );
  });

  it('throws when value is null', () => {
    expect(() => requireStringArgAllowEmpty({ text: null }, 'text')).toThrow(
      'text must be a string'
    );
  });

  it('throws when value is a number', () => {
    expect(() => requireStringArgAllowEmpty({ text: 42 }, 'text')).toThrow(
      'text must be a string'
    );
  });

  it('throws when value is a boolean', () => {
    expect(() => requireStringArgAllowEmpty({ text: true }, 'text')).toThrow(
      'text must be a string'
    );
  });

  it('includes the key name in the error message', () => {
    expect(() => requireStringArgAllowEmpty({ replacement: 99 }, 'replacement')).toThrow(
      'replacement'
    );
  });
});

// ============================================================
// getNumberArg
// ============================================================

describe('getNumberArg', () => {
  it('returns number when value is a positive number', () => {
    expect(getNumberArg({ count: 42 }, 'count')).toBe(42);
  });

  it('returns 0 (falsy but valid)', () => {
    expect(getNumberArg({ count: 0 }, 'count')).toBe(0);
  });

  it('returns negative numbers', () => {
    expect(getNumberArg({ count: -5 }, 'count')).toBe(-5);
  });

  it('returns floating point numbers', () => {
    expect(getNumberArg({ count: 3.14 }, 'count')).toBe(3.14);
  });

  it('returns undefined when key is missing', () => {
    expect(getNumberArg({}, 'count')).toBeUndefined();
  });

  it('returns undefined when value is undefined', () => {
    expect(getNumberArg({ count: undefined }, 'count')).toBeUndefined();
  });

  it('returns undefined when value is null', () => {
    expect(getNumberArg({ count: null }, 'count')).toBeUndefined();
  });

  it('returns undefined when value is a string', () => {
    expect(getNumberArg({ count: '42' }, 'count')).toBeUndefined();
  });

  it('returns undefined when value is a boolean', () => {
    expect(getNumberArg({ count: true }, 'count')).toBeUndefined();
  });

  it('returns undefined when value is NaN', () => {
    expect(getNumberArg({ count: NaN }, 'count')).toBeUndefined();
  });

  it('returns undefined when value is Infinity', () => {
    expect(getNumberArg({ count: Infinity }, 'count')).toBeUndefined();
  });

  it('returns undefined when value is -Infinity', () => {
    expect(getNumberArg({ count: -Infinity }, 'count')).toBeUndefined();
  });

  it('returns undefined when value is an object', () => {
    expect(getNumberArg({ count: {} }, 'count')).toBeUndefined();
  });
});

// ============================================================
// requireNumberArg
// ============================================================

describe('requireNumberArg', () => {
  it('returns number when value is a positive number', () => {
    expect(requireNumberArg({ pos: 10 }, 'pos')).toBe(10);
  });

  it('returns 0 (falsy but valid)', () => {
    expect(requireNumberArg({ pos: 0 }, 'pos')).toBe(0);
  });

  it('returns negative numbers', () => {
    expect(requireNumberArg({ pos: -1 }, 'pos')).toBe(-1);
  });

  it('returns floating point numbers', () => {
    expect(requireNumberArg({ pos: 2.5 }, 'pos')).toBe(2.5);
  });

  it('throws when key is missing', () => {
    expect(() => requireNumberArg({}, 'pos')).toThrow('pos must be a number');
  });

  it('throws when value is undefined', () => {
    expect(() => requireNumberArg({ pos: undefined }, 'pos')).toThrow(
      'pos must be a number'
    );
  });

  it('throws when value is null', () => {
    expect(() => requireNumberArg({ pos: null }, 'pos')).toThrow(
      'pos must be a number'
    );
  });

  it('throws when value is a string', () => {
    expect(() => requireNumberArg({ pos: '10' }, 'pos')).toThrow(
      'pos must be a number'
    );
  });

  it('throws when value is a boolean', () => {
    expect(() => requireNumberArg({ pos: true }, 'pos')).toThrow(
      'pos must be a number'
    );
  });

  it('throws when value is NaN', () => {
    expect(() => requireNumberArg({ pos: NaN }, 'pos')).toThrow(
      'pos must be a number'
    );
  });

  it('throws when value is Infinity', () => {
    expect(() => requireNumberArg({ pos: Infinity }, 'pos')).toThrow(
      'pos must be a number'
    );
  });

  it('includes the key name in the error message', () => {
    expect(() => requireNumberArg({}, 'fromPosition')).toThrow('fromPosition');
  });
});

// ============================================================
// getBooleanArg
// ============================================================

describe('getBooleanArg', () => {
  it('returns true when value is true', () => {
    expect(getBooleanArg({ flag: true }, 'flag')).toBe(true);
  });

  it('returns false when value is false', () => {
    expect(getBooleanArg({ flag: false }, 'flag')).toBe(false);
  });

  it('returns undefined when key is missing', () => {
    expect(getBooleanArg({}, 'flag')).toBeUndefined();
  });

  it('returns undefined when value is undefined', () => {
    expect(getBooleanArg({ flag: undefined }, 'flag')).toBeUndefined();
  });

  it('returns undefined when value is null', () => {
    expect(getBooleanArg({ flag: null }, 'flag')).toBeUndefined();
  });

  it('returns undefined when value is a string', () => {
    expect(getBooleanArg({ flag: 'true' }, 'flag')).toBeUndefined();
  });

  it('returns undefined when value is a number', () => {
    expect(getBooleanArg({ flag: 1 }, 'flag')).toBeUndefined();
  });

  it('returns undefined when value is 0 (falsy number)', () => {
    expect(getBooleanArg({ flag: 0 }, 'flag')).toBeUndefined();
  });

  it('returns undefined when value is an empty string (falsy)', () => {
    expect(getBooleanArg({ flag: '' }, 'flag')).toBeUndefined();
  });

  it('returns undefined when value is an object', () => {
    expect(getBooleanArg({ flag: {} }, 'flag')).toBeUndefined();
  });
});

// ============================================================
// getWindowIdArg
// ============================================================

describe('getWindowIdArg', () => {
  it('returns "focused" when args is empty', () => {
    expect(getWindowIdArg({})).toBe('focused');
  });

  it('returns "focused" when windowId is not provided', () => {
    expect(getWindowIdArg({ other: 'value' })).toBe('focused');
  });

  it('returns "focused" when windowId is undefined', () => {
    expect(getWindowIdArg({ windowId: undefined })).toBe('focused');
  });

  it('returns "focused" when windowId is not a string', () => {
    expect(getWindowIdArg({ windowId: 123 })).toBe('focused');
  });

  it('returns "focused" when windowId is null', () => {
    expect(getWindowIdArg({ windowId: null })).toBe('focused');
  });

  it('returns custom window ID when provided', () => {
    expect(getWindowIdArg({ windowId: 'main' })).toBe('main');
  });

  it('returns "focused" string as-is', () => {
    expect(getWindowIdArg({ windowId: 'focused' })).toBe('focused');
  });

  it('returns arbitrary string window ID', () => {
    expect(getWindowIdArg({ windowId: 'secondary-window' })).toBe(
      'secondary-window'
    );
  });
});

// ============================================================
// validateNonNegativeInteger
// ============================================================

describe('validateNonNegativeInteger', () => {
  it('returns null for 0', () => {
    expect(validateNonNegativeInteger(0, 'idx')).toBeNull();
  });

  it('returns null for positive integer', () => {
    expect(validateNonNegativeInteger(5, 'idx')).toBeNull();
  });

  it('returns null for large integer', () => {
    expect(validateNonNegativeInteger(999999, 'idx')).toBeNull();
  });

  it('returns error for negative integer', () => {
    expect(validateNonNegativeInteger(-1, 'idx')).toBe('idx must be non-negative');
  });

  it('returns error for float', () => {
    expect(validateNonNegativeInteger(1.5, 'idx')).toBe('idx must be an integer');
  });

  it('returns error for negative float', () => {
    expect(validateNonNegativeInteger(-0.5, 'idx')).toBe('idx must be an integer');
  });

  it('returns error for NaN', () => {
    expect(validateNonNegativeInteger(NaN, 'idx')).toBe(
      'idx must be a finite number'
    );
  });

  it('returns error for Infinity', () => {
    expect(validateNonNegativeInteger(Infinity, 'idx')).toBe(
      'idx must be a finite number'
    );
  });

  it('returns error for -Infinity', () => {
    expect(validateNonNegativeInteger(-Infinity, 'idx')).toBe(
      'idx must be a finite number'
    );
  });

  it('returns error for string', () => {
    expect(validateNonNegativeInteger('5', 'idx')).toBe('idx must be a number');
  });

  it('returns error for null', () => {
    expect(validateNonNegativeInteger(null, 'idx')).toBe('idx must be a number');
  });

  it('returns error for undefined', () => {
    expect(validateNonNegativeInteger(undefined, 'idx')).toBe(
      'idx must be a number'
    );
  });

  it('returns error for boolean', () => {
    expect(validateNonNegativeInteger(true, 'idx')).toBe('idx must be a number');
  });

  it('includes field name in all error messages', () => {
    const fieldName = 'mySpecialField';
    expect(validateNonNegativeInteger('x', fieldName)).toContain(fieldName);
    expect(validateNonNegativeInteger(-1, fieldName)).toContain(fieldName);
    expect(validateNonNegativeInteger(1.5, fieldName)).toContain(fieldName);
    expect(validateNonNegativeInteger(NaN, fieldName)).toContain(fieldName);
  });
});

// ============================================================
// validateHeadingLevel
// ============================================================

describe('validateHeadingLevel', () => {
  it.each([1, 2, 3, 4, 5, 6])('returns null for valid level %i', (level) => {
    expect(validateHeadingLevel(level, 'level')).toBeNull();
  });

  it('returns error for 0', () => {
    expect(validateHeadingLevel(0, 'level')).toContain('between 1 and 6');
  });

  it('returns error for 7', () => {
    expect(validateHeadingLevel(7, 'level')).toContain('between 1 and 6');
  });

  it('returns error for negative number', () => {
    expect(validateHeadingLevel(-1, 'level')).toContain('between 1 and 6');
  });

  it('returns error for float', () => {
    expect(validateHeadingLevel(2.5, 'level')).toContain('between 1 and 6');
  });

  it('returns error for string', () => {
    expect(validateHeadingLevel('2', 'level')).toContain('between 1 and 6');
  });

  it('returns error for NaN', () => {
    expect(validateHeadingLevel(NaN, 'level')).toContain('between 1 and 6');
  });

  it('returns error for null', () => {
    expect(validateHeadingLevel(null, 'level')).toContain('between 1 and 6');
  });

  it('includes label in error message', () => {
    expect(validateHeadingLevel(99, 'headingLevel')).toContain('headingLevel');
  });
});

// ============================================================
// validateByIndex
// ============================================================

describe('validateByIndex', () => {
  it('returns null for valid byIndex (level=1, index=0)', () => {
    expect(validateByIndex({ level: 1, index: 0 }, 'target')).toBeNull();
  });

  it('returns null for valid byIndex (level=6, index=10)', () => {
    expect(validateByIndex({ level: 6, index: 10 }, 'target')).toBeNull();
  });

  it('returns error when level is invalid', () => {
    const result = validateByIndex({ level: 0, index: 0 }, 'target');
    expect(result).toContain('target.level');
  });

  it('returns error when index is negative', () => {
    const result = validateByIndex({ level: 1, index: -1 }, 'target');
    expect(result).toContain('target.index');
  });

  it('returns error when index is a float', () => {
    const result = validateByIndex({ level: 1, index: 1.5 }, 'target');
    expect(result).toContain('target.index');
  });

  it('returns error when level is a string', () => {
    const result = validateByIndex({ level: '1', index: 0 }, 'target');
    expect(result).toContain('target.level');
  });

  it('returns level error first when both are invalid', () => {
    const result = validateByIndex({ level: 99, index: -1 }, 'target');
    // Should report the first failure (level validation runs first)
    expect(result).toContain('target.level');
  });
});

// ============================================================
// Integration: validation in tool handlers (end-to-end)
// ============================================================

describe('integration: validation rejection in tool handlers', () => {
  // These tests verify that when tool handlers use the typed arg
  // extractors, invalid arguments produce proper MCP error responses
  // rather than crashing or returning undefined behavior.

  let bridge: import('../../mocks/mockBridge.js').MockBridge;
  let server: import('../../../src/server.js').VMarkMcpServer;
  let client: import('../../utils/McpTestClient.js').McpTestClient;

  beforeEach(async () => {
    const { MockBridge } = await import('../../mocks/mockBridge.js');
    const { VMarkMcpServer } = await import('../../../src/server.js');
    const { registerDocumentTools } = await import(
      '../../../src/tools/document.js'
    );
    const { registerSelectionTools } = await import(
      '../../../src/tools/selection.js'
    );
    const { McpTestClient } = await import('../../utils/McpTestClient.js');

    bridge = new MockBridge();
    server = new VMarkMcpServer({ bridge });
    registerDocumentTools(server);
    registerSelectionTools(server);
    client = new McpTestClient(server);
  });

  it('document_set_content rejects number for content arg', async () => {
    const result = await client.callTool('document_set_content', {
      content: 12345,
    });

    expect(result.success).toBe(false);
    expect(result.isError).toBe(true);
  });

  it('document_set_content accepts empty string for content', async () => {
    const result = await client.callTool('document_set_content', {
      content: '',
    });

    // Should succeed (requireStringArgAllowEmpty allows "")
    expect(result.success).toBe(true);
  });

  it('document_set_content rejects missing content arg', async () => {
    const result = await client.callTool('document_set_content', {});

    expect(result.success).toBe(false);
    expect(result.isError).toBe(true);
  });

  it('document_insert_at_cursor rejects number for text arg', async () => {
    const result = await client.callTool('document_insert_at_cursor', {
      text: 999,
    });

    expect(result.success).toBe(false);
    expect(result.isError).toBe(true);
  });

  it('selection_set rejects string for from arg', async () => {
    const result = await client.callTool('selection_set', {
      from: 'abc',
      to: 10,
    });

    expect(result.success).toBe(false);
    expect(result.isError).toBe(true);
  });

  it('selection_set rejects missing to arg', async () => {
    const result = await client.callTool('selection_set', {
      from: 0,
    });

    expect(result.success).toBe(false);
    expect(result.isError).toBe(true);
  });

  it('non-string windowId falls back to focused', async () => {
    bridge.setContent('test');

    const result = await client.callTool('document_get_content', {
      windowId: 42,
    });

    // windowId is extracted via getStringArg -> resolveWindowId,
    // so a number becomes undefined -> defaults to 'focused'
    expect(result.success).toBe(true);
  });
});
