/**
 * Secure Storage Adapter for Zustand Persist
 *
 * Purpose: Stores sensitive data (API keys) outside localStorage using
 *   Tauri's store plugin. Uses a sync in-memory cache for Zustand's
 *   synchronous persist middleware, with async background sync to disk.
 *
 * Migration: On first use, migrates data from localStorage to Tauri store,
 *   then clears the localStorage entry to prevent key exposure via DevTools.
 *
 * @coordinates-with @tauri-apps/plugin-store — Tauri store plugin for secure persistence
 * @coordinates-with src/stores/aiProviderStore.ts — primary consumer
 * @module utils/secureStorage
 */

import type { StateStorage } from "zustand/middleware";
import { safeStorageError } from "@/utils/debug";

/** In-memory cache for sync read/write. Background-synced to Tauri store. */
const cache = new Map<string, string>();

/** Whether the Tauri store has been pre-loaded into cache. */
let initialized = false;

/** Reset internal state (for testing only). */
export function _resetForTesting(): void {
  cache.clear();
  initialized = false;
  storePromise = null;
}

/** Tauri store instance (lazy-loaded). */
let storePromise: Promise<{ get: (key: string) => Promise<string | null>; set: (key: string, value: string) => Promise<void>; save: () => Promise<void>; delete: (key: string) => Promise<void> }> | null = null;

async function getStore() {
  if (!storePromise) {
    storePromise = import("@tauri-apps/plugin-store").then(async (mod) => {
      const store = await mod.load(".vmark-secure.json");
      return store as unknown as {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<void>;
        save: () => Promise<void>;
        delete: (key: string) => Promise<void>;
      };
    });
  }
  return storePromise;
}

/**
 * Pre-load the Tauri store into the in-memory cache.
 * Must be called before Zustand stores hydrate.
 *
 * Also performs one-time migration from localStorage if data exists there.
 */
export async function initSecureStorage(keys: string[]): Promise<void> {
  if (initialized) return;

  try {
    const store = await getStore();

    for (const key of keys) {
      // Check if Tauri store has this key
      const value = await store.get(key);
      if (value !== null && value !== undefined) {
        cache.set(key, typeof value === "string" ? value : JSON.stringify(value));
      } else {
        // Migration: check localStorage for legacy data
        const legacyValue = localStorage.getItem(key);
        if (legacyValue) {
          cache.set(key, legacyValue);
          // Write to Tauri store
          await store.set(key, legacyValue);
          await store.save();
          // Clear from localStorage (remove sensitive data from DevTools-accessible storage)
          localStorage.removeItem(key);
        }
      }
    }
  } catch (error) {
    // Tauri store not available (unit tests, CI) — fall back to localStorage
    safeStorageError("Secure storage init failed, falling back to localStorage:", error);
    for (const key of keys) {
      const value = localStorage.getItem(key);
      if (value) cache.set(key, value);
    }
  }

  initialized = true;
}

/**
 * Create a synchronous StateStorage backed by the secure Tauri store.
 *
 * Reads from in-memory cache (populated by initSecureStorage).
 * Writes update cache immediately and sync to Tauri store asynchronously.
 */
export function createSecureStorage(): StateStorage {
  return {
    getItem: (name: string) => {
      return cache.get(name) ?? null;
    },

    setItem: (name: string, value: string) => {
      cache.set(name, value);

      // Background sync to Tauri store
      getStore()
        .then(async (store) => {
          await store.set(name, value);
          await store.save();
        })
        .catch((error) => {
          safeStorageError("Failed to persist to secure storage:", error);
        });
    },

    removeItem: (name: string) => {
      cache.delete(name);

      getStore()
        .then(async (store) => {
          await store.delete(name);
          await store.save();
        })
        .catch((error) => {
          safeStorageError("Failed to remove from secure storage:", error);
        });
    },
  };
}
