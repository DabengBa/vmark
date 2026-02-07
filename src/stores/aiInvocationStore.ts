/**
 * AI Invocation Store
 *
 * Singleton concurrency guard for AI genie invocations.
 * Both useGenieShortcuts and GeniePicker share this store
 * to prevent concurrent invocations.
 */

import { create } from "zustand";

interface AiInvocationState {
  isRunning: boolean;
  requestId: string | null;
}

interface AiInvocationActions {
  /** Try to start an invocation. Returns false if already running. */
  tryStart: (requestId: string) => boolean;
  /** Mark invocation as finished. */
  finish: () => void;
  /** Cancel the current invocation and reset state. */
  cancel: () => void;
}

const initialState: AiInvocationState = {
  isRunning: false,
  requestId: null,
};

export const useAiInvocationStore = create<AiInvocationState & AiInvocationActions>(
  (set, get) => ({
    ...initialState,

    tryStart: (requestId) => {
      if (get().isRunning) return false;
      set({ isRunning: true, requestId });
      return true;
    },

    finish: () => {
      set(initialState);
    },

    cancel: () => {
      set(initialState);
    },
  })
);
