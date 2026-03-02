import { describe, it, expect } from "vitest";
import { computeTerminalPosition, pixelsToRatio, getAvailableDimension } from "../useTerminalPosition";
import type { EffectiveTerminalPosition } from "@/stores/uiStore";

describe("computeTerminalPosition", () => {
  it.each([
    // Definite landscape (ratio >= 1.5) → always right
    { w: 1920, h: 1080, current: "bottom" as const, expected: "right" },
    { w: 1920, h: 1080, current: "right" as const, expected: "right" },
    { w: 2560, h: 1440, current: "bottom" as const, expected: "right" },

    // Definite portrait (ratio <= 0.85) → always bottom
    { w: 1080, h: 1920, current: "right" as const, expected: "bottom" },
    { w: 1080, h: 1920, current: "bottom" as const, expected: "bottom" },
    { w: 800, h: 1200, current: "bottom" as const, expected: "bottom" },

    // Ambiguous zone (0.85 < ratio < 1.5): use width tiebreaker with hysteresis
    // Threshold = 1440 (base). If current=bottom, threshold stays 1440. If current=right, threshold shifts down by 50 to 1390.

    // current=bottom, w >= 1440 → right
    { w: 1500, h: 1200, current: "bottom" as const, expected: "right" },
    { w: 1440, h: 1200, current: "bottom" as const, expected: "right" },

    // current=bottom, w < 1440 → bottom (stays)
    { w: 1400, h: 1200, current: "bottom" as const, expected: "bottom" },
    { w: 1200, h: 1000, current: "bottom" as const, expected: "bottom" },

    // current=right, w >= 1390 → right (hysteresis keeps it)
    { w: 1400, h: 1200, current: "right" as const, expected: "right" },
    { w: 1390, h: 1200, current: "right" as const, expected: "right" },

    // current=right, w < 1390 → bottom (hysteresis threshold crossed)
    { w: 1380, h: 1200, current: "right" as const, expected: "bottom" },
    { w: 1100, h: 1000, current: "right" as const, expected: "bottom" },

    // Edge: ratio exactly at boundary
    { w: 1500, h: 1000, current: "bottom" as const, expected: "right" }, // ratio 1.5 → landscape
    { w: 850, h: 1000, current: "right" as const, expected: "bottom" }, // ratio 0.85 → portrait

    // Edge: zero, negative, NaN, Infinity → return currentPosition unchanged
    { w: 0, h: 1080, current: "bottom" as const, expected: "bottom" },
    { w: 0, h: 1080, current: "right" as const, expected: "right" },
    { w: 1920, h: 0, current: "bottom" as const, expected: "bottom" },
    { w: 1920, h: 0, current: "right" as const, expected: "right" },
    { w: -100, h: 1080, current: "bottom" as const, expected: "bottom" },
    { w: 1920, h: -100, current: "right" as const, expected: "right" },
    { w: NaN, h: 1080, current: "bottom" as const, expected: "bottom" },
    { w: 1920, h: NaN, current: "right" as const, expected: "right" },
    { w: Infinity, h: 1080, current: "bottom" as const, expected: "bottom" },
  ])(
    "w=$w h=$h current=$current → $expected",
    ({ w, h, current, expected }: { w: number; h: number; current: EffectiveTerminalPosition; expected: string }) => {
      expect(computeTerminalPosition(w, h, current)).toBe(expected);
    }
  );
});

describe("pixelsToRatio", () => {
  it("computes ratio from pixel / available", () => {
    expect(pixelsToRatio(400, 1000)).toBeCloseTo(0.4);
    expect(pixelsToRatio(250, 1000)).toBeCloseTo(0.25);
  });

  it("clamps to 0.1 minimum", () => {
    expect(pixelsToRatio(10, 1000)).toBe(0.1);
    expect(pixelsToRatio(0, 1000)).toBe(0.1);
  });

  it("clamps to 0.8 maximum", () => {
    expect(pixelsToRatio(900, 1000)).toBe(0.8);
    expect(pixelsToRatio(1000, 1000)).toBe(0.8);
  });

  it("returns 0.4 when available dimension is 0", () => {
    expect(pixelsToRatio(400, 0)).toBe(0.4);
    expect(pixelsToRatio(400, -100)).toBe(0.4);
  });
});

