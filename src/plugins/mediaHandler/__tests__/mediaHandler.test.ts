/**
 * Tests for mediaHandler — media type detection and extension structure.
 */

import { describe, it, expect } from "vitest";
import { hasVideoExtension, hasAudioExtension, getMediaType } from "@/utils/mediaPathDetection";
import { mediaHandlerExtension } from "../tiptap";

describe("mediaHandlerExtension", () => {
  it("has the correct name", () => {
    expect(mediaHandlerExtension.name).toBe("mediaHandler");
  });

  it("has lower priority than default (90)", () => {
    expect(mediaHandlerExtension.options).toBeDefined();
    // Priority is set at extension level
    expect(mediaHandlerExtension.config.priority).toBe(90);
  });

  it("is an Extension type", () => {
    expect(mediaHandlerExtension.type).toBe("extension");
  });
});

describe("media type detection via mediaPathDetection", () => {
  describe("hasVideoExtension", () => {
    it.each([
      ["video.mp4", true],
      ["video.webm", true],
      ["video.mov", true],
      ["video.avi", true],
      ["video.mkv", true],
      ["video.m4v", true],
      ["video.ogv", true],
      ["video.MP4", true],
      ["audio.mp3", false],
      ["image.png", false],
      ["file.txt", false],
      ["", false],
    ])("hasVideoExtension(%s) => %s", (path, expected) => {
      expect(hasVideoExtension(path)).toBe(expected);
    });

    it("handles paths with query params", () => {
      expect(hasVideoExtension("video.mp4?t=123")).toBe(true);
    });

    it("handles paths with hash", () => {
      expect(hasVideoExtension("video.webm#section")).toBe(true);
    });

    it("handles full URLs", () => {
      expect(hasVideoExtension("https://example.com/video.mp4")).toBe(true);
    });
  });

  describe("hasAudioExtension", () => {
    it.each([
      ["audio.mp3", true],
      ["audio.m4a", true],
      ["audio.ogg", true],
      ["audio.wav", true],
      ["audio.flac", true],
      ["audio.aac", true],
      ["audio.opus", true],
      ["audio.MP3", true],
      ["video.mp4", false],
      ["image.png", false],
      ["", false],
    ])("hasAudioExtension(%s) => %s", (path, expected) => {
      expect(hasAudioExtension(path)).toBe(expected);
    });
  });

  describe("getMediaType", () => {
    it.each([
      ["video.mp4", "video"],
      ["audio.mp3", "audio"],
      ["image.png", "image"],
      ["image.jpg", "image"],
      ["image.svg", "image"],
      ["file.txt", null],
      ["", null],
      ["noext", null],
    ])("getMediaType(%s) => %s", (path, expected) => {
      expect(getMediaType(path)).toBe(expected);
    });

    it("handles edge case of dot-only filename", () => {
      expect(getMediaType("file.")).toBeNull();
    });

    it("handles hidden files", () => {
      expect(getMediaType(".gitignore")).toBeNull();
    });
  });
});
