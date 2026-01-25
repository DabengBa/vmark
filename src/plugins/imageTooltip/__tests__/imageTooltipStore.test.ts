/**
 * Image Tooltip Store Tests
 *
 * Tests for the image tooltip state management.
 */

import { describe, expect, it, beforeEach } from "vitest";
import { useImageTooltipStore } from "@/stores/imageTooltipStore";

describe("imageTooltipStore", () => {
  beforeEach(() => {
    useImageTooltipStore.getState().hideTooltip();
  });

  describe("initial state", () => {
    it("starts closed", () => {
      const { isOpen } = useImageTooltipStore.getState();
      expect(isOpen).toBe(false);
    });

    it("starts with empty data", () => {
      const { imageSrc, filename, dimensions, anchorRect } = useImageTooltipStore.getState();
      expect(imageSrc).toBe("");
      expect(filename).toBe("");
      expect(dimensions).toBeNull();
      expect(anchorRect).toBeNull();
    });
  });

  describe("showTooltip", () => {
    it("opens tooltip with provided data", () => {
      const anchorRect = { top: 100, left: 50, bottom: 120, right: 200 };
      const dimensions = { width: 800, height: 600 };

      useImageTooltipStore.getState().showTooltip({
        imageSrc: "/images/photo.jpg",
        filename: "photo.jpg",
        dimensions,
        anchorRect,
      });

      const state = useImageTooltipStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.imageSrc).toBe("/images/photo.jpg");
      expect(state.filename).toBe("photo.jpg");
      expect(state.dimensions).toEqual(dimensions);
      expect(state.anchorRect).toEqual(anchorRect);
    });

    it("accepts null dimensions", () => {
      const anchorRect = { top: 100, left: 50, bottom: 120, right: 200 };

      useImageTooltipStore.getState().showTooltip({
        imageSrc: "data:image/png;base64,abc",
        filename: "Embedded image",
        dimensions: null,
        anchorRect,
      });

      const state = useImageTooltipStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.dimensions).toBeNull();
    });
  });

  describe("hideTooltip", () => {
    it("closes tooltip and resets state", () => {
      // First show tooltip
      useImageTooltipStore.getState().showTooltip({
        imageSrc: "/images/photo.jpg",
        filename: "photo.jpg",
        dimensions: { width: 100, height: 100 },
        anchorRect: { top: 0, left: 0, bottom: 10, right: 10 },
      });

      expect(useImageTooltipStore.getState().isOpen).toBe(true);

      // Then hide
      useImageTooltipStore.getState().hideTooltip();

      const state = useImageTooltipStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.imageSrc).toBe("");
      expect(state.filename).toBe("");
      expect(state.dimensions).toBeNull();
      expect(state.anchorRect).toBeNull();
    });
  });
});
