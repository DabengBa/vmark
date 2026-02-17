import { describe, it, expect, beforeEach, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { useAiProviderStore, REST_TYPES, KEY_OPTIONAL_REST } from "../aiProviderStore";

// Ensure invoke mock returns sane defaults for store initialization
vi.mocked(invoke).mockImplementation(async (cmd: string) => {
  if (cmd === "detect_ai_providers") return [];
  if (cmd === "read_env_api_keys") return {};
  return undefined;
});

describe("aiProviderStore", () => {
  beforeEach(() => {
    useAiProviderStore.setState({
      activeProvider: null,
      cliProviders: [],
      restProviders: [
        { type: "anthropic", name: "Anthropic", endpoint: "https://api.anthropic.com", apiKey: "", model: "claude-sonnet-4-5-20250929" },
        { type: "openai", name: "OpenAI", endpoint: "https://api.openai.com", apiKey: "", model: "gpt-4o" },
        { type: "google-ai", name: "Google AI", endpoint: "", apiKey: "", model: "gemini-2.0-flash" },
        { type: "ollama-api", name: "Ollama (API)", endpoint: "http://localhost:11434", apiKey: "", model: "llama3.2" },
      ],
      detecting: false,
    });
  });

  // ── Initialization ──────────────────────────────────────────────────

  it("initializes with null activeProvider", () => {
    expect(useAiProviderStore.getState().activeProvider).toBeNull();
  });

  it("initializes with empty cliProviders", () => {
    expect(useAiProviderStore.getState().cliProviders).toEqual([]);
  });

  it("initializes with four default REST providers", () => {
    const { restProviders } = useAiProviderStore.getState();
    expect(restProviders).toHaveLength(4);
    expect(restProviders.map((p) => p.type)).toEqual([
      "anthropic",
      "openai",
      "google-ai",
      "ollama-api",
    ]);
  });

  it("initializes detecting as false", () => {
    expect(useAiProviderStore.getState().detecting).toBe(false);
  });

  // ── activateProvider ───────────────────────────────────────────────

  it("activates a CLI provider", () => {
    useAiProviderStore.getState().activateProvider("claude");
    expect(useAiProviderStore.getState().activeProvider).toBe("claude");
  });

  it("activates a REST provider", () => {
    useAiProviderStore.getState().activateProvider("openai");
    expect(useAiProviderStore.getState().activeProvider).toBe("openai");
  });

  it("can switch active provider", () => {
    useAiProviderStore.getState().activateProvider("claude");
    useAiProviderStore.getState().activateProvider("anthropic");
    expect(useAiProviderStore.getState().activeProvider).toBe("anthropic");
  });

  // ── updateRestProvider ──────────────────────────────────────────────

  it("updates an existing REST provider's apiKey", () => {
    useAiProviderStore.getState().updateRestProvider("anthropic", {
      apiKey: "sk-test-123",
    });
    const provider = useAiProviderStore
      .getState()
      .restProviders.find((p) => p.type === "anthropic");
    expect(provider?.apiKey).toBe("sk-test-123");
  });

  it("updates an existing REST provider's model", () => {
    useAiProviderStore.getState().updateRestProvider("openai", {
      model: "gpt-4-turbo",
    });
    const provider = useAiProviderStore
      .getState()
      .restProviders.find((p) => p.type === "openai");
    expect(provider?.model).toBe("gpt-4-turbo");
  });

  it("does not modify other providers when updating one", () => {
    const before = useAiProviderStore.getState().restProviders.find(
      (p) => p.type === "openai"
    );
    useAiProviderStore.getState().updateRestProvider("anthropic", {
      apiKey: "sk-new",
    });
    const after = useAiProviderStore.getState().restProviders.find(
      (p) => p.type === "openai"
    );
    expect(after).toEqual(before);
  });

  it("no-ops when updating a non-existent provider type", () => {
    const before = useAiProviderStore.getState().restProviders;
    useAiProviderStore.getState().updateRestProvider(
      "nonexistent" as never,
      { apiKey: "x" }
    );
    const after = useAiProviderStore.getState().restProviders;
    // Each provider should remain unchanged
    expect(after.map((p) => p.apiKey)).toEqual(before.map((p) => p.apiKey));
  });

  // ── getActiveProviderName ───────────────────────────────────────────

  it("returns 'None' when no provider is active", () => {
    expect(useAiProviderStore.getState().getActiveProviderName()).toBe("None");
  });

  it("returns CLI provider name when active", () => {
    useAiProviderStore.setState({
      activeProvider: "claude",
      cliProviders: [
        { type: "claude", name: "Claude Code", command: "claude", available: true },
      ],
    });
    expect(useAiProviderStore.getState().getActiveProviderName()).toBe(
      "Claude Code"
    );
  });

  it("returns REST provider name when active", () => {
    useAiProviderStore.setState({ activeProvider: "anthropic" });
    expect(useAiProviderStore.getState().getActiveProviderName()).toBe(
      "Anthropic"
    );
  });

  it("returns raw type string when provider not found in any list", () => {
    useAiProviderStore.setState({
      activeProvider: "unknown-provider" as never,
      cliProviders: [],
    });
    expect(useAiProviderStore.getState().getActiveProviderName()).toBe(
      "unknown-provider"
    );
  });

  // ── Exported constants ──────────────────────────────────────────────

  it("REST_TYPES contains expected types", () => {
    expect(REST_TYPES.has("anthropic")).toBe(true);
    expect(REST_TYPES.has("openai")).toBe(true);
    expect(REST_TYPES.has("google-ai")).toBe(true);
    expect(REST_TYPES.has("ollama-api")).toBe(true);
    expect(REST_TYPES.has("claude")).toBe(false);
  });

  it("KEY_OPTIONAL_REST contains only ollama-api", () => {
    expect(KEY_OPTIONAL_REST.has("ollama-api")).toBe(true);
    expect(KEY_OPTIONAL_REST.size).toBe(1);
  });

  // ── SSR guard ───────────────────────────────────────────────────────

  it("store is functional (SSR guard does not break initialization)", () => {
    const state = useAiProviderStore.getState();
    expect(state.activeProvider).toBeDefined();
    expect(typeof state.activateProvider).toBe("function");
    expect(typeof state.updateRestProvider).toBe("function");
    expect(typeof state.getActiveProviderName).toBe("function");
    expect(typeof state.detectProviders).toBe("function");
    expect(typeof state.ensureProvider).toBe("function");
    expect(typeof state.loadEnvApiKeys).toBe("function");
  });
});
