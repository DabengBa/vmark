/**
 * AI Genies Types
 *
 * Core types for the AI genies system — genie definitions,
 * provider configuration, and streaming response chunks.
 */

// ============================================================================
// Genie Types
// ============================================================================

export type GenieScope = "selection" | "block" | "document";

export interface GenieMetadata {
  name: string;
  description: string;
  scope: GenieScope;
  category?: string;
  icon?: string;
  model?: string;
}

export interface GenieDefinition {
  metadata: GenieMetadata;
  template: string;
  filePath: string;
  source: "global";
}

// ============================================================================
// Provider Types
// ============================================================================

export type CliProviderType = "claude" | "codex" | "gemini" | "ollama";
export type RestProviderType = "anthropic" | "openai" | "google-ai" | "ollama-api";
export type ProviderType = CliProviderType | RestProviderType;

export interface CliProviderInfo {
  type: CliProviderType;
  name: string;
  command: string;
  available: boolean;
  path?: string;
}

export interface RestProviderConfig {
  type: RestProviderType;
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
  enabled: boolean;
}

// ============================================================================
// Streaming Response
// ============================================================================

export interface AiResponseChunk {
  requestId: string;
  chunk: string;
  done: boolean;
  error?: string;
}
