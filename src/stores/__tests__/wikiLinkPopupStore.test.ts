import { useWikiLinkPopupStore } from "../wikiLinkPopupStore";
import type { AnchorRect } from "@/utils/popupPosition";

const mockRect: AnchorRect = {
  top: 100,
  left: 200,
  bottom: 120,
  right: 300,
};

beforeEach(() => {
  useWikiLinkPopupStore.getState().closePopup();
});

describe("wikiLinkPopupStore", () => {
  it("initializes with popup closed", () => {
    const state = useWikiLinkPopupStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.anchorRect).toBeNull();
    expect(state.target).toBe("");
    expect(state.nodePos).toBeNull();
  });

  it("openPopup sets all fields", () => {
    useWikiLinkPopupStore.getState().openPopup(mockRect, "MyPage", 42);
    const state = useWikiLinkPopupStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.anchorRect).toBe(mockRect);
    expect(state.target).toBe("MyPage");
    expect(state.nodePos).toBe(42);
  });

  it("closePopup resets to initial state", () => {
    useWikiLinkPopupStore.getState().openPopup(mockRect, "SomePage", 10);
    useWikiLinkPopupStore.getState().closePopup();
    const state = useWikiLinkPopupStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.anchorRect).toBeNull();
    expect(state.target).toBe("");
    expect(state.nodePos).toBeNull();
  });

  it("updateTarget changes only the target field", () => {
    useWikiLinkPopupStore.getState().openPopup(mockRect, "OldTarget", 5);
    useWikiLinkPopupStore.getState().updateTarget("NewTarget");
    const state = useWikiLinkPopupStore.getState();
    expect(state.target).toBe("NewTarget");
    // Other fields remain unchanged
    expect(state.isOpen).toBe(true);
    expect(state.anchorRect).toBe(mockRect);
    expect(state.nodePos).toBe(5);
  });

  it("updateTarget works with empty string", () => {
    useWikiLinkPopupStore.getState().openPopup(mockRect, "HasTarget", 1);
    useWikiLinkPopupStore.getState().updateTarget("");
    expect(useWikiLinkPopupStore.getState().target).toBe("");
  });

  it("openPopup overwrites previous state", () => {
    useWikiLinkPopupStore.getState().openPopup(mockRect, "First", 1);
    const newRect: AnchorRect = { top: 50, left: 60, bottom: 70, right: 80 };
    useWikiLinkPopupStore.getState().openPopup(newRect, "Second", 99);
    const state = useWikiLinkPopupStore.getState();
    expect(state.target).toBe("Second");
    expect(state.nodePos).toBe(99);
    expect(state.anchorRect).toBe(newRect);
  });

  it("updateTarget with special characters", () => {
    useWikiLinkPopupStore.getState().openPopup(mockRect, "", 0);
    useWikiLinkPopupStore.getState().updateTarget("Page/Sub Page#Heading");
    expect(useWikiLinkPopupStore.getState().target).toBe("Page/Sub Page#Heading");
  });

  it("updateTarget with CJK characters", () => {
    useWikiLinkPopupStore.getState().openPopup(mockRect, "", 0);
    useWikiLinkPopupStore.getState().updateTarget("\u7B14\u8BB0\u9875\u9762");
    expect(useWikiLinkPopupStore.getState().target).toBe("\u7B14\u8BB0\u9875\u9762");
  });
});
