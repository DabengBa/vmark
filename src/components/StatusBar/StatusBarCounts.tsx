/**
 * StatusBarCounts
 *
 * Purpose: Isolated component that subscribes to document content and computes
 * word/character counts, preventing the parent StatusBar from re-rendering
 * on every keystroke.
 *
 * Key decisions:
 *   - Owns the useDocumentContent() subscription so StatusBar doesn't re-render
 *   - Uses memo + useMemo pipeline: content → stripMarkdown → count
 *   - Renders two <span> elements inline within StatusBarRight
 *
 * @coordinates-with StatusBar.tsx — no longer subscribes to document content
 * @coordinates-with StatusBarRight.tsx — renders this component for counts
 * @module components/StatusBar/StatusBarCounts
 */

import { memo, useDeferredValue, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDocumentContent } from "@/hooks/useDocumentState";
import { countCharsFromPlain, countWordsFromPlain, stripMarkdown } from "./statusTextMetrics";

/** Isolated component computing and displaying word/character counts to avoid parent re-renders. */
export const StatusBarCounts = memo(function StatusBarCounts() {
  const { t } = useTranslation("statusbar");
  const content = useDocumentContent();
  const deferredContent = useDeferredValue(content);
  const strippedContent = useMemo(() => stripMarkdown(deferredContent), [deferredContent]);
  const wordCount = useMemo(() => countWordsFromPlain(strippedContent), [strippedContent]);
  const charCount = useMemo(() => countCharsFromPlain(strippedContent), [strippedContent]);

  return (
    <>
      <span className="status-item">{t("words", { count: wordCount })}</span>
      <span className="status-item">{t("chars", { count: charCount })}</span>
    </>
  );
});
