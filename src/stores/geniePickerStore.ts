/**
 * Genie Picker Store
 *
 * Purpose: State for the AI genie picker overlay — open/close, scope filter,
 *   mode state machine (search → freeform → processing → preview/error),
 *   and streaming response accumulation.
 *
 * Mode transitions:
 *   openPicker  → "search"
 *   setMode     → any mode directly
 *   startProcessing → "processing" (clears response/error, stores prompt)
 *   setPreview  → "preview" (sets full response text)
 *   setPickerError → "error" (sets error message)
 *   appendResponse → accumulates streaming chunks (no mode change)
 *   resetToInput → "search" (clears prompt/response/error)
 *   closePicker → full reset to initial state
 *
 * @module stores/geniePickerStore
 */

import { create } from "zustand";
import type { GenieScope } from "@/types/aiGenies";

/** State machine mode for the AI genie picker: search, freeform input, processing, preview, or error. */
export type PickerMode =
  | "search"
  | "freeform"
  | "processing"
  | "preview"
  | "error";

interface GeniePickerState {
  isOpen: boolean;
  filterScope: GenieScope | null;
  mode: PickerMode;
  submittedPrompt: string | null;
  responseText: string;
  pickerError: string | null;
}

interface GeniePickerActions {
  openPicker(options?: { filterScope?: GenieScope }): void;
  closePicker(): void;
  setMode(mode: PickerMode): void;
  startProcessing(prompt: string): void;
  appendResponse(chunk: string): void;
  setPreview(fullText: string): void;
  setPickerError(message: string): void;
  resetToInput(): void;
}

const initialState: GeniePickerState = {
  isOpen: false,
  filterScope: null,
  mode: "search",
  submittedPrompt: null,
  responseText: "",
  pickerError: null,
};

/** Manages AI genie picker overlay state — mode transitions, scope filter, and streaming response. Use selectors, not destructuring. */
export const useGeniePickerStore = create<
  GeniePickerState & GeniePickerActions
>((set) => ({
  ...initialState,

  openPicker: (options) =>
    set({
      ...initialState,
      isOpen: true,
      filterScope: options?.filterScope ?? null,
    }),

  closePicker: () => set(initialState),

  setMode: (mode) => set({ mode }),

  startProcessing: (prompt) =>
    set({
      mode: "processing",
      submittedPrompt: prompt,
      responseText: "",
      pickerError: null,
    }),

  appendResponse: (chunk) =>
    set((state) => ({ responseText: state.responseText + chunk })),

  setPreview: (fullText) =>
    set({ mode: "preview", responseText: fullText }),

  setPickerError: (message) =>
    set({ mode: "error", pickerError: message }),

  resetToInput: () =>
    set({
      mode: "search",
      submittedPrompt: null,
      responseText: "",
      pickerError: null,
    }),
}));
