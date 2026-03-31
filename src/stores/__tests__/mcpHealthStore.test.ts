import { useMcpHealthStore } from "../mcpHealthStore";

beforeEach(() => {
  useMcpHealthStore.getState().reset();
});

describe("mcpHealthStore", () => {
  it("initializes with empty health and not checking", () => {
    const state = useMcpHealthStore.getState();
    expect(state.isChecking).toBe(false);
    expect(state.health.version).toBeNull();
    expect(state.health.toolCount).toBeNull();
    expect(state.health.resourceCount).toBeNull();
    expect(state.health.tools).toEqual([]);
    expect(state.health.lastChecked).toBeNull();
    expect(state.health.checkError).toBeNull();
  });

  it("setHealth merges partial health info", () => {
    useMcpHealthStore.getState().setHealth({ version: "1.0.0", toolCount: 5 });
    const state = useMcpHealthStore.getState();
    expect(state.health.version).toBe("1.0.0");
    expect(state.health.toolCount).toBe(5);
    // Unset fields remain at initial values
    expect(state.health.resourceCount).toBeNull();
    expect(state.health.tools).toEqual([]);
    expect(state.health.lastChecked).toBeNull();
    expect(state.health.checkError).toBeNull();
  });

  it("setHealth accumulates across multiple calls", () => {
    useMcpHealthStore.getState().setHealth({ version: "1.0.0" });
    useMcpHealthStore.getState().setHealth({ toolCount: 3, resourceCount: 2 });
    const state = useMcpHealthStore.getState();
    expect(state.health.version).toBe("1.0.0");
    expect(state.health.toolCount).toBe(3);
    expect(state.health.resourceCount).toBe(2);
  });

  it("setHealth overwrites previously set fields", () => {
    useMcpHealthStore.getState().setHealth({ version: "1.0.0" });
    useMcpHealthStore.getState().setHealth({ version: "2.0.0" });
    expect(useMcpHealthStore.getState().health.version).toBe("2.0.0");
  });

  it("setHealth with tools array", () => {
    const tools = ["document", "editor", "format"];
    useMcpHealthStore.getState().setHealth({ tools, toolCount: 3 });
    const state = useMcpHealthStore.getState();
    expect(state.health.tools).toEqual(tools);
    expect(state.health.toolCount).toBe(3);
  });

  it("setHealth with lastChecked date", () => {
    const now = new Date();
    useMcpHealthStore.getState().setHealth({ lastChecked: now });
    expect(useMcpHealthStore.getState().health.lastChecked).toBe(now);
  });

  it("setHealth with checkError", () => {
    useMcpHealthStore.getState().setHealth({ checkError: "Connection refused" });
    expect(useMcpHealthStore.getState().health.checkError).toBe("Connection refused");
  });

  it("setHealth clears error on successful update", () => {
    useMcpHealthStore.getState().setHealth({ checkError: "Timeout" });
    useMcpHealthStore.getState().setHealth({ checkError: null, version: "1.0.0" });
    const state = useMcpHealthStore.getState();
    expect(state.health.checkError).toBeNull();
    expect(state.health.version).toBe("1.0.0");
  });

  it("setIsChecking toggles checking state", () => {
    useMcpHealthStore.getState().setIsChecking(true);
    expect(useMcpHealthStore.getState().isChecking).toBe(true);
    useMcpHealthStore.getState().setIsChecking(false);
    expect(useMcpHealthStore.getState().isChecking).toBe(false);
  });

  it("setIsChecking does not affect health data", () => {
    useMcpHealthStore.getState().setHealth({ version: "1.0.0" });
    useMcpHealthStore.getState().setIsChecking(true);
    expect(useMcpHealthStore.getState().health.version).toBe("1.0.0");
  });

  it("reset clears all state to initial values", () => {
    const now = new Date();
    useMcpHealthStore.getState().setHealth({
      version: "1.0.0",
      toolCount: 5,
      resourceCount: 2,
      tools: ["a", "b"],
      lastChecked: now,
      checkError: null,
    });
    useMcpHealthStore.getState().setIsChecking(true);

    useMcpHealthStore.getState().reset();
    const state = useMcpHealthStore.getState();
    expect(state.isChecking).toBe(false);
    expect(state.health.version).toBeNull();
    expect(state.health.toolCount).toBeNull();
    expect(state.health.resourceCount).toBeNull();
    expect(state.health.tools).toEqual([]);
    expect(state.health.lastChecked).toBeNull();
    expect(state.health.checkError).toBeNull();
  });

  it("setHealth with empty partial is a no-op", () => {
    useMcpHealthStore.getState().setHealth({ version: "1.0.0" });
    useMcpHealthStore.getState().setHealth({});
    expect(useMcpHealthStore.getState().health.version).toBe("1.0.0");
  });
});
