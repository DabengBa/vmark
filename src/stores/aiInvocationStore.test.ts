import { describe, it, expect, beforeEach } from "vitest";
import { useAiInvocationStore } from "./aiInvocationStore";

describe("aiInvocationStore", () => {
  beforeEach(() => {
    useAiInvocationStore.getState().cancel();
  });

  it("starts with isRunning false", () => {
    expect(useAiInvocationStore.getState().isRunning).toBe(false);
    expect(useAiInvocationStore.getState().requestId).toBeNull();
  });

  it("tryStart succeeds when idle", () => {
    const ok = useAiInvocationStore.getState().tryStart("req-1");
    expect(ok).toBe(true);
    expect(useAiInvocationStore.getState().isRunning).toBe(true);
    expect(useAiInvocationStore.getState().requestId).toBe("req-1");
  });

  it("rejects concurrent invocations via store guard", () => {
    useAiInvocationStore.getState().tryStart("req-1");
    const ok = useAiInvocationStore.getState().tryStart("req-2");
    expect(ok).toBe(false);
    expect(useAiInvocationStore.getState().requestId).toBe("req-1");
  });

  it("cancel resets isRunning and clears requestId", () => {
    useAiInvocationStore.getState().tryStart("req-1");
    useAiInvocationStore.getState().cancel();
    expect(useAiInvocationStore.getState().isRunning).toBe(false);
    expect(useAiInvocationStore.getState().requestId).toBeNull();
  });

  it("after cancel, new invocation succeeds", () => {
    useAiInvocationStore.getState().tryStart("req-1");
    useAiInvocationStore.getState().cancel();
    const ok = useAiInvocationStore.getState().tryStart("req-2");
    expect(ok).toBe(true);
    expect(useAiInvocationStore.getState().requestId).toBe("req-2");
  });

  it("finish resets state", () => {
    useAiInvocationStore.getState().tryStart("req-1");
    useAiInvocationStore.getState().finish();
    expect(useAiInvocationStore.getState().isRunning).toBe(false);
    expect(useAiInvocationStore.getState().requestId).toBeNull();
  });
});