describe("getAvailableDimension", () => {
  // Layout constants from the source: TITLEBAR_HEIGHT = 40, STATUSBAR_HEIGHT = 40
  const TITLEBAR_HEIGHT = 40;
  const STATUSBAR_HEIGHT = 40;

  it("returns windowHeight minus titlebar and statusbar for bottom position", () => {
    const result = getAvailableDimension("bottom", 1920, 1080, false, 260);
    expect(result).toBe(1080 - TITLEBAR_HEIGHT - STATUSBAR_HEIGHT);
  });

  it("bottom position ignores sidebar settings", () => {
    const withSidebar = getAvailableDimension("bottom", 1920, 1080, true, 260);
    const withoutSidebar = getAvailableDimension("bottom", 1920, 1080, false, 260);
    expect(withSidebar).toBe(withoutSidebar);
  });

  it("returns windowWidth minus sidebar for right position when sidebar visible", () => {
    const result = getAvailableDimension("right", 1920, 1080, true, 260);
    expect(result).toBe(1920 - 260);
  });

  it("returns full windowWidth for right position when sidebar hidden", () => {
    const result = getAvailableDimension("right", 1920, 1080, false, 260);
    expect(result).toBe(1920);
  });

  it("handles zero sidebar width when visible", () => {
    const result = getAvailableDimension("right", 1920, 1080, true, 0);
    expect(result).toBe(1920);
  });

  it("handles small window dimensions", () => {
    const result = getAvailableDimension("bottom", 800, 200, false, 0);
    expect(result).toBe(200 - TITLEBAR_HEIGHT - STATUSBAR_HEIGHT);
  });

  it("handles negative sidebar width gracefully", () => {
    const result = getAvailableDimension("right", 1920, 1080, true, -100);
    // sidebarW = -100, so offset = -100, result = 1920 - (-100) = 2020
    expect(result).toBe(2020);
  });

  it("returns correct dimension when sidebar takes most of the width", () => {
    const result = getAvailableDimension("right", 1920, 1080, true, 1800);
    expect(result).toBe(1920 - 1800);
  });
});

describe("pixelsToRatio — edge cases", () => {
  it("handles NaN available dimension (returns NaN since guard only checks <= 0)", () => {
    expect(pixelsToRatio(400, NaN)).toBeNaN();
  });

  it("handles exact boundary values", () => {
    // 100/1000 = 0.1 (minimum)
    expect(pixelsToRatio(100, 1000)).toBeCloseTo(0.1);
    // 800/1000 = 0.8 (maximum)
    expect(pixelsToRatio(800, 1000)).toBeCloseTo(0.8);
  });
});

describe("pixelsToRatio — additional precision", () => {
  it("handles very large pixel values", () => {
    expect(pixelsToRatio(10000, 1000)).toBe(0.8);
  });

  it("handles negative pixel values (clamped to 0.1)", () => {
    expect(pixelsToRatio(-100, 1000)).toBe(0.1);
  });

  it("returns exact mid-range ratio", () => {
    expect(pixelsToRatio(500, 1000)).toBeCloseTo(0.5);
  });
});

describe("getAvailableDimension — additional edge cases", () => {
  it("handles very large sidebar width (exceeds window)", () => {
    const result = getAvailableDimension("right", 1000, 800, true, 1500);
    expect(result).toBe(1000 - 1500); // -500
  });

  it("handles zero window dimensions for bottom", () => {
    const result = getAvailableDimension("bottom", 0, 0, false, 0);
    expect(result).toBe(0 - 40 - 40); // negative
  });
});

describe("computeTerminalPosition — additional edge cases", () => {
  it("handles very small window (1x1)", () => {
    // ratio = 1.0, in ambiguous zone. w=1 < threshold (1440 or 1390) → bottom
    expect(computeTerminalPosition(1, 1, "bottom")).toBe("bottom");
    expect(computeTerminalPosition(1, 1, "right")).toBe("bottom");
  });

  it("handles square window (ratio exactly 1.0)", () => {
    // ratio = 1.0, in ambiguous zone. w=1000 < 1440, so bottom
    expect(computeTerminalPosition(1000, 1000, "bottom")).toBe("bottom");
  });

  it("handles very wide window", () => {
    expect(computeTerminalPosition(3840, 1080, "bottom")).toBe("right");
  });

  it("handles very tall window", () => {
    expect(computeTerminalPosition(800, 2000, "right")).toBe("bottom");
  });
});
