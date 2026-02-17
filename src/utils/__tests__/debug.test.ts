/**
 * Tests for src/utils/debug.ts — conditional debug loggers.
 *
 * The module evaluates `import.meta.env.DEV` at load time.
 * Vitest sets DEV=true by default, so the default import tests the dev path.
 * For production-mode tests we dynamically re-import with a stubbed env.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// All exported loggers — imported statically (DEV=true in vitest)
import {
  historyLog,
  autoSaveLog,
  terminalLog,
  crashRecoveryLog,
  hotExitLog,
  hotExitWarn,
  fileOpsLog,
  fileOpsWarn,
  mcpAutoStartLog,
  updateCheckerLog,
  aiProviderLog,
  aiProviderWarn,
  geniesLog,
  geniesWarn,
  recentWarn,
  shortcutsWarn,
} from "../debug";

/* ------------------------------------------------------------------ */
/*  Metadata: every logger exists and is a function                    */
/* ------------------------------------------------------------------ */

const allLoggers = {
  historyLog,
  autoSaveLog,
  terminalLog,
  crashRecoveryLog,
  hotExitLog,
  hotExitWarn,
  fileOpsLog,
  fileOpsWarn,
  mcpAutoStartLog,
  updateCheckerLog,
  aiProviderLog,
  aiProviderWarn,
  geniesLog,
  geniesWarn,
  recentWarn,
  shortcutsWarn,
} as const;

describe("debug loggers — existence and type", () => {
  it.each(Object.entries(allLoggers))(
    "%s is a function",
    (_name, logger) => {
      expect(typeof logger).toBe("function");
    },
  );

  it("exports exactly 16 loggers", () => {
    expect(Object.keys(allLoggers)).toHaveLength(16);
  });
});

/* ------------------------------------------------------------------ */
/*  Naming: each logger uses a unique prefix tag                       */
/* ------------------------------------------------------------------ */

describe("debug loggers — prefix conventions", () => {
  /**
   * Map of logger name -> expected prefix and console method.
   * Loggers ending in "Warn" use console.warn; others use console.log.
   */
  const prefixMap: Record<string, { prefix: string; method: "log" | "warn" }> = {
    historyLog:       { prefix: "[History]",       method: "log" },
    autoSaveLog:      { prefix: "[AutoSave]",      method: "log" },
    terminalLog:      { prefix: "[Terminal]",       method: "log" },
    crashRecoveryLog: { prefix: "[CrashRecovery]", method: "log" },
    hotExitLog:       { prefix: "[HotExit]",       method: "log" },
    hotExitWarn:      { prefix: "[HotExit]",       method: "warn" },
    fileOpsLog:       { prefix: "[FileOps]",       method: "log" },
    fileOpsWarn:      { prefix: "[FileOps]",       method: "warn" },
    mcpAutoStartLog:  { prefix: "[MCP]",           method: "log" },
    updateCheckerLog: { prefix: "[UpdateChecker]",  method: "log" },
    aiProviderLog:    { prefix: "[AIProvider]",    method: "log" },
    aiProviderWarn:   { prefix: "[AIProvider]",    method: "warn" },
    geniesLog:        { prefix: "[Genies]",        method: "log" },
    geniesWarn:       { prefix: "[Genies]",        method: "warn" },
    recentWarn:       { prefix: "[Recent]",        method: "warn" },
    shortcutsWarn:    { prefix: "[Shortcuts]",     method: "warn" },
  };

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(Object.entries(prefixMap))(
    "%s outputs prefix %s via console.%s",
    (name, { prefix, method }) => {
      const logger = allLoggers[name as keyof typeof allLoggers];
      logger("test message");

      const spy = method === "warn" ? console.warn : console.log;
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(prefix, "test message");
    },
  );

  it("log-type loggers do not use console.warn", () => {
    const logOnlyNames = Object.entries(prefixMap)
      .filter(([, v]) => v.method === "log")
      .map(([k]) => k);

    for (const name of logOnlyNames) {
      const logger = allLoggers[name as keyof typeof allLoggers];
      logger("x");
    }

    expect(console.warn).not.toHaveBeenCalled();
  });

  it("warn-type loggers do not use console.log", () => {
    const warnOnlyNames = Object.entries(prefixMap)
      .filter(([, v]) => v.method === "warn")
      .map(([k]) => k);

    for (const name of warnOnlyNames) {
      const logger = allLoggers[name as keyof typeof allLoggers];
      logger("x");
    }

    expect(console.log).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/*  Dev mode: loggers call console with correct arguments              */
/* ------------------------------------------------------------------ */

describe("debug loggers — dev mode behavior", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes multiple arguments through", () => {
    historyLog("a", 1, true, null);
    expect(console.log).toHaveBeenCalledWith("[History]", "a", 1, true, null);
  });

  it("works with no arguments beyond the prefix", () => {
    autoSaveLog();
    expect(console.log).toHaveBeenCalledWith("[AutoSave]");
  });

  it("passes objects and arrays through", () => {
    const obj = { key: "value", nested: { a: 1 } };
    const arr = [1, 2, 3];
    fileOpsLog(obj, arr);
    expect(console.log).toHaveBeenCalledWith("[FileOps]", obj, arr);
  });

  it("passes undefined and null", () => {
    terminalLog(undefined, null);
    expect(console.log).toHaveBeenCalledWith("[Terminal]", undefined, null);
  });

  it("passes Error objects", () => {
    const err = new Error("boom");
    crashRecoveryLog(err);
    expect(console.log).toHaveBeenCalledWith("[CrashRecovery]", err);
  });

  it("handles Unicode and CJK strings", () => {
    geniesLog("你好世界", "🎉", "日本語テスト");
    expect(console.log).toHaveBeenCalledWith("[Genies]", "你好世界", "🎉", "日本語テスト");
  });

  it("handles many arguments", () => {
    const args = Array.from({ length: 20 }, (_, i) => `arg${i}`);
    updateCheckerLog(...args);
    expect(console.log).toHaveBeenCalledWith("[UpdateChecker]", ...args);
  });

  it("handles numeric edge values", () => {
    aiProviderLog(0, -1, Infinity, -Infinity, NaN);
    expect(console.log).toHaveBeenCalledWith("[AIProvider]", 0, -1, Infinity, -Infinity, NaN);
  });

  it("handles empty string", () => {
    mcpAutoStartLog("");
    expect(console.log).toHaveBeenCalledWith("[MCP]", "");
  });

  it("warn loggers pass arguments correctly", () => {
    hotExitWarn("disk full", { code: 28 });
    expect(console.warn).toHaveBeenCalledWith("[HotExit]", "disk full", { code: 28 });
  });
});

/* ------------------------------------------------------------------ */
/*  No-throw guarantee: loggers never throw for any argument type      */
/* ------------------------------------------------------------------ */

describe("debug loggers — no-throw guarantee", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const edgeCaseArgs: unknown[][] = [
    [],
    [undefined],
    [null],
    [0],
    [""],
    [false],
    [Symbol("test")],
    [BigInt(9007199254740991)],
    [() => "fn"],
    [{ circular: null as unknown }],
    [new Map([["a", 1]])],
    [new Set([1, 2, 3])],
    [new Date()],
    [/regex/gi],
    [new ArrayBuffer(8)],
    [new Uint8Array([1, 2, 3])],
  ];

  it.each(Object.keys(allLoggers))(
    "%s does not throw for any edge-case argument",
    (name) => {
      const logger = allLoggers[name as keyof typeof allLoggers];
      for (const args of edgeCaseArgs) {
        expect(() => logger(...args)).not.toThrow();
      }
    },
  );
});

