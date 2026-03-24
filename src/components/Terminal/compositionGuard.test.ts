/**
 * Tests for terminal IME composition grace period.
 *
 * Validates the pattern used in createTerminalInstance.ts:
 * - composing stays true during grace period after compositionend
 * - onCompositionCommit fires with clean committed text after grace period
 * - onData is blocked during grace period (composing=true)
 * - new compositionstart cancels pending grace timer
 * - single non-ASCII chars (CJK brackets) flush immediately without grace period (#525)
 * - lastCommittedText / lastCommitTime enable onData deduplication (#525)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const GRACE_MS = 80;

/**
 * Minimal reproduction of the composition guard logic from createTerminalInstance.
 * Extracted here so we can test timing and state transitions without needing
 * a real xterm instance.
 */
function createCompositionGuard() {
  let composing = false;
  let inGracePeriod = false;
  let graceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingCommitText: string | null = null;
  let commitCallback: ((text: string) => void) | null = null;
  let lastCommittedText: string | null = null;
  let lastCommitTime = 0;

  return {
    get composing() { return composing; },
    get inGracePeriod() { return inGracePeriod; },
    get lastCommittedText() { return lastCommittedText; },
    get lastCommitTime() { return lastCommitTime; },
    set onCompositionCommit(cb: ((text: string) => void) | null) { commitCallback = cb; },

    compositionStart() {
      // Flush any pending committed text from a previous compositionend before
      // starting a new composition — prevents input loss in rapid back-to-back
      // IME commits (mirrors createTerminalInstance.ts flush logic).
      if (graceTimer) {
        clearTimeout(graceTimer);
        graceTimer = null;
        if (pendingCommitText && commitCallback) {
          lastCommittedText = pendingCommitText;
          lastCommitTime = Date.now();
          commitCallback(pendingCommitText);
        }
        pendingCommitText = null;
      }
      composing = true;
      inGracePeriod = false;
    },

    compositionEnd(data: string) {
      // Single non-ASCII character (CJK punctuation/bracket) — flush immediately.
      // These don't trigger xterm's garbled space injection, so no grace period needed.
      // eslint-disable-next-line no-control-regex
      if (data && data.length === 1 && !/^[\x00-\x7F]$/.test(data)) {
        composing = false;
        inGracePeriod = false;
        if (graceTimer) {
          clearTimeout(graceTimer);
          graceTimer = null;
        }
        pendingCommitText = null;
        lastCommittedText = data;
        lastCommitTime = Date.now();
        if (commitCallback) {
          commitCallback(data);
        }
        return;
      }

      // Multi-char: use grace period as before
      pendingCommitText = data;
      inGracePeriod = true;
      graceTimer = setTimeout(() => {
        graceTimer = null;
        composing = false;
        inGracePeriod = false;
        if (pendingCommitText && commitCallback) {
          lastCommittedText = pendingCommitText;
          lastCommitTime = Date.now();
          commitCallback(pendingCommitText);
        }
        pendingCommitText = null;
      }, GRACE_MS);
    },

    dispose() {
      if (graceTimer) {
        clearTimeout(graceTimer);
        graceTimer = null;
      }
    },
  };
}

describe("terminal IME composition grace period", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("composing stays true during grace period after compositionend", () => {
    const guard = createCompositionGuard();
    guard.compositionStart();
    expect(guard.composing).toBe(true);

    guard.compositionEnd("claude");
    // Still composing during grace period
    expect(guard.composing).toBe(true);

    vi.advanceTimersByTime(GRACE_MS - 1);
    expect(guard.composing).toBe(true);

    vi.advanceTimersByTime(1);
    expect(guard.composing).toBe(false);
  });

  it("fires onCompositionCommit with clean text after grace period", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("claude");

    // Not fired yet during grace period
    expect(commit).not.toHaveBeenCalled();

    vi.advanceTimersByTime(GRACE_MS);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith("claude");
  });

  it("fires onCompositionCommit with CJK characters", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("你好");

    vi.advanceTimersByTime(GRACE_MS);
    expect(commit).toHaveBeenCalledWith("你好");
  });

  it("does not fire commit for empty composition (e.g., Escape cancel)", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("");

    vi.advanceTimersByTime(GRACE_MS);
    expect(commit).not.toHaveBeenCalled();
    expect(guard.composing).toBe(false);
  });

  it("new compositionstart flushes pending text then starts new composition", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("ni");

    // Start a new composition before grace expires — flushes "ni" immediately
    vi.advanceTimersByTime(GRACE_MS / 2);
    guard.compositionStart();

    // "ni" should have been flushed immediately by compositionStart
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith("ni");
    expect(guard.composing).toBe(true);

    // Now finish second composition
    guard.compositionEnd("你好");
    vi.advanceTimersByTime(GRACE_MS);
    expect(commit).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalledWith("你好");
  });

  it("blocks onData-style forwarding during grace period", () => {
    const guard = createCompositionGuard();
    const ptyWrite = vi.fn();

    // Simulate the onData guard pattern from useTerminalSessions
    const onData = (data: string) => {
      if (guard.composing) return; // blocked
      ptyWrite(data);
    };

    guard.compositionStart();
    onData("cl"); // blocked during composition
    expect(ptyWrite).not.toHaveBeenCalled();

    guard.compositionEnd("claude");
    onData("cl au de"); // blocked during grace period
    expect(ptyWrite).not.toHaveBeenCalled();

    vi.advanceTimersByTime(GRACE_MS);
    // After grace, normal data passes through
    onData("hello");
    expect(ptyWrite).toHaveBeenCalledWith("hello");
  });
});

