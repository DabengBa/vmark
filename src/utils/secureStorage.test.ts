import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Tauri store plugin
const mockStore = {
  get: vi.fn(),
  set: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@tauri-apps/plugin-store", () => ({
  load: vi.fn().mockResolvedValue(mockStore),
}));

// Must import after mocks
const { initSecureStorage, createSecureStorage, _resetForTesting } = await import("./secureStorage");

describe("secureStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetForTesting();
    mockStore.get.mockResolvedValue(null);
    mockStore.set.mockResolvedValue(undefined);
    mockStore.save.mockResolvedValue(undefined);
    mockStore.delete.mockResolvedValue(undefined);
    localStorage.clear();
  });

  describe("initSecureStorage", () => {
    it("migrates data from localStorage to Tauri store", async () => {
      localStorage.setItem("test-key", '{"apiKey":"sk-123"}');
      mockStore.get.mockResolvedValue(null); // Not in Tauri store yet

      await initSecureStorage(["test-key"]);

      expect(mockStore.set).toHaveBeenCalledWith("test-key", '{"apiKey":"sk-123"}');
      expect(mockStore.save).toHaveBeenCalled();
      // localStorage should be cleared after migration
      expect(localStorage.getItem("test-key")).toBeNull();
    });

    it("prefers Tauri store data over localStorage", async () => {
      localStorage.setItem("test-key", '{"old":"data"}');
      mockStore.get.mockResolvedValue('{"new":"data"}');

      await initSecureStorage(["test-key"]);

      const storage = createSecureStorage();
      expect(storage.getItem("test-key")).toBe('{"new":"data"}');
      // localStorage should NOT be cleared when Tauri store has data
      expect(localStorage.getItem("test-key")).toBe('{"old":"data"}');
    });
  });

  describe("createSecureStorage", () => {
    it("returns cached data synchronously", async () => {
      mockStore.get.mockResolvedValue('{"key":"value"}');
      await initSecureStorage(["cached-key"]);

      const storage = createSecureStorage();
      expect(storage.getItem("cached-key")).toBe('{"key":"value"}');
    });

    it("returns null for unknown keys", () => {
      const storage = createSecureStorage();
      expect(storage.getItem("nonexistent")).toBeNull();
    });

    it("setItem updates cache immediately", () => {
      const storage = createSecureStorage();
      storage.setItem("new-key", "new-value");
      expect(storage.getItem("new-key")).toBe("new-value");
    });

    it("setItem syncs to Tauri store in background", async () => {
      const storage = createSecureStorage();
      storage.setItem("bg-key", "bg-value");

      // Wait for async sync
      await new Promise((r) => setTimeout(r, 50));
      expect(mockStore.set).toHaveBeenCalledWith("bg-key", "bg-value");
      expect(mockStore.save).toHaveBeenCalled();
    });

    it("removeItem clears cache immediately", () => {
      const storage = createSecureStorage();
      storage.setItem("del-key", "del-value");
      storage.removeItem("del-key");
      expect(storage.getItem("del-key")).toBeNull();
    });
  });
});
