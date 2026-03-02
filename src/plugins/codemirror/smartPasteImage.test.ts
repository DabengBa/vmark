/**
 * Tests for Smart Paste Image Handling
 *
 * Tests the tryImagePaste function that detects image paths in pasted text
 * and delegates to the toast for confirmation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockParseMultiplePaths = vi.fn(() => ({
  paths: [],
  format: "single" as const,
}));
const mockDetectMultipleImagePaths = vi.fn(() => ({
  allImages: false,
  imageCount: 0,
  results: [],
}));
const mockShowToast = vi.fn();
const mockShowMultiToast = vi.fn();
const mockFindWordAtCursorSource = vi.fn(() => null);

vi.mock("@/utils/multiImageParsing", () => ({
  parseMultiplePaths: (...args: unknown[]) => mockParseMultiplePaths(...args),
}));

vi.mock("@/utils/imagePathDetection", () => ({
  detectMultipleImagePaths: (...args: unknown[]) =>
    mockDetectMultipleImagePaths(...args),
}));

vi.mock("@/stores/imagePasteToastStore", () => ({
  useImagePasteToastStore: {
    getState: () => ({
      showToast: mockShowToast,
      showMultiToast: mockShowMultiToast,
    }),
  },
}));

vi.mock("@/plugins/toolbarActions/sourceAdapterLinks", () => ({
  findWordAtCursorSource: (...args: unknown[]) =>
    mockFindWordAtCursorSource(...args),
}));

vi.mock("@/hooks/useImageOperations", () => ({
  copyImageToAssets: vi.fn(() => Promise.resolve("assets/image.png")),
}));

vi.mock("@/utils/debug", () => ({
  smartPasteWarn: vi.fn(),
}));

vi.mock("@/utils/markdownUrl", () => ({
  encodeMarkdownUrl: (url: string) => url,
}));

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tryImagePaste } from "./smartPasteImage";

const createdViews: EditorView[] = [];

afterEach(() => {
  createdViews.forEach((v) => v.destroy());
  createdViews.length = 0;
});

function createView(
  content: string,
  anchor: number,
  head?: number
): EditorView {
  const state = EditorState.create({
    doc: content,
    selection: { anchor, head: head ?? anchor },
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = new EditorView({ state, parent: container });
  createdViews.push(view);
  return view;
}

describe("tryImagePaste", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false for empty text", () => {
    const view = createView("hello", 0);
    expect(tryImagePaste(view, "")).toBe(false);
  });

  it("returns false when parseMultiplePaths returns empty paths", () => {
    mockParseMultiplePaths.mockReturnValue({ paths: [], format: "single" });

    const view = createView("hello", 0);
    expect(tryImagePaste(view, "some text")).toBe(false);
  });

  it("returns false when paths are not all images", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["/path/to/file.txt"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: false,
      imageCount: 0,
      results: [],
    });

    const view = createView("hello", 0);
    expect(tryImagePaste(view, "/path/to/file.txt")).toBe(false);
  });

  it("returns true and shows toast for single image URL", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["https://example.com/image.png"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 1,
      results: [
        {
          isImage: true,
          type: "url",
          path: "https://example.com/image.png",
          needsCopy: false,
        },
      ],
    });

    const view = createView("hello", 0);
    const result = tryImagePaste(view, "https://example.com/image.png");

    expect(result).toBe(true);
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        imagePath: "https://example.com/image.png",
        imageType: "url",
      })
    );
  });

  it("returns true and shows toast for single data URL", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["data:image/png;base64,abc"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 1,
      results: [
        {
          isImage: true,
          type: "dataUrl",
          path: "data:image/png;base64,abc",
          needsCopy: false,
        },
      ],
    });

    const view = createView("hello", 0);
    const result = tryImagePaste(view, "data:image/png;base64,abc");

    expect(result).toBe(true);
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.objectContaining({
        imageType: "url",
      })
    );
  });

  it("returns true for local path (async validation)", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["/Users/test/image.png"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 1,
      results: [
        {
          isImage: true,
          type: "absolutePath",
          path: "/Users/test/image.png",
          needsCopy: true,
        },
      ],
    });

    const view = createView("hello", 0);
    const result = tryImagePaste(view, "/Users/test/image.png");

    expect(result).toBe(true);
    // Toast is shown asynchronously after validation
  });

  it("uses selected text as alt text when there is a selection", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["https://example.com/photo.jpg"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 1,
      results: [
        {
          isImage: true,
          type: "url",
          path: "https://example.com/photo.jpg",
          needsCopy: false,
        },
      ],
    });

    const view = createView("my photo here", 3, 8);
    tryImagePaste(view, "https://example.com/photo.jpg");

    expect(mockShowToast).toHaveBeenCalled();
  });

  it("uses word at cursor as alt text when no selection", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["https://example.com/photo.jpg"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 1,
      results: [
        {
          isImage: true,
          type: "url",
          path: "https://example.com/photo.jpg",
          needsCopy: false,
        },
      ],
    });
    mockFindWordAtCursorSource.mockReturnValue({ from: 0, to: 5 });

    const view = createView("hello world", 3);
    tryImagePaste(view, "https://example.com/photo.jpg");

    expect(mockFindWordAtCursorSource).toHaveBeenCalled();
  });

  it("returns true for multiple image paths and shows multi toast", () => {
    const paths = ["/path/image1.png", "/path/image2.jpg"];
    mockParseMultiplePaths.mockReturnValue({ paths, format: "newline" });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 2,
      results: [
        {
          isImage: true,
          type: "absolutePath",
          path: "/path/image1.png",
          needsCopy: true,
        },
        {
          isImage: true,
          type: "absolutePath",
          path: "/path/image2.jpg",
          needsCopy: true,
        },
      ],
    });

    const view = createView("hello", 0);
    const result = tryImagePaste(
      view,
      "/path/image1.png\n/path/image2.jpg"
    );

    expect(result).toBe(true);
    // Multi-image paste uses async validation, so toast shown later
  });

  it("handles home path detection type for local paths", () => {
    mockParseMultiplePaths.mockReturnValue({
      paths: ["~/Pictures/photo.png"],
      format: "single",
    });
    mockDetectMultipleImagePaths.mockReturnValue({
      allImages: true,
      imageCount: 1,
      results: [
        {
          isImage: true,
          type: "homePath",
          path: "~/Pictures/photo.png",
          needsCopy: true,
        },
      ],
    });

    const view = createView("hello", 0);
    const result = tryImagePaste(view, "~/Pictures/photo.png");

    expect(result).toBe(true);
  });

  describe("edge cases", () => {
    it("returns false for whitespace-only text", () => {
      mockParseMultiplePaths.mockReturnValue({ paths: [], format: "single" });

      const view = createView("hello", 0);
      expect(tryImagePaste(view, "   ")).toBe(false);
    });

    it("returns false for non-image file extension paths", () => {
      mockParseMultiplePaths.mockReturnValue({
        paths: ["/path/to/file.txt"],
        format: "single",
      });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: false,
        imageCount: 0,
        results: [],
      });

      const view = createView("hello", 0);
      expect(tryImagePaste(view, "/path/to/file.txt")).toBe(false);
    });

    it("handles image URL with special characters", () => {
      const url = "https://example.com/image%20with%20spaces.png";
      mockParseMultiplePaths.mockReturnValue({
        paths: [url],
        format: "single",
      });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: true,
        imageCount: 1,
        results: [
          { isImage: true, type: "url", path: url, needsCopy: false },
        ],
      });

      const view = createView("hello", 0);
      const result = tryImagePaste(view, url);

      expect(result).toBe(true);
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          imagePath: url,
          imageType: "url",
        })
      );
    });

    it("handles image URL with unicode characters", () => {
      const url = "https://example.com/图片.png";
      mockParseMultiplePaths.mockReturnValue({
        paths: [url],
        format: "single",
      });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: true,
        imageCount: 1,
        results: [
          { isImage: true, type: "url", path: url, needsCopy: false },
        ],
      });

      const view = createView("hello", 0);
      const result = tryImagePaste(view, url);

      expect(result).toBe(true);
    });

    it("handles pasting into empty document", () => {
      mockParseMultiplePaths.mockReturnValue({
        paths: ["https://example.com/img.png"],
        format: "single",
      });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: true,
        imageCount: 1,
        results: [
          {
            isImage: true,
            type: "url",
            path: "https://example.com/img.png",
            needsCopy: false,
          },
        ],
      });

      const view = createView("", 0);
      const result = tryImagePaste(view, "https://example.com/img.png");

      expect(result).toBe(true);
      expect(mockShowToast).toHaveBeenCalled();
    });

    it("handles pasting at document boundary (end)", () => {
      mockParseMultiplePaths.mockReturnValue({
        paths: ["https://example.com/img.png"],
        format: "single",
      });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: true,
        imageCount: 1,
        results: [
          {
            isImage: true,
            type: "url",
            path: "https://example.com/img.png",
            needsCopy: false,
          },
        ],
      });

      const view = createView("hello world", 11);
      const result = tryImagePaste(view, "https://example.com/img.png");

      expect(result).toBe(true);
    });

    it("uses selection as alt text when available", () => {
      mockParseMultiplePaths.mockReturnValue({
        paths: ["https://example.com/photo.jpg"],
        format: "single",
      });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: true,
        imageCount: 1,
        results: [
          {
            isImage: true,
            type: "url",
            path: "https://example.com/photo.jpg",
            needsCopy: false,
          },
        ],
      });

      const view = createView("my photo here", 3, 8);
      tryImagePaste(view, "https://example.com/photo.jpg");

      // The toast should be called with the selected text range for alt text
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          imagePath: "https://example.com/photo.jpg",
        })
      );
    });

    it("finds word at cursor for alt text when no selection", () => {
      mockParseMultiplePaths.mockReturnValue({
        paths: ["https://example.com/photo.jpg"],
        format: "single",
      });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: true,
        imageCount: 1,
        results: [
          {
            isImage: true,
            type: "url",
            path: "https://example.com/photo.jpg",
            needsCopy: false,
          },
        ],
      });
      mockFindWordAtCursorSource.mockReturnValue({ from: 0, to: 5 });

      const view = createView("hello world", 3);
      tryImagePaste(view, "https://example.com/photo.jpg");

      expect(mockFindWordAtCursorSource).toHaveBeenCalledWith(view, 3);
    });

    it("uses empty alt text when no word found at cursor", () => {
      mockParseMultiplePaths.mockReturnValue({
        paths: ["https://example.com/photo.jpg"],
        format: "single",
      });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: true,
        imageCount: 1,
        results: [
          {
            isImage: true,
            type: "url",
            path: "https://example.com/photo.jpg",
            needsCopy: false,
          },
        ],
      });
      mockFindWordAtCursorSource.mockReturnValue(null);

      const view = createView("hello world", 5);
      tryImagePaste(view, "https://example.com/photo.jpg");

      // Should still show toast with empty alt text
      expect(mockShowToast).toHaveBeenCalled();
    });

    it("handles relative path image", () => {
      mockParseMultiplePaths.mockReturnValue({
        paths: ["./assets/image.png"],
        format: "single",
      });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: true,
        imageCount: 1,
        results: [
          {
            isImage: true,
            type: "relativePath",
            path: "./assets/image.png",
            needsCopy: false,
          },
        ],
      });

      const view = createView("hello", 0);
      const result = tryImagePaste(view, "./assets/image.png");

      // Relative paths go through async validation
      expect(result).toBe(true);
    });

    it("handles multiple images with mix of URLs and local paths", () => {
      const paths = ["https://example.com/img1.png", "/local/img2.jpg"];
      mockParseMultiplePaths.mockReturnValue({ paths, format: "newline" });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: true,
        imageCount: 2,
        results: [
          {
            isImage: true,
            type: "url",
            path: "https://example.com/img1.png",
            needsCopy: false,
          },
          {
            isImage: true,
            type: "absolutePath",
            path: "/local/img2.jpg",
            needsCopy: true,
          },
        ],
      });

      const view = createView("hello", 0);
      const result = tryImagePaste(
        view,
        "https://example.com/img1.png\n/local/img2.jpg"
      );

      expect(result).toBe(true);
    });

    it("handles three or more images", () => {
      const paths = ["/a.png", "/b.png", "/c.png"];
      mockParseMultiplePaths.mockReturnValue({ paths, format: "newline" });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: true,
        imageCount: 3,
        results: paths.map((p) => ({
          isImage: true,
          type: "absolutePath" as const,
          path: p,
          needsCopy: true,
        })),
      });

      const view = createView("hello", 0);
      const result = tryImagePaste(view, paths.join("\n"));

      expect(result).toBe(true);
    });

    it("handles data URI images", () => {
      const dataUri = "data:image/png;base64,iVBORw0KGgo=";
      mockParseMultiplePaths.mockReturnValue({
        paths: [dataUri],
        format: "single",
      });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: true,
        imageCount: 1,
        results: [
          {
            isImage: true,
            type: "dataUrl",
            path: dataUri,
            needsCopy: false,
          },
        ],
      });

      const view = createView("test", 0);
      const result = tryImagePaste(view, dataUri);

      expect(result).toBe(true);
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          imageType: "url",
        })
      );
    });

    it("returns false when one path among multiple is not an image", () => {
      const paths = ["/a.png", "/b.txt"];
      mockParseMultiplePaths.mockReturnValue({ paths, format: "newline" });
      mockDetectMultipleImagePaths.mockReturnValue({
        allImages: false,
        imageCount: 1,
        results: [
          {
            isImage: true,
            type: "absolutePath",
            path: "/a.png",
            needsCopy: true,
          },
          {
            isImage: false,
            type: "absolutePath",
            path: "/b.txt",
            needsCopy: false,
          },
        ],
      });

      const view = createView("hello", 0);
      const result = tryImagePaste(view, "/a.png\n/b.txt");

      expect(result).toBe(false);
    });
  });
});
