<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

const lines = ref([
  'const count = items.length;',
  'if (count > 0) {',
  '  console.log(count);',
  '  return count;',
  '}',
])

const cursors = ref<Array<{ line: number; col: number; selecting?: [number, number] }>>([])
const phase = ref<'idle' | 'selecting' | 'typing' | 'done'>('idle')
const typed = ref('')
let timer: ReturnType<typeof setTimeout> | null = null

function cleanup() {
  if (timer) { clearTimeout(timer); timer = null }
}

function reset() {
  cleanup()
  lines.value = [
    'const count = items.length;',
    'if (count > 0) {',
    '  console.log(count);',
    '  return count;',
    '}',
  ]
  cursors.value = []
  phase.value = 'idle'
  typed.value = ''
}

function runDemo() {
  reset()
  phase.value = 'selecting'

  // Step 1: Place cursor on first "count" (line 0, col 6)
  timer = setTimeout(() => {
    cursors.value = [{ line: 0, col: 6, selecting: [6, 11] }]

    // Step 2: Mod+D — add second "count" (line 1)
    timer = setTimeout(() => {
      cursors.value = [
        { line: 0, col: 6, selecting: [6, 11] },
        { line: 1, col: 4, selecting: [4, 9] },
      ]

      // Step 3: Mod+D — add third "count" (line 2)
      timer = setTimeout(() => {
        cursors.value = [
          { line: 0, col: 6, selecting: [6, 11] },
          { line: 1, col: 4, selecting: [4, 9] },
          { line: 2, col: 14, selecting: [14, 19] },
        ]

        // Step 4: Mod+D — add fourth "count" (line 3)
        timer = setTimeout(() => {
          cursors.value = [
            { line: 0, col: 6, selecting: [6, 11] },
            { line: 1, col: 4, selecting: [4, 9] },
            { line: 2, col: 14, selecting: [14, 19] },
            { line: 3, col: 9, selecting: [9, 14] },
          ]

          // Step 5: Type "total" character by character
          timer = setTimeout(() => {
            phase.value = 'typing'
            const word = 'total'
            let charIdx = 0

            function typeChar() {
              if (charIdx < word.length) {
                typed.value = word.slice(0, charIdx + 1)
                charIdx++
                timer = setTimeout(typeChar, 120)
              } else {
                // Done — update lines
                lines.value = [
                  'const total = items.length;',
                  'if (total > 0) {',
                  '  console.log(total);',
                  '  return total;',
                  '}',
                ]
                cursors.value = [
                  { line: 0, col: 11 },
                  { line: 1, col: 9 },
                  { line: 2, col: 19 },
                  { line: 3, col: 14 },
                ]
                phase.value = 'done'
              }
            }
            typeChar()
          }, 500)
        }, 400)
      }, 400)
    }, 400)
  }, 300)
}

onUnmounted(cleanup)
</script>

<template>
  <div class="vmark-demo">
    <p class="vmark-demo__subtitle">Watch multi-cursor rename "count" → "total" across all occurrences</p>

    <div class="demo-toolbar">
      <button class="vmark-btn--pill vmark-btn" @click="runDemo" :disabled="phase === 'selecting' || phase === 'typing'">
        ▶ {{ phase === 'idle' ? 'Run Demo' : phase === 'done' ? 'Run Again' : 'Running...' }}
      </button>
      <button v-if="phase !== 'idle'" class="vmark-btn--pill vmark-btn" @click="reset">Reset</button>
      <span v-if="phase === 'selecting'" class="step-label">Selecting with Mod + D...</span>
      <span v-if="phase === 'typing'" class="step-label">Typing "total"...</span>
      <span v-if="phase === 'done'" class="step-label done-label">Done — all 4 renamed at once</span>
    </div>

    <div class="editor-frame">
      <div class="source-line" v-for="(line, li) in lines" :key="li">
        <span class="line-number">{{ li + 1 }}</span>
        <span class="line-text">
          <template v-for="(ch, ci) in line.split('')" :key="ci">
            <span
              v-if="cursors.some(c => c.line === li && c.selecting && ci >= c.selecting[0] && ci < c.selecting[1]) && phase === 'selecting'"
              class="selected-char"
            >{{ ch }}</span>
            <template v-else>{{ ch }}</template>
          </template>
          <template v-for="(cursor, idx) in cursors.filter(c => c.line === li && !c.selecting)" :key="'c' + idx">
            <span v-if="cursor.col === line.length" class="cursor-caret" :class="{ 'cursor-caret--primary': idx === 0 }"></span>
          </template>
        </span>
      </div>
    </div>

    <div class="shortcut-strip">
      <span class="shortcut-item"><kbd>Mod + D</kbd> Select next match</span>
      <span class="shortcut-item"><kbd>Alt + Click</kbd> Add cursor</span>
      <span class="shortcut-item"><kbd>Mod + Alt + ↑↓</kbd> Add cursor above/below</span>
    </div>
  </div>
</template>

<style src="./vmark-ui.css"></style>
<style scoped>
.demo-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.step-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-left: 4px;
}

.done-label {
  color: var(--success-color);
  font-weight: 500;
}

.editor-frame {
  background: var(--code-bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 12px 0;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 12px;
  overflow-x: auto;
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
  position: relative;
}

.selected-char {
  background: var(--selection-color);
  border-radius: 1px;
}

.cursor-caret {
  display: inline-block;
  width: 2px;
  height: 1.2em;
  background: var(--accent-primary);
  vertical-align: text-bottom;
  margin-left: -1px;
  animation: blink 1s step-end infinite;
}

.cursor-caret--primary {
  background: var(--text-color);
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.shortcut-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.shortcut-item kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 1px 5px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 3px;
  color: var(--text-color);
}
</style>