/* ------------------------------------------------------------------ */
/*  Production mode: loggers are no-ops                                */
/* ------------------------------------------------------------------ */

describe("debug loggers — production mode (DEV=false)", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("production loggers do not call console.log or console.warn", async () => {
    // Dynamically re-import with DEV=false
    // vi.stubEnv sets import.meta.env values, but the module caches isDev at load time.
    // We must reset the module registry so the ternary re-evaluates.
    vi.stubEnv("DEV", false);

    // Clear module cache so the fresh import picks up DEV=false
    vi.resetModules();

    const prodDebug = await import("../debug");

    // Call every logger
    prodDebug.historyLog("should not appear");
    prodDebug.autoSaveLog("should not appear");
    prodDebug.terminalLog("should not appear");
    prodDebug.crashRecoveryLog("should not appear");
    prodDebug.hotExitLog("should not appear");
    prodDebug.hotExitWarn("should not appear");
    prodDebug.fileOpsLog("should not appear");
    prodDebug.fileOpsWarn("should not appear");
    prodDebug.mcpAutoStartLog("should not appear");
    prodDebug.updateCheckerLog("should not appear");
    prodDebug.aiProviderLog("should not appear");
    prodDebug.aiProviderWarn("should not appear");
    prodDebug.geniesLog("should not appear");
    prodDebug.geniesWarn("should not appear");
    prodDebug.recentWarn("should not appear");
    prodDebug.shortcutsWarn("should not appear");

    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });

  it("production loggers are callable with any arguments without throwing", async () => {
    vi.stubEnv("DEV", false);
    vi.resetModules();

    const prodDebug = await import("../debug");

    expect(() => prodDebug.historyLog()).not.toThrow();
    expect(() => prodDebug.historyLog("a", 1, null, undefined, {})).not.toThrow();
    expect(() => prodDebug.hotExitWarn(new Error("test"))).not.toThrow();
    expect(() => prodDebug.fileOpsLog(Symbol("s"), BigInt(42))).not.toThrow();

    vi.unstubAllEnvs();
  });
});
