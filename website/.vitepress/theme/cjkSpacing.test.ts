// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { wrapCJKRuns } from './cjkSpacing'

/** Helper: create a container with child elements for testing.
 *  Uses DOM APIs only — no innerHTML — to build test fixtures. */
function text(content: string): Text {
  return document.createTextNode(content)
}

function el(tag: string, attrs?: Record<string, string>, ...children: Node[]): HTMLElement {
  const node = document.createElement(tag)
  if (attrs) for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  for (const child of children) node.appendChild(child)
  return node
}

function svgEl(tag: string, ...children: Node[]): SVGElement {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag)
  for (const child of children) node.appendChild(child)
  return node
}

describe('wrapCJKRuns', () => {
  it('wraps CJK characters in .cjk-spacing spans', () => {
    const root = el('div', {}, el('p', {}, text('中文测试')))
    wrapCJKRuns(root)
    const span = root.querySelector('.cjk-spacing')
    expect(span).not.toBeNull()
    expect(span!.textContent).toBe('中文测试')
  })

  it('does not wrap Latin-only text', () => {
    const root = el('div', {}, el('p', {}, text('Hello world')))
    wrapCJKRuns(root)
    expect(root.querySelector('.cjk-spacing')).toBeNull()
    expect(root.textContent).toBe('Hello world')
  })

  it('separates CJK and Latin into different nodes', () => {
    const root = el('div', {}, el('p', {}, text('Hello中文World')))
    wrapCJKRuns(root)
    const spans = root.querySelectorAll('.cjk-spacing')
    expect(spans).toHaveLength(1)
    expect(spans[0].textContent).toBe('中文')
    expect(root.textContent).toBe('Hello中文World')
  })

  it('handles multiple CJK runs in one text node', () => {
    const root = el('div', {}, el('p', {}, text('A中文B日本語C')))
    wrapCJKRuns(root)
    const spans = root.querySelectorAll('.cjk-spacing')
    expect(spans).toHaveLength(2)
    expect(spans[0].textContent).toBe('中文')
    expect(spans[1].textContent).toBe('日本語')
  })

  it('wraps Japanese hiragana and katakana', () => {
    const root = el('div', {}, el('p', {}, text('テスト and ひらがな')))
    wrapCJKRuns(root)
    const spans = root.querySelectorAll('.cjk-spacing')
    expect(spans).toHaveLength(2)
    expect(spans[0].textContent).toBe('テスト')
    expect(spans[1].textContent).toBe('ひらがな')
  })

  it('wraps Korean hangul', () => {
    const root = el('div', {}, el('p', {}, text('한국어 text')))
    wrapCJKRuns(root)
    const span = root.querySelector('.cjk-spacing')
    expect(span).not.toBeNull()
    expect(span!.textContent).toBe('한국어')
  })

  it('skips text inside <pre>', () => {
    const root = el('div', {}, el('pre', {}, text('中文代码')))
    wrapCJKRuns(root)
    expect(root.querySelector('.cjk-spacing')).toBeNull()
  })

  it('skips text inside <code>', () => {
    const root = el('div', {}, el('p', {}, el('code', {}, text('中文'))))
    wrapCJKRuns(root)
    expect(root.querySelector('.cjk-spacing')).toBeNull()
  })

  it('skips text inside <svg>', () => {
    const root = el('div', {})
    const svg = svgEl('svg', svgEl('text', text('中文')))
    root.appendChild(svg)
    wrapCJKRuns(root)
    expect(root.querySelector('.cjk-spacing')).toBeNull()
  })

  it('skips text inside .mermaid container', () => {
    const root = el('div', {}, el('div', { class: 'mermaid' }, text('中文节点')))
    wrapCJKRuns(root)
    expect(root.querySelector('.cjk-spacing')).toBeNull()
  })

  it('skips text inside .katex container', () => {
    const root = el('div', {}, el('span', { class: 'katex' }, text('中文')))
    wrapCJKRuns(root)
    expect(root.querySelector('.cjk-spacing')).toBeNull()
  })

  it('skips text inside .markmap-container', () => {
    const root = el('div', {}, el('div', { class: 'markmap-container' }, text('中文')))
    wrapCJKRuns(root)
    expect(root.querySelector('.cjk-spacing')).toBeNull()
  })

  it('is idempotent — second call does not nest spans', () => {
    const root = el('div', {}, el('p', {}, text('中文测试')))
    wrapCJKRuns(root)
    wrapCJKRuns(root)
    const spans = root.querySelectorAll('.cjk-spacing')
    expect(spans).toHaveLength(1)
    expect(spans[0].textContent).toBe('中文测试')
    expect(root.querySelector('.cjk-spacing .cjk-spacing')).toBeNull()
  })

  it('is idempotent with mixed content after 3 calls', () => {
    const root = el('div', {}, el('p', {}, text('Hello中文World')))
    wrapCJKRuns(root)
    wrapCJKRuns(root)
    wrapCJKRuns(root)
    const spans = root.querySelectorAll('.cjk-spacing')
    expect(spans).toHaveLength(1)
    expect(root.textContent).toBe('Hello中文World')
  })

  it('handles empty container gracefully', () => {
    const root = el('div', {}, el('p', {}))
    wrapCJKRuns(root)
    expect(root.querySelector('.cjk-spacing')).toBeNull()
  })

  it('handles text with only ASCII punctuation', () => {
    const root = el('div', {}, el('p', {}, text('.,;:!?')))
    wrapCJKRuns(root)
    expect(root.querySelector('.cjk-spacing')).toBeNull()
  })
})