describe("single non-ASCII char immediate flush (#525 — CJK brackets)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("flushes single CJK bracket immediately without grace period", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("（");

    // Should fire immediately — no grace period
    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith("（");
    expect(guard.composing).toBe(false);
    expect(guard.inGracePeriod).toBe(false);
  });

  it("flushes single CJK character immediately", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("你");

    expect(commit).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith("你");
    expect(guard.composing).toBe(false);
  });

  it("does NOT flush single ASCII char immediately (uses grace period)", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("a");

    // Should NOT fire immediately — single ASCII goes through grace period
    expect(commit).not.toHaveBeenCalled();
    expect(guard.composing).toBe(true);

    vi.advanceTimersByTime(GRACE_MS);
    expect(commit).toHaveBeenCalledWith("a");
  });

  it("uses grace period for multi-char CJK input", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("你好");

    // Multi-char — should NOT fire immediately
    expect(commit).not.toHaveBeenCalled();
    expect(guard.composing).toBe(true);

    vi.advanceTimersByTime(GRACE_MS);
    expect(commit).toHaveBeenCalledWith("你好");
  });

  it("sets lastCommittedText and lastCommitTime on immediate flush", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    guard.onCompositionCommit = commit;

    const beforeTime = Date.now();
    guard.compositionStart();
    guard.compositionEnd("）");

    expect(guard.lastCommittedText).toBe("）");
    expect(guard.lastCommitTime).toBeGreaterThanOrEqual(beforeTime);
  });

  it("handles various CJK brackets: 【、】、「、」", () => {
    const brackets = ["【", "】", "「", "」", "《", "》", "、"];
    for (const bracket of brackets) {
      const guard = createCompositionGuard();
      const commit = vi.fn();
      guard.onCompositionCommit = commit;

      guard.compositionStart();
      guard.compositionEnd(bracket);

      expect(commit).toHaveBeenCalledTimes(1);
      expect(commit).toHaveBeenCalledWith(bracket);
      expect(guard.composing).toBe(false);

      guard.dispose();
    }
  });
});

describe("WeChat IME onData dedup (#525)", () => {
  const DEDUP_WINDOW_MS = 150;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets lastCommittedText/lastCommitTime after grace period commit", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("你好");

    vi.advanceTimersByTime(GRACE_MS);

    expect(guard.lastCommittedText).toBe("你好");
    expect(guard.lastCommitTime).toBeGreaterThan(0);
  });

  it("dedup guard blocks late onData matching committed text within window", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    const ptyWrite = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("你好");
    vi.advanceTimersByTime(GRACE_MS);

    // Simulate the onData dedup guard from useTerminalSessions
    const onData = (data: string) => {
      if (
        guard.lastCommittedText &&
        data === guard.lastCommittedText &&
        Date.now() - guard.lastCommitTime < DEDUP_WINDOW_MS
      ) {
        return; // deduped
      }
      ptyWrite(data);
    };

    // Late onData arrives 50ms after commit — within dedup window
    vi.advanceTimersByTime(50);
    onData("你好");
    expect(ptyWrite).not.toHaveBeenCalled();
  });

  it("dedup guard allows onData with different text", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    const ptyWrite = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("你好");
    vi.advanceTimersByTime(GRACE_MS);

    const onData = (data: string) => {
      if (
        guard.lastCommittedText &&
        data === guard.lastCommittedText &&
        Date.now() - guard.lastCommitTime < DEDUP_WINDOW_MS
      ) {
        return;
      }
      ptyWrite(data);
    };

    vi.advanceTimersByTime(50);
    onData("世界");
    expect(ptyWrite).toHaveBeenCalledWith("世界");
  });

  it("dedup guard allows onData after dedup window expires", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    const ptyWrite = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("你好");
    vi.advanceTimersByTime(GRACE_MS);

    const onData = (data: string) => {
      if (
        guard.lastCommittedText &&
        data === guard.lastCommittedText &&
        Date.now() - guard.lastCommitTime < DEDUP_WINDOW_MS
      ) {
        return;
      }
      ptyWrite(data);
    };

    // Wait past the dedup window
    vi.advanceTimersByTime(DEDUP_WINDOW_MS + 10);
    onData("你好");
    expect(ptyWrite).toHaveBeenCalledWith("你好");
  });

  it("sets lastCommittedText on compositionStart flush", () => {
    const guard = createCompositionGuard();
    const commit = vi.fn();
    guard.onCompositionCommit = commit;

    guard.compositionStart();
    guard.compositionEnd("你好");

    // Start new composition before grace expires — flushes "你好"
    vi.advanceTimersByTime(GRACE_MS / 2);
    guard.compositionStart();

    expect(guard.lastCommittedText).toBe("你好");
    expect(guard.lastCommitTime).toBeGreaterThan(0);
  });
});
