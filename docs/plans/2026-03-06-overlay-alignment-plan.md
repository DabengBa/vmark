# Overlay Alignment Plan — Quick Open + Genie Picker

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align Quick Open (Cmd+O) and Genie Picker (Cmd+Y) to share consistent patterns for behavior, accessibility, and styling.

**Architecture:** Both overlays follow the same Spotlight pattern (portal, backdrop, IME guard, click-outside). Fixes propagate Quick Open's newer improvements back to Genie Picker, add mutual exclusion, and fix mounting/toggle bugs.

**Tech Stack:** React, Zustand, CSS, Vitest

---

### Task 1: Mutual exclusion between overlays

**Files:**
- Modify: `src/components/QuickOpen/QuickOpen.tsx`
- Modify: `src/components/GeniePicker/GeniePicker.tsx`
- Test: `src/components/QuickOpen/QuickOpen.test.tsx`
- Test: `src/components/GeniePicker/GeniePicker.test.tsx`

When one overlay opens, the other must close. Cross-store calls in each open effect.

**QuickOpen open effect:** add `useGeniePickerStore.getState().closePicker()` before state reset.
**GeniePicker open effect:** add `useQuickOpenStore.getState().close()` before state reset.

---

### Task 2: Move GeniePicker inside MainLayout

**Files:**
- Modify: `src/App.tsx`

Move `<GeniePicker />` from `App()` (outside Routes) to inside `MainLayout` (next to `<QuickOpen />`). Prevents Genie Picker from opening on Settings/PDF Export pages where no editor exists.

---

### Task 3: Fix QuickOpen menu toggle bug

**Files:**
- Modify: `src/hooks/useQuickOpenShortcuts.ts`
- Test: `src/hooks/useQuickOpenShortcuts.test.ts`

Change `menu:quick-open` handler from `toggle()` to `open()` — menu items should always open, not toggle. Keyboard shortcut keeps `toggle()`.

---

### Task 4: Port improvements to GeniePicker

**Files:**
- Modify: `src/hooks/useGenieShortcuts.ts`
- Modify: `src/components/GeniePicker/GeniePicker.tsx`

**4a.** Repeat key guard: add `if (e.repeat) return;` in useGenieShortcuts keydown handler.

**4b.** Focus restore: save `document.activeElement` on open, restore on close (same pattern as QuickOpen).

**4c.** selectedIndex clamping: add effect to clamp when `flatList.length` changes.

---

### Task 5: Add ARIA roles to GeniePicker

**Files:**
- Modify: `src/components/GeniePicker/GeniePicker.tsx`
- Modify: `src/components/GeniePicker/GenieItem.tsx`

Add to container: `role="dialog"`, `aria-modal="true"`, `aria-label="AI Genies"`
Add to textarea: `role="combobox"`, `aria-expanded="true"`, `aria-controls`, `aria-activedescendant`
Add to list: `role="listbox"`, `id="genie-picker-list"`
Add to GenieItem: `role="option"`, `aria-selected`, `id="genie-item-{index}"`

---

### Task 6: CSS style alignment

**Files:**
- Modify: `src/components/GeniePicker/genie-picker.css`
- Modify: `src/components/QuickOpen/QuickOpen.css`

**6a.** Genie responsive width: `width: 500px` → `width: min(500px, calc(100vw - 24px))`
**6b.** Genie prefers-reduced-motion: add `@media` rule
**6c.** Input font size: align Genie to 14px (match Quick Open)
**6d.** Quick Open items `:focus-visible`: add rule
**6e.** Arrow key consistency: change GeniePicker from clamp to wrap-around (modulo)

---

### Task 7: Tests for new behavior

**Files:**
- Modify: `src/components/GeniePicker/GeniePicker.test.tsx`

Add tests for: focus restore, selectedIndex clamp, ARIA roles present, arrow key wrap-around.

---

### Task 8: Gate check

Run `pnpm check:all`. All tests pass, lint clean, build succeeds.
