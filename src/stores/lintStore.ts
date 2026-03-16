/**
 * Lint Store
 *
 * Purpose: Tab-scoped storage for markdown lint diagnostics.
 * Ephemeral — no persistence. Diagnostics are cleared on document edit.
 */

import { create } from "zustand";
import { lintMarkdown } from "@/lib/lintEngine";
import type { LintDiagnostic } from "@/lib/lintEngine";

interface LintState {
  /** Diagnostics keyed by tabId */
  diagnosticsByTab: Record<string, LintDiagnostic[]>;
  /** Currently selected diagnostic index per tab for navigation */
  selectedIndexByTab: Record<string, number>;
}

interface LintActions {
  /** Run lint on source for a specific tab */
  runLint: (tabId: string, source: string) => LintDiagnostic[];
  /** Clear diagnostics for a specific tab */
  clearDiagnostics: (tabId: string) => void;
  /** Clear all tabs */
  clearAllDiagnostics: () => void;
  /** Navigate to next diagnostic (wraps around) */
  selectNext: (tabId: string) => void;
  /** Navigate to previous diagnostic (wraps around) */
  selectPrev: (tabId: string) => void;
}

export const useLintStore = create<LintState & LintActions>((set) => ({
  diagnosticsByTab: {},
  selectedIndexByTab: {},

  runLint: (tabId, source) => {
    const diagnostics = lintMarkdown(source);

    set((state) => ({
      diagnosticsByTab: { ...state.diagnosticsByTab, [tabId]: diagnostics },
      selectedIndexByTab: { ...state.selectedIndexByTab, [tabId]: 0 },
    }));

    return diagnostics;
  },

  clearDiagnostics: (tabId) => {
    set((state) => {
      const { [tabId]: _, ...rest } = state.diagnosticsByTab;
      const { [tabId]: __, ...indexRest } = state.selectedIndexByTab;
      return {
        diagnosticsByTab: rest,
        selectedIndexByTab: indexRest,
      };
    });
  },

  clearAllDiagnostics: () => {
    set({ diagnosticsByTab: {}, selectedIndexByTab: {} });
  },

  selectNext: (tabId) => {
    set((state) => {
      const diagnostics = state.diagnosticsByTab[tabId];
      if (!diagnostics || diagnostics.length === 0) return state;
      const current = state.selectedIndexByTab[tabId] ?? 0;
      return {
        selectedIndexByTab: {
          ...state.selectedIndexByTab,
          [tabId]: (current + 1) % diagnostics.length,
        },
      };
    });
  },

  selectPrev: (tabId) => {
    set((state) => {
      const diagnostics = state.diagnosticsByTab[tabId];
      if (!diagnostics || diagnostics.length === 0) return state;
      const current = state.selectedIndexByTab[tabId] ?? 0;
      return {
        selectedIndexByTab: {
          ...state.selectedIndexByTab,
          [tabId]: current <= 0 ? diagnostics.length - 1 : current - 1,
        },
      };
    });
  },
}));

// Clear all diagnostics when lint is disabled in settings
import { useSettingsStore } from "@/stores/settingsStore";
let prevLintEnabled = useSettingsStore.getState().markdown.lintEnabled;
useSettingsStore.subscribe((state) => {
  const enabled = state.markdown.lintEnabled;
  if (prevLintEnabled && !enabled) {
    useLintStore.getState().clearAllDiagnostics();
  }
  prevLintEnabled = enabled;
});
