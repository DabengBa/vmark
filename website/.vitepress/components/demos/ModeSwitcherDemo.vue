<script setup lang="ts">
import { ref } from 'vue'

const activeMode = ref<'wysiwyg' | 'peek' | 'source'>('wysiwyg')

const markdownSource = `## Getting Started

VMark is a **modern** Markdown editor with _three_ editing modes.

- WYSIWYG for visual editing
- Source Peek for quick fixes
- Source Mode for full control`

const modes = [
  { id: 'wysiwyg' as const, label: 'WYSIWYG', shortcut: '' },
  { id: 'peek' as const, label: 'Source Peek', shortcut: 'F5' },
  { id: 'source' as const, label: 'Source', shortcut: 'F6' },
]
</script>

<template>
  <div class="vmark-demo">
    <p class="vmark-demo__subtitle">Click each mode to see how the same content looks</p>

    <div class="mode-tabs">
      <button
        v-for="mode in modes"
        :key="mode.id"
        :class="['mode-tab', { 'mode-tab--active': activeMode === mode.id }]"
        @click="activeMode = mode.id"
      >
        <span class="mode-tab__label">{{ mode.label }}</span>
        <span v-if="mode.shortcut" class="mode-tab__shortcut">{{ mode.shortcut }}</span>
      </button>
    </div>

    <div class="editor-frame">
      <!-- WYSIWYG -->
      <div v-if="activeMode === 'wysiwyg'" class="editor-content">
        <h2 class="rendered-h2">Getting Started</h2>
        <p class="rendered-p">VMark is a <strong>modern</strong> Markdown editor with <em>three</em> editing modes.</p>
        <ul class="rendered-list">
          <li>WYSIWYG for visual editing</li>
          <li>Source Peek for quick fixes</li>
          <li>Source Mode for full control</li>
        </ul>
      </div>

      <!-- Source Peek -->
      <div v-if="activeMode === 'peek'" class="editor-content">
        <div class="peek-header">
          <span class="peek-label">paragraph</span>
          <span class="peek-actions">
            <span class="peek-btn">✓ Save</span>
            <span class="peek-btn peek-btn--dim">✕ Cancel</span>
          </span>
        </div>
        <div class="peek-editor">
          <code>VMark is a **modern** Markdown editor with _three_ editing modes.</code>
        </div>
        <div class="peek-preview">
          <p class="rendered-p rendered-p--dimmed">VMark is a <strong>modern</strong> Markdown editor with <em>three</em> editing modes.</p>
        </div>
      </div>

      <!-- Source Mode -->
      <div v-if="activeMode === 'source'" class="editor-content editor-content--source">
        <div class="source-line" v-for="(line, i) in markdownSource.split('\n')" :key="i">
          <span class="line-number">{{ i + 1 }}</span>
          <span class="line-text" v-html="highlightMarkdown(line)"></span>
        </div>
      </div>
    </div>

    <div class="vmark-hint">
      <span class="vmark-hint__icon">💡</span>
      <span>Source Peek (F5) lets you edit one block's Markdown without leaving the visual editor.</span>
    </div>
  </div>
</template>

<script lang="ts">
function highlightMarkdown(line: string): string {
  return line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/(#{1,6}\s)/g, '<span class="md-heading">$1</span>')
    .replace(/(\*\*)(.*?)(\*\*)/g, '<span class="md-mark">$1</span><span class="md-bold">$2</span><span class="md-mark">$3</span>')
    .replace(/(_)(.*?)(_)/g, '<span class="md-mark">$1</span><span class="md-italic">$2</span><span class="md-mark">$3</span>')
    .replace(/^(- )/gm, '<span class="md-mark">$1</span>')
}
export default { methods: { highlightMarkdown } }
</script>

<style src="./vmark-ui.css"></style>
<style scoped>
.mode-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  padding: 3px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  width: fit-content;
}

.mode-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-family: var(--font-sans);
  cursor: pointer;
  transition: all 0.15s;
}

.mode-tab:hover:not(.mode-tab--active) {
  color: var(--text-color);
}

.mode-tab--active {
  background: var(--bg-primary);
  color: var(--text-color);
  font-weight: 500;
  box-shadow: var(--shadow-sm);
}

.mode-tab__shortcut {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-tertiary);
  padding: 1px 5px;
  background: var(--bg-secondary);
  border-radius: 3px;
}

.mode-tab--active .mode-tab__shortcut {
  background: var(--bg-tertiary);
}

.editor-frame {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  min-height: 200px;
  margin-bottom: 16px;
  overflow: hidden;
}

.editor-content {
  padding: 20px 24px;
  animation: mode-fade 0.2s ease-out;
}

@keyframes mode-fade {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* WYSIWYG rendered content */
.rendered-h2 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.3;
}

.rendered-p {
  margin: 0 0 12px 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-color);
}

.rendered-p--dimmed {
  opacity: 0.4;
}

.rendered-list {
  margin: 0;
  padding-left: 24px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--text-color);
}

/* Source Peek */
.peek-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
}

.peek-label {
  color: var(--text-tertiary);
  font-family: var(--font-mono);
}

.peek-actions {
  display: flex;
  gap: 12px;
}

.peek-btn {
  color: var(--accent-primary);
  font-size: 12px;
  cursor: pointer;
}

.peek-btn--dim {
  color: var(--text-tertiary);
}

.peek-editor {
  padding: 12px 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--code-text-color);
  background: var(--code-bg-color);
  border-bottom: 1px solid var(--border-color);
}

.peek-preview {
  padding: 16px 24px;
  opacity: 0.6;
}

/* Source Mode */
.editor-content--source {
  padding: 12px 0;
  background: var(--code-bg-color);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
}

.source-line {
  display: flex;
  padding: 0 16px 0 0;
}

.line-number {
  width: 36px;
  text-align: right;
  padding-right: 12px;
  color: var(--text-tertiary);
  user-select: none;
  flex-shrink: 0;
}

.line-text {
  color: var(--code-text-color);
  white-space: pre;
  min-height: 1.6em;
}

/* Syntax highlighting */
:deep(.md-heading) { color: var(--accent-primary); font-weight: 600; }
:deep(.md-mark) { color: var(--md-char-color); }
:deep(.md-bold) { font-weight: 600; color: var(--text-color); }
:deep(.md-italic) { font-style: italic; color: var(--text-color); }
</style>
