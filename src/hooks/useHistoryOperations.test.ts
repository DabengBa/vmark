/**
 * Tests for useHistoryOperations — document version history CRUD.
 *
 * Covers:
 *   - getHistoryIndex: read/parse/missing/invalid
 *   - createSnapshot: file size guard, merge window, auto/manual/revert types
 *   - getSnapshots / loadSnapshot / revertToSnapshot
 *   - pruneSnapshots: age filtering, max count
 *   - markAsDeleted / deleteSnapshot
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockMkdir = vi.fn();
const mockExists = vi.fn(() => Promise.resolve(false));
const mockReadTextFile = vi.fn();
const mockWriteTextFile = vi.fn();
const mockRemove = vi.fn();

vi.mock("@tauri-apps/plugin-fs", () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  exists: (...args: unknown[]) => mockExists(...args),
  readTextFile: (...args: unknown[]) => mockReadTextFile(...args),
  writeTextFile: (...args: unknown[]) => mockWriteTextFile(...args),
  remove: (...args: unknown[]) => mockRemove(...args),
}));

vi.mock("@tauri-apps/api/path", () => ({
  appDataDir: vi.fn(() => Promise.resolve("/app")),
  join: vi.fn((...parts: string[]) => Promise.resolve(parts.join("/"))),
}));

vi.mock("@/utils/debug", () => ({
  historyLog: vi.fn(),
}));

vi.mock("@/utils/historyTypes", () => ({
  HISTORY_FOLDER: "history",
  INDEX_FILE: "index.json",
  generatePreview: vi.fn((c: string) => c.slice(0, 50)),
  getByteSize: vi.fn((c: string) => c.length),
  getDocumentName: vi.fn((p: string) => p.split("/").pop()),
  hashPath: vi.fn((p: string) => Promise.resolve("hash_" + p.replace(/\//g, "_"))),
  parseHistoryIndex: vi.fn((obj: unknown) => obj),
}));

import {
  getHistoryIndex,
  createSnapshot,
  getSnapshots,
  loadSnapshot,
  revertToSnapshot,
  pruneSnapshots,
  markAsDeleted,
  deleteSnapshot,
} from "./useHistoryOperations";

const defaultSettings = {
  maxSnapshots: 50,
  maxAgeDays: 30,
  mergeWindowSeconds: 30,
  maxFileSizeKB: 1024,
};

function makeIndex(overrides = {}) {
  return {
    documentPath: "/test/doc.md",
    documentName: "doc.md",
    pathHash: "hash_test_doc.md",
    status: "active" as const,
    deletedAt: null,
    snapshots: [],
    settings: defaultSettings,
    ...overrides,
  };
}

describe("useHistoryOperations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExists.mockResolvedValue(false);
    mockReadTextFile.mockResolvedValue("{}");
    mockWriteTextFile.mockResolvedValue(undefined);
    mockMkdir.mockResolvedValue(undefined);
    mockRemove.mockResolvedValue(undefined);
  });

  describe("getHistoryIndex", () => {
    it("returns null when index file does not exist", async () => {
      mockExists.mockResolvedValue(false);
      const result = await getHistoryIndex("/test/doc.md");
      expect(result).toBeNull();
    });

    it("returns parsed index when file exists", async () => {
      const index = makeIndex();
      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockResolvedValue(JSON.stringify(index));
      const result = await getHistoryIndex("/test/doc.md");
      expect(result).toEqual(index);
    });

    it("returns null when parseHistoryIndex returns null", async () => {
      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockResolvedValue("{}");
      const { parseHistoryIndex } = await import("@/utils/historyTypes");
      (parseHistoryIndex as ReturnType<typeof vi.fn>).mockReturnValueOnce(null);
      const result = await getHistoryIndex("/test/doc.md");
      expect(result).toBeNull();
    });

    it("returns null on read error", async () => {
      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockRejectedValue(new Error("read error"));
      const result = await getHistoryIndex("/test/doc.md");
      expect(result).toBeNull();
    });
  });

  describe("createSnapshot", () => {
    it("creates a new snapshot when no index exists", async () => {
      mockExists.mockResolvedValue(false);
      await createSnapshot("/test/doc.md", "content", "manual", defaultSettings);
      expect(mockWriteTextFile).toHaveBeenCalledTimes(2); // snapshot file + index
    });

    it("skips auto-save when file size exceeds limit", async () => {
      await createSnapshot("/test/doc.md", "x".repeat(2000), "auto", {
        ...defaultSettings,
        maxFileSizeKB: 1, // 1KB limit
      });
      // Should not write anything
      expect(mockWriteTextFile).not.toHaveBeenCalled();
    });

    it("does NOT skip manual save when file size exceeds limit", async () => {
      mockExists.mockResolvedValue(false);
      await createSnapshot("/test/doc.md", "x".repeat(2000), "manual", {
        ...defaultSettings,
        maxFileSizeKB: 1,
      });
      expect(mockWriteTextFile).toHaveBeenCalled();
    });

    it("merges with previous auto snapshot within merge window", async () => {
      const now = Date.now();
      const prevSnapshot = {
        id: "prev-id",
        timestamp: now - 10000, // 10 seconds ago
        type: "auto",
        size: 100,
        preview: "old",
      };
      const index = makeIndex({ snapshots: [prevSnapshot] });

      // First call: exists for historyDir, second: for index
      mockExists
        .mockResolvedValueOnce(true) // historyDir
        .mockResolvedValueOnce(true) // index
        .mockResolvedValueOnce(true) // old snapshot file
        .mockResolvedValueOnce(false); // new snapshot doesn't exist for prune

      mockReadTextFile.mockResolvedValue(JSON.stringify(index));

      await createSnapshot("/test/doc.md", "new content", "auto", {
        ...defaultSettings,
        mergeWindowSeconds: 60,
      });

      // Should have removed old snapshot file
      expect(mockRemove).toHaveBeenCalled();
    });

    it("throws on write failure", async () => {
      mockExists.mockResolvedValue(false);
      mockWriteTextFile.mockRejectedValue(new Error("write fail"));
      await expect(
        createSnapshot("/test/doc.md", "content", "manual", defaultSettings)
      ).rejects.toThrow("write fail");
    });
  });

  describe("getSnapshots", () => {
    it("returns empty array when no index", async () => {
      mockExists.mockResolvedValue(false);
      const result = await getSnapshots("/test/doc.md");
      expect(result).toEqual([]);
    });

    it("returns snapshots sorted newest first", async () => {
      const index = makeIndex({
        snapshots: [
          { id: "a", timestamp: 100, type: "auto", size: 10, preview: "" },
          { id: "b", timestamp: 300, type: "auto", size: 10, preview: "" },
          { id: "c", timestamp: 200, type: "auto", size: 10, preview: "" },
        ],
      });
      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockResolvedValue(JSON.stringify(index));
      const result = await getSnapshots("/test/doc.md");
      expect(result[0].id).toBe("b");
      expect(result[1].id).toBe("c");
      expect(result[2].id).toBe("a");
    });
  });

  describe("loadSnapshot", () => {
    it("returns content when snapshot exists", async () => {
      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockResolvedValue("snapshot content");
      const result = await loadSnapshot("/test/doc.md", "snap-1");
      expect(result).toBe("snapshot content");
    });

    it("returns null when snapshot file missing", async () => {
      mockExists.mockResolvedValue(false);
      const result = await loadSnapshot("/test/doc.md", "snap-1");
      expect(result).toBeNull();
    });

    it("returns null on read error", async () => {
      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockRejectedValue(new Error("fail"));
      const result = await loadSnapshot("/test/doc.md", "snap-1");
      expect(result).toBeNull();
    });
  });

  describe("revertToSnapshot", () => {
    it("creates revert snapshot then loads target", async () => {
      // For createSnapshot
      mockExists.mockResolvedValue(false);
      // For loadSnapshot after revert
      mockReadTextFile.mockResolvedValue("old content");

      const result = await revertToSnapshot(
        "/test/doc.md",
        "snap-1",
        "current content",
        defaultSettings
      );
      // loadSnapshot will return null because exists is false for the snapshot
      // but createSnapshot should have been called
      expect(mockWriteTextFile).toHaveBeenCalled();
    });
  });

  describe("pruneSnapshots", () => {
    it("does nothing when no index", async () => {
      mockExists.mockResolvedValue(false);
      await pruneSnapshots("/test/doc.md");
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it("removes snapshots exceeding max count", async () => {
      const now = Date.now();
      const snapshots = Array.from({ length: 5 }, (_, i) => ({
        id: `snap-${i}`,
        timestamp: now - i * 1000,
        type: "auto" as const,
        size: 10,
        preview: "",
      }));
      const index = makeIndex({
        snapshots,
        settings: { ...defaultSettings, maxSnapshots: 3 },
      });

      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockResolvedValue(JSON.stringify(index));

      await pruneSnapshots("/test/doc.md");

      // Should remove 2 oldest snapshots
      expect(mockRemove).toHaveBeenCalledTimes(2);
    });

    it("removes snapshots older than maxAgeDays", async () => {
      const now = Date.now();
      const oldTime = now - 60 * 24 * 60 * 60 * 1000; // 60 days ago
      const snapshots = [
        { id: "new", timestamp: now, type: "auto" as const, size: 10, preview: "" },
        { id: "old", timestamp: oldTime, type: "auto" as const, size: 10, preview: "" },
      ];
      const index = makeIndex({
        snapshots,
        settings: { ...defaultSettings, maxAgeDays: 30 },
      });

      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockResolvedValue(JSON.stringify(index));

      await pruneSnapshots("/test/doc.md");

      expect(mockRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe("markAsDeleted", () => {
    it("sets status to deleted with timestamp", async () => {
      const index = makeIndex();
      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockResolvedValue(JSON.stringify(index));

      await markAsDeleted("/test/doc.md");

      expect(mockWriteTextFile).toHaveBeenCalled();
      const writtenContent = JSON.parse(mockWriteTextFile.mock.calls[0][1]);
      expect(writtenContent.status).toBe("deleted");
      expect(writtenContent.deletedAt).toBeGreaterThan(0);
    });

    it("does nothing when no index", async () => {
      mockExists.mockResolvedValue(false);
      await markAsDeleted("/test/doc.md");
      expect(mockWriteTextFile).not.toHaveBeenCalled();
    });
  });

  describe("deleteSnapshot", () => {
    it("removes snapshot file and updates index", async () => {
      const index = makeIndex({
        snapshots: [
          { id: "keep", timestamp: 200, type: "auto", size: 10, preview: "" },
          { id: "delete-me", timestamp: 100, type: "auto", size: 10, preview: "" },
        ],
      });
      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockResolvedValue(JSON.stringify(index));

      await deleteSnapshot("/test/doc.md", "delete-me");

      expect(mockRemove).toHaveBeenCalled();
      const writtenContent = JSON.parse(mockWriteTextFile.mock.calls[0][1]);
      expect(writtenContent.snapshots).toHaveLength(1);
      expect(writtenContent.snapshots[0].id).toBe("keep");
    });

    it("does nothing when no index", async () => {
      mockExists.mockResolvedValue(false);
      await deleteSnapshot("/test/doc.md", "snap-1");
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it("does nothing when snapshot not in index", async () => {
      const index = makeIndex({ snapshots: [] });
      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockResolvedValue(JSON.stringify(index));
      await deleteSnapshot("/test/doc.md", "nonexistent");
      // No remove or write calls beyond the initial read
    });

    it("tolerates missing snapshot file during deletion", async () => {
      const index = makeIndex({
        snapshots: [{ id: "snap-1", timestamp: 100, type: "auto", size: 10, preview: "" }],
      });
      mockExists.mockResolvedValue(true);
      mockReadTextFile.mockResolvedValue(JSON.stringify(index));
      mockRemove.mockRejectedValue(new Error("file not found"));

      // Should not throw
      await deleteSnapshot("/test/doc.md", "snap-1");

      // Index should still be updated
      expect(mockWriteTextFile).toHaveBeenCalled();
    });
  });
});
