<script setup lang="ts">
import { ref, nextTick } from 'vue'

const inputRef = ref<HTMLInputElement | null>(null)
const text = ref('')
const cursorPos = ref(0)
const flash = ref(false)
const pairs: Record<string, string> = {
  '(': ')', '[': ']', '{': '}', '"': '"', "'": "'", '`': '`',
  '「': '」', '（': '）', '【': '】',
}

function handleKeydown(e: KeyboardEvent) {
  const el = inputRef.value
  if (!el) return

  const pos = el.selectionStart ?? 0

  if (e.key === 'Tab') {
    e.preventDefault()
    // If next char is a closing bracket/quote, jump over it
    const nextChar = text.value[pos]
    if (nextChar && Object.values(pairs).includes(nextChar)) {
      cursorPos.value = pos + 1
      flash.value = true
      setTimeout(() => { flash.value = false }, 300)
      nextTick(() => {
        el.setSelectionRange(pos + 1, pos + 1)
      })
    }
    return
  }

  if (e.key === 'Backspace') {
    e.preventDefault()
    // If inside empty pair, delete both
    const before = text.value[pos - 1]
    const after = text.value[pos]
    if (before && pairs[before] === after) {
      text.value = text.value.slice(0, pos - 1) + text.value.slice(pos + 1)
      cursorPos.value = pos - 1
      nextTick(() => el.setSelectionRange(pos - 1, pos - 1))
    } else if (pos > 0) {
      text.value = text.value.slice(0, pos - 1) + text.value.slice(pos)
      cursorPos.value = pos - 1
      nextTick(() => el.setSelectionRange(pos - 1, pos - 1))
    }
    return
  }

  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    const ch = e.key
    if (pairs[ch]) {
      // Auto-pair: insert both opening and closing
      text.value = text.value.slice(0, pos) + ch + pairs[ch] + text.value.slice(pos)
      cursorPos.value = pos + 1
      nextTick(() => el.setSelectionRange(pos + 1, pos + 1))
    } else {
      // Normal character
      text.value = text.value.slice(0, pos) + ch + text.value.slice(pos)
      cursorPos.value = pos + 1
      nextTick(() => el.setSelectionRange(pos + 1, pos + 1))
    }
  }
}

function focus() {
  inputRef.value?.focus()
}
</script>

<template>
  <div class="vmark-demo">
    <p class="vmark-demo__subtitle">Type an opening bracket or quote, then press Tab to escape</p>

    <div class="editor-frame" @click="focus">
      <div class="editor-line">
        <span class="line-prompt">›</span>
        <input
          ref="inputRef"
          :value="text"
          class="editor-input"
          placeholder="Try typing ( [ { &quot; ' ` then Tab..."
          spellcheck="false"
          autocomplete="off"
          @keydown="handleKeydown"
          @input="() => {}"
        />
      </div>
    </div>

    <div :class="['tab-hint', { 'tab-hint--flash': flash }]">
      <span v-if="flash">Tab → jumped past closing character</span>
      <span v-else>Type a bracket or quote to see auto-pair, then press <kbd>Tab</kbd> to jump out</span>
    </div>

    <div class="pair-grid">
      <span class="pair-item" v-for="[open, close] in Object.entries(pairs)" :key="open">
        <code>{{ open }}{{ close }}</code>
      </span>
    </div>

    <div class="vmark-hint">
      <span class="vmark-hint__icon">💡</span>
      <span>Backspace inside an empty pair deletes both characters. Works for all bracket and quote types.</span>
    </div>
  </div>
</template>

<style src="./vmark-ui.css"></style>
<style scoped>
.editor-frame {
  background: var(--code-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  margin-bottom: 12px;
  cursor: text;
}

.editor-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.line-prompt {
  color: var(--accent-primary);
  font-family: var(--font-mono);
  font-size: 14px;
  flex-shrink: 0;
}

.editor-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--code-text-color);
  font-family: var(--font-mono);
  font-size: 15px;
  line-height: 1.6;
  outline: none;
  caret-color: var(--accent-primary);
}

.editor-input::placeholder {
  color: var(--text-tertiary);
  opacity: 0.6;
}

.tab-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  padding: 8px 12px;
  background: var(--subtle-bg);
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.tab-hint kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 1px 5px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-color);
}

.tab-hint--flash {
  background: var(--accent-bg);
  color: var(--accent-primary);
  font-weight: 500;
}

.pair-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.pair-item code {
  display: inline-block;
  padding: 3px 10px;
  font-family: var(--font-mono);
  font-size: 14px;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  color: var(--text-color);
}
</style>
