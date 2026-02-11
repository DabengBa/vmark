import { createRef, type PointerEvent as ReactPointerEvent } from "react";
import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTabDragOut } from "./useTabDragOut";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function withRect(el: HTMLElement, rect: Rect) {
  Object.defineProperty(el, "getBoundingClientRect", {
    value: () => ({
      x: rect.left,
      y: rect.top,
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      toJSON: () => ({}),
    }),
    configurable: true,
  });
}

function createTabBar({
  barTop,
  barHeight,
  tabRects,
}: {
  barTop: number;
  barHeight: number;
  tabRects: Array<Pick<Rect, "left" | "width">>;
}): HTMLElement {
  const bar = document.createElement("div");
  withRect(bar, { top: barTop, left: 0, width: 1000, height: barHeight });

  const tablist = document.createElement("div");
  tablist.setAttribute("role", "tablist");

  tabRects.forEach((rect, index) => {
    const tab = document.createElement("div");
    tab.setAttribute("role", "tab");
    tab.dataset.tabId = `tab-${index + 1}`;
    withRect(tab, { top: barTop, left: rect.left, width: rect.width, height: barHeight });
    tablist.appendChild(tab);
  });

  bar.appendChild(tablist);
  document.body.appendChild(bar);
  return bar;
}

function dispatchPointer(type: string, clientX: number, clientY: number) {
  document.dispatchEvent(
    new MouseEvent(type, { bubbles: true, clientX, clientY })
  );
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useTabDragOut", () => {
  it("reorders when dragged horizontally past lock threshold", () => {
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [
        { left: 0, width: 100 },
        { left: 100, width: 100 },
      ],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown({
        button: 0,
        clientX: 10,
        clientY: 20,
      } as ReactPointerEvent);
      dispatchPointer("pointermove", 220, 20);
      dispatchPointer("pointerup", 220, 20);
    });

    expect(onReorder).toHaveBeenCalledWith("tab-1", 2);
    expect(onDragOut).not.toHaveBeenCalled();
  });

  it("detaches when dragged below the tab bar", () => {
    const bar = createTabBar({
      barTop: 0,
      barHeight: 40,
      tabRects: [{ left: 0, width: 120 }],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown({
        button: 0,
        clientX: 30,
        clientY: 20,
      } as ReactPointerEvent);
      dispatchPointer("pointermove", 30, 100);
      dispatchPointer("pointerup", 30, 100);
    });

    expect(onDragOut).toHaveBeenCalledWith("tab-1");
    expect(onReorder).not.toHaveBeenCalled();
  });

  it("detaches when dragged above the tab bar (bottom-docked tabs)", () => {
    const bar = createTabBar({
      barTop: 760,
      barHeight: 40,
      tabRects: [{ left: 0, width: 120 }],
    });
    const tabBarRef = createRef<HTMLElement>();
    tabBarRef.current = bar;

    const onDragOut = vi.fn();
    const onReorder = vi.fn();
    const { result } = renderHook(() =>
      useTabDragOut({ tabBarRef, onDragOut, onReorder })
    );

    act(() => {
      result.current.getTabDragHandlers("tab-1", false).onPointerDown({
        button: 0,
        clientX: 30,
        clientY: 780,
      } as ReactPointerEvent);
      dispatchPointer("pointermove", 30, 700);
      dispatchPointer("pointerup", 30, 700);
    });

    expect(onDragOut).toHaveBeenCalledWith("tab-1");
    expect(onReorder).not.toHaveBeenCalled();
  });
});
