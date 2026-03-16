/**
 * Image Context Menu Store
 *
 * Purpose: State for the image right-click context menu — position, source
 *   URL, and node position for actions like copy/save/resize.
 *
 * @module stores/imageContextMenuStore
 */

import { create } from "zustand";

interface ImageContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  imageSrc: string;
  imageNodePos: number;
}

interface ImageContextMenuActions {
  openMenu: (data: {
    position: { x: number; y: number };
    imageSrc: string;
    imageNodePos: number;
  }) => void;
  closeMenu: () => void;
}

type ImageContextMenuStore = ImageContextMenuState & ImageContextMenuActions;

const initialState: ImageContextMenuState = {
  isOpen: false,
  position: null,
  imageSrc: "",
  imageNodePos: -1,
};

/** Manages image right-click context menu state — position, source URL, and node position. Use selectors, not destructuring. */
export const useImageContextMenuStore = create<ImageContextMenuStore>(
  (set) => ({
    ...initialState,

    openMenu: (data) =>
      set({
        isOpen: true,
        position: data.position,
        imageSrc: data.imageSrc,
        imageNodePos: data.imageNodePos,
      }),

    closeMenu: () => set(initialState),
  })
);
