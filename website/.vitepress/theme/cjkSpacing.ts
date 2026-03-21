/**
 * CJK Letter Spacing — runtime text node scanner for VitePress.
 *
 * Walks text nodes inside a container, wraps consecutive CJK character runs
 * in <span class="cjk-spacing"> so CSS letter-spacing applies only to
 * CJK glyphs (not Latin).
 *
 * Idempotent: skips nodes already wrapped in .cjk-spacing spans.
 * Safe to call multiple times on the same container.
 *
 * @module theme/cjkSpacing
 */

// Same ranges as VMark editor's cjkLetterSpacing plugin (src/plugins/cjkLetterSpacing/index.ts)
const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af\u3100-\u312f]+/g

/** Containers to skip — rendered widgets where inserting <span> would break DOM */
const SKIP_SELECTOR = 'pre, code, svg, .cjk-spacing, .markmap-container, .mermaid, .katex, .vp-code-group'

/** Check if the current page lang is CJK (handles subtags like ja-JP, ko-KR) */
function isCJKPage(): boolean {
  const primary = document.documentElement.lang.toLowerCase().split('-')[0]
  return primary === 'zh' || primary === 'ja' || primary === 'ko'
}

/**
 * Wrap CJK character runs in text nodes with <span class="cjk-spacing">.
 *
 * Idempotent — skips nodes already inside .cjk-spacing spans and other
 * excluded containers (code, SVG, Mermaid, KaTeX, markmap).
 */
export function wrapCJKRuns(root: Element): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []

  // Collect first, modify later (avoid walker invalidation)
  let node: Text | null
  while ((node = walker.nextNode() as Text | null)) {
    if (node.parentElement?.closest(SKIP_SELECTOR)) continue
    if (CJK_RE.test(node.data)) {
      textNodes.push(node)
      CJK_RE.lastIndex = 0
    }
  }

  for (const textNode of textNodes) {
    const text = textNode.data
    const frag = document.createDocumentFragment()
    let lastIndex = 0

    CJK_RE.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = CJK_RE.exec(text)) !== null) {
      // Text before the CJK run
      if (match.index > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)))
      }
      // CJK run wrapped in span
      const span = document.createElement('span')
      span.className = 'cjk-spacing'
      span.textContent = match[0]
      frag.appendChild(span)
      lastIndex = match.index + match[0].length
    }
    // Remaining text after last CJK run
    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)))
    }

    textNode.parentNode?.replaceChild(frag, textNode)
  }
}

/** Initialize CJK spacing for the current page */
export function initCJKSpacing(): void {
  if (typeof window === 'undefined') return

  const apply = () => {
    if (!isCJKPage()) return
    const doc = document.querySelector('.vp-doc')
    if (doc) wrapCJKRuns(doc)
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply)
  } else {
    requestAnimationFrame(apply)
  }
}
