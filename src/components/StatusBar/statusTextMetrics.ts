import { countWords as alfaazCount } from "alfaaz";

/** Strip markdown formatting to get plain text for word counting. */
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*_]{3,}\s*$/gm, "")
    .replace(/^[\s]*[-*+]\s+/gm, "")
    .replace(/^[\s]*\d+\.\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Count words using alfaaz (handles CJK and other languages). */
export function countWordsFromPlain(plainText: string): number {
  return alfaazCount(plainText);
}

/** Count non-whitespace characters. */
export function countCharsFromPlain(plainText: string): number {
  return plainText.replace(/\s/g, "").length;
}
