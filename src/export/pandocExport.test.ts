import { describe, it, expect, vi, beforeEach } from "vitest";

// Use vi.hoisted() so mock variables are available before vi.mock() factories run
const { mockInvoke, mockSave, mockToast } = vi.hoisted(() => ({
  mockInvoke: vi.fn(),
  mockSave: vi.fn(),
  mockToast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({
  save: (...args: unknown[]) => mockSave(...args),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

vi.mock("@/utils/pathUtils", () => ({
  joinPath: (...parts: string[]) => parts.join("/"),
}));

import { exportViaPandoc } from "./pandocExport";

describe("exportViaPandoc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error toast when content is empty", async () => {
    const result = await exportViaPandoc({ markdown: "   " });
    expect(result).toBe(false);
    expect(mockToast.error).toHaveBeenCalledWith("No content to export!");
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it("shows error toast when Pandoc is not installed", async () => {
    mockInvoke.mockResolvedValueOnce({
      available: false,
      path: null,
      version: null,
    });

    const result = await exportViaPandoc({ markdown: "# Hello" });
    expect(result).toBe(false);
    expect(mockInvoke).toHaveBeenCalledWith("detect_pandoc");
    expect(mockToast.error).toHaveBeenCalledWith(
      "Pandoc is not installed. Install it from pandoc.org",
      { duration: 5000 }
    );
  });

  it("returns false when user cancels save dialog", async () => {
    mockInvoke.mockResolvedValueOnce({
      available: true,
      path: "/usr/local/bin/pandoc",
      version: "3.1.2",
    });
    mockSave.mockResolvedValueOnce(null);

    const result = await exportViaPandoc({ markdown: "# Hello" });
    expect(result).toBe(false);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Export via Pandoc",
        filters: expect.arrayContaining([
          expect.objectContaining({ name: "Word Document", extensions: ["docx"] }),
        ]),
      })
    );
  });

  it("exports successfully via Pandoc", async () => {
    mockInvoke
      .mockResolvedValueOnce({
        available: true,
        path: "/usr/local/bin/pandoc",
        version: "3.1.2",
      })
      .mockResolvedValueOnce(undefined); // export_via_pandoc succeeds
    mockSave.mockResolvedValueOnce("/tmp/output.docx");

    const result = await exportViaPandoc({ markdown: "# Hello World" });
    expect(result).toBe(true);
    expect(mockInvoke).toHaveBeenCalledWith("export_via_pandoc", {
      markdown: "# Hello World",
      outputPath: "/tmp/output.docx",
      sourceDir: null,
    });
    expect(mockToast.success).toHaveBeenCalledWith("Exported successfully");
  });

  it("shows error toast when Pandoc command fails", async () => {
    mockInvoke
      .mockResolvedValueOnce({
        available: true,
        path: "/usr/local/bin/pandoc",
        version: "3.1.2",
      })
      .mockRejectedValueOnce("Unknown output format");
    mockSave.mockResolvedValueOnce("/tmp/output.xyz");

    const result = await exportViaPandoc({ markdown: "# Hello" });
    expect(result).toBe(false);
    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringContaining("Pandoc export failed")
    );
  });

  it("shows error toast when detection invoke rejects", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("IPC error"));

    const result = await exportViaPandoc({ markdown: "# Hello" });
    expect(result).toBe(false);
    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringContaining("Pandoc export failed")
    );
  });

  it("passes sourceDirectory to Rust backend", async () => {
    mockInvoke
      .mockResolvedValueOnce({
        available: true,
        path: "/usr/local/bin/pandoc",
        version: "3.1.2",
      })
      .mockResolvedValueOnce(undefined);
    mockSave.mockResolvedValueOnce("/tmp/output.epub");

    await exportViaPandoc({
      markdown: "content",
      sourceDirectory: "/Users/test/docs",
    });

    expect(mockInvoke).toHaveBeenCalledWith("export_via_pandoc", {
      markdown: "content",
      outputPath: "/tmp/output.epub",
      sourceDir: "/Users/test/docs",
    });
  });

  it("uses defaultName and defaultDirectory for save dialog path", async () => {
    mockInvoke.mockResolvedValueOnce({
      available: true,
      path: "/usr/local/bin/pandoc",
      version: "3.1.2",
    });
    mockSave.mockResolvedValueOnce(null);

    await exportViaPandoc({
      markdown: "content",
      defaultName: "My Doc",
      defaultDirectory: "/Users/test/docs",
    });

    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultPath: "/Users/test/docs/My Doc.docx",
      })
    );
  });
});
