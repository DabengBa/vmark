#!/usr/bin/env -S node --import tsx
/**
 * AI Translation Script
 *
 * Translates i18n locale files using the Anthropic Claude API.
 *
 * Usage (JSON namespace files):
 *   npx tsx scripts/translate.ts --source src/locales/en --target src/locales/zh-CN --lang zh-CN
 *
 * Usage (YAML Rust locale file):
 *   npx tsx scripts/translate.ts --source src-tauri/locales/en.yml --target src-tauri/locales/zh-CN.yml --lang zh-CN --format yaml
 *
 * Options:
 *   --source <path>    Source directory (JSON) or file (YAML)
 *   --target <path>    Target directory (JSON) or file (YAML)
 *   --lang <code>      BCP-47 language code (e.g. zh-CN, ja, fr)
 *   --format yaml      Treat source/target as single YAML files (Rust locale)
 *   --dry-run          Show what would be translated without writing files
 *   --force            Translate even if target file already exists and is up-to-date
 *
 * Environment:
 *   ANTHROPIC_API_KEY  Required — your Anthropic API key
 *
 * The script is diff-aware: it computes a SHA-256 hash of the source content
 * and stores it in a sidecar file (.translate-hash) next to each translated
 * file.  On subsequent runs it skips files whose source hash has not changed
 * since the last successful translation.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CliArgs {
  source: string;
  target: string;
  lang: string;
  format: "json" | "yaml";
  dryRun: boolean;
  force: boolean;
}

interface TranslationResult {
  file: string;
  status: "translated" | "skipped" | "dry-run";
  reason?: string;
}

// ---------------------------------------------------------------------------
// Language name map
// ---------------------------------------------------------------------------

const LANGUAGE_NAMES: Record<string, string> = {
  "zh-CN": "Simplified Chinese (简体中文)",
  "zh-TW": "Traditional Chinese (繁體中文)",
  ja: "Japanese (日本語)",
  ko: "Korean (한국어)",
  es: "Spanish (Español)",
  fr: "French (Français)",
  de: "German (Deutsch)",
  it: "Italian (Italiano)",
  "pt-BR": "Brazilian Portuguese (Português do Brasil)",
  ru: "Russian (Русский)",
  ar: "Arabic (العربية)",
  nl: "Dutch (Nederlands)",
  pl: "Polish (Polski)",
  tr: "Turkish (Türkçe)",
  vi: "Vietnamese (Tiếng Việt)",
  th: "Thai (ภาษาไทย)",
};

function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

// ---------------------------------------------------------------------------
// Anthropic API (fetch-based — no SDK required)
// ---------------------------------------------------------------------------

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5"; // Reliable for structured JSON output

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY environment variable is not set.\n" +
      "Export it before running: export ANTHROPIC_API_KEY=sk-ant-..."
    );
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };

  const textBlock = data.content.find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error("Anthropic API returned no text content");
  }

  return textBlock.text.trim();
}

// ---------------------------------------------------------------------------
// JSON translation
// ---------------------------------------------------------------------------

function buildJsonSystemPrompt(lang: string): string {
  const langName = getLanguageName(lang);
  return [
    `You are an expert localizer for VMark — a desktop Markdown editor built with Tauri and React.`,
    ``,
    `Your task is to translate English UI strings into ${langName} (language code: ${lang}).`,
    ``,
    `Rules:`,
    `1. Preserve ALL {{variable}} placeholders exactly as-is (e.g. {{count}}, {{version}}, {{error}}).`,
    `2. Keep the JSON structure identical — same keys, same nesting.`,
    `3. Translate values only, never keys.`,
    `4. Keep translations concise — these are UI labels, not prose.`,
    `5. Use natural, idiomatic ${langName} appropriate for a desktop application.`,
    `6. Preserve any HTML entities (e.g. \\u2014, \\u2318) verbatim in the JSON string.`,
    `7. Do NOT add or remove any keys.`,
    `8. Output ONLY valid JSON — no markdown fences, no explanations, no trailing commas.`,
  ].join("\n");
}

async function translateJsonContent(
  sourceContent: string,
  lang: string
): Promise<string> {
  const systemPrompt = buildJsonSystemPrompt(lang);
  const userMessage = `Translate the following JSON locale file into ${getLanguageName(lang)}:\n\n${sourceContent}`;

  const result = await callClaude(systemPrompt, userMessage);

  // Strip markdown code fences if Claude wrapped the output
  let cleaned = result;
  const fenceMatch = result.match(/^```(?:json)?\s*\n([\s\S]*?)```\s*$/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Validate that the output is parseable JSON
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // Last resort: find the outermost JSON object in the response
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        JSON.parse(jsonMatch[0]);
        return jsonMatch[0];
      } catch {
        // fall through to error
      }
    }
    throw new Error(
      `Claude returned invalid JSON for ${lang}. Response was:\n${result.slice(0, 500)}`
    );
  }
}

// ---------------------------------------------------------------------------
// YAML translation
// ---------------------------------------------------------------------------

function buildYamlSystemPrompt(lang: string): string {
  const langName = getLanguageName(lang);
  return [
    `You are an expert localizer for VMark — a desktop Markdown editor built with Tauri and React.`,
    ``,
    `Your task is to translate English UI strings in a YAML locale file into ${langName} (language code: ${lang}).`,
    ``,
    `Rules:`,
    `1. Preserve ALL YAML keys exactly — only translate the string values.`,
    `2. Keep the YAML structure (indentation, comments) identical.`,
    `3. Preserve any Unicode escape sequences and special characters verbatim.`,
    `4. Use natural, idiomatic ${langName} appropriate for a desktop application menu.`,
    `5. Keep translations concise — these are menu item labels.`,
    `6. Output ONLY the translated YAML — no markdown fences, no explanations.`,
    `7. Preserve all YAML comments (# ...) exactly as they appear.`,
  ].join("\n");
}

async function translateYamlContent(
  sourceContent: string,
  lang: string
): Promise<string> {
  const systemPrompt = buildYamlSystemPrompt(lang);
  const userMessage = `Translate the following YAML locale file into ${getLanguageName(lang)}:\n\n${sourceContent}`;

  return await callClaude(systemPrompt, userMessage);
}

// ---------------------------------------------------------------------------
// Hash-based diff detection
// ---------------------------------------------------------------------------

function computeHash(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function getHashFilePath(targetFile: string): string {
  const dir = path.dirname(targetFile);
  const base = path.basename(targetFile);
  return path.join(dir, `.translate-hash-${base}.sha256`);
}

function readStoredHash(targetFile: string): string | null {
  const hashFile = getHashFilePath(targetFile);
  try {
    return fs.readFileSync(hashFile, "utf-8").trim();
  } catch {
    return null;
  }
}

function writeStoredHash(targetFile: string, hash: string): void {
  const hashFile = getHashFilePath(targetFile);
  fs.writeFileSync(hashFile, hash + "\n", "utf-8");
}

function isUpToDate(sourceHash: string, targetFile: string): boolean {
  if (!fs.existsSync(targetFile)) return false;
  const stored = readStoredHash(targetFile);
  return stored === sourceHash;
}

// ---------------------------------------------------------------------------
// JSON directory translation
// ---------------------------------------------------------------------------

async function translateJsonDirectory(args: CliArgs): Promise<TranslationResult[]> {
  const results: TranslationResult[] = [];

  if (!fs.existsSync(args.source)) {
    throw new Error(`Source directory not found: ${args.source}`);
  }

  // Ensure target directory exists
  if (!args.dryRun) {
    fs.mkdirSync(args.target, { recursive: true });
  }

  const files = fs.readdirSync(args.source).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.warn(`Warning: no JSON files found in ${args.source}`);
  }

  for (const file of files) {
    const sourceFile = path.join(args.source, file);
    const targetFile = path.join(args.target, file);
    const sourceContent = fs.readFileSync(sourceFile, "utf-8");
    const sourceHash = computeHash(sourceContent);

    if (!args.force && isUpToDate(sourceHash, targetFile)) {
      console.log(`  [skip]   ${file} — source unchanged`);
      results.push({ file, status: "skipped", reason: "source unchanged" });
      continue;
    }

    if (args.dryRun) {
      console.log(`  [dry-run] ${file} — would translate`);
      results.push({ file, status: "dry-run" });
      continue;
    }

    console.log(`  [translate] ${file}...`);
    const translated = await translateJsonContent(sourceContent, args.lang);

    // Pretty-print to match the 2-space indent style used in the source
    const parsed = JSON.parse(translated);
    const formatted = JSON.stringify(parsed, null, 2) + "\n";

    fs.writeFileSync(targetFile, formatted, "utf-8");
    writeStoredHash(targetFile, sourceHash);

    console.log(`  [done]   ${file}`);
    results.push({ file, status: "translated" });
  }

  return results;
}

// ---------------------------------------------------------------------------
// YAML file translation
// ---------------------------------------------------------------------------

async function translateYamlFile(args: CliArgs): Promise<TranslationResult[]> {
  const results: TranslationResult[] = [];
  const file = path.basename(args.source);

  if (!fs.existsSync(args.source)) {
    throw new Error(`Source file not found: ${args.source}`);
  }

  const sourceContent = fs.readFileSync(args.source, "utf-8");
  const sourceHash = computeHash(sourceContent);

  if (!args.force && isUpToDate(sourceHash, args.target)) {
    console.log(`  [skip]   ${file} — source unchanged`);
    return [{ file, status: "skipped", reason: "source unchanged" }];
  }

  if (args.dryRun) {
    console.log(`  [dry-run] ${file} — would translate`);
    return [{ file, status: "dry-run" }];
  }

  // Ensure target directory exists
  fs.mkdirSync(path.dirname(args.target), { recursive: true });

  console.log(`  [translate] ${file}...`);
  const translated = await translateYamlContent(sourceContent, args.lang);

  fs.writeFileSync(args.target, translated + "\n", "utf-8");
  writeStoredHash(args.target, sourceHash);

  console.log(`  [done]   ${file}`);
  results.push({ file, status: "translated" });

  return results;
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);

  function getArg(name: string): string | undefined {
    const idx = argv.indexOf(name);
    if (idx === -1) return undefined;
    return argv[idx + 1];
  }

  function hasFlag(name: string): boolean {
    return argv.includes(name);
  }

  const source = getArg("--source");
  const target = getArg("--target");
  const lang = getArg("--lang");

  if (!source) {
    throw new Error("Missing required argument: --source <path>");
  }
  if (!target) {
    throw new Error("Missing required argument: --target <path>");
  }
  if (!lang) {
    throw new Error("Missing required argument: --lang <code>");
  }

  const formatArg = getArg("--format");
  const format = formatArg === "yaml" ? "yaml" : "json";

  return {
    source,
    target,
    lang,
    format,
    dryRun: hasFlag("--dry-run"),
    force: hasFlag("--force"),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  let args: CliArgs;
  try {
    args = parseArgs();
  } catch (err) {
    console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
    console.error("");
    console.error("Usage:");
    console.error(
      "  npx tsx scripts/translate.ts --source src/locales/en --target src/locales/zh-CN --lang zh-CN"
    );
    console.error(
      "  npx tsx scripts/translate.ts --source src-tauri/locales/en.yml --target src-tauri/locales/zh-CN.yml --lang zh-CN --format yaml"
    );
    process.exit(1);
  }

  const langName = getLanguageName(args.lang);
  console.log(`\nVMark i18n Translation`);
  console.log(`  Language : ${args.lang} — ${langName}`);
  console.log(`  Source   : ${args.source}`);
  console.log(`  Target   : ${args.target}`);
  console.log(`  Format   : ${args.format}`);
  if (args.dryRun) console.log(`  Mode     : DRY RUN (no files will be written)`);
  if (args.force) console.log(`  Force    : yes (ignoring cached hashes)`);
  console.log("");

  try {
    let results: TranslationResult[];

    if (args.format === "yaml") {
      results = await translateYamlFile(args);
    } else {
      results = await translateJsonDirectory(args);
    }

    // Summary
    const translated = results.filter((r) => r.status === "translated").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const dryRun = results.filter((r) => r.status === "dry-run").length;

    console.log("");
    console.log(`Summary:`);
    if (translated > 0) console.log(`  Translated : ${translated} file(s)`);
    if (skipped > 0) console.log(`  Skipped    : ${skipped} file(s) (up-to-date)`);
    if (dryRun > 0) console.log(`  Would translate: ${dryRun} file(s)`);
  } catch (err) {
    console.error(`\nFailed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main();
