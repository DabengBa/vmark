/**
 * PDF Export Content
 *
 * Settings panel (left) and live preview (right) for PDF export.
 * Uses Paged.js for paginated preview in an iframe. Preview is always
 * light/white theme. Dialog chrome respects user's theme.
 *
 * Rendered as a native Tauri window via PdfExportPage.tsx.
 *
 * @module export/PdfExportDialog
 * @coordinates-with pdfHtmlTemplate.ts — builds the HTML for preview and export
 * @coordinates-with pdf_export/commands.rs — Rust backend for final PDF generation
 * @coordinates-with PdfExportPage.tsx — page wrapper that hosts this component
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";

import { buildPdfHtml, type PdfOptions } from "./pdfHtmlTemplate";
import { captureThemeCSS } from "./themeSnapshot";
import { getEditorContentCSS } from "./htmlExportStyles";
import { useSettingsStore } from "@/stores/settingsStore";
import { FileText, Type, Layers } from "lucide-react";
import {
  SettingRow,
  Select,
  Toggle,
  Button,
} from "@/pages/settings/components";

import "./pdf-export-dialog.css";

/** Compact settings group with icon for PDF export sidebar */
function PdfSettingsGroup({
  icon,
  children,
}: {
  icon: React.ReactNode;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pdf-settings-group">
      <div className="pdf-settings-group-icon">{icon}</div>
      <div className="pdf-settings-group-items">{children}</div>
    </div>
  );
}

// --- Page dimensions (px at 96dpi) ---

const PAGE_DIMS: Record<string, { w: number; h: number }> = {
  a4: { w: 794, h: 1123 },       // 210mm × 297mm
  letter: { w: 816, h: 1056 },   // 8.5in × 11in
  a3: { w: 1123, h: 1587 },      // 297mm × 420mm
  legal: { w: 816, h: 1344 },    // 8.5in × 14in
};

function getPageDims(size: string, orientation: string): { w: number; h: number } {
  const dims = PAGE_DIMS[size] ?? PAGE_DIMS.a4;
  return orientation === "landscape" ? { w: dims.h, h: dims.w } : dims;
}

// --- Option definitions ---

const PAGE_SIZE_OPTIONS = [
  { value: "a4" as const, label: "A4" },
  { value: "letter" as const, label: "Letter" },
  { value: "a3" as const, label: "A3" },
  { value: "legal" as const, label: "Legal" },
];

const ORIENTATION_OPTIONS = [
  { value: "portrait" as const, label: "Portrait" },
  { value: "landscape" as const, label: "Landscape" },
];

const MARGIN_OPTIONS = [
  { value: "normal" as const, label: "Normal" },
  { value: "narrow" as const, label: "Narrow" },
  { value: "wide" as const, label: "Wide" },
];

const FONT_SIZE_OPTIONS = [
  { value: "10", label: "10pt" },
  { value: "11", label: "11pt" },
  { value: "12", label: "12pt" },
  { value: "13", label: "13pt" },
  { value: "14", label: "14pt" },
];

const LINE_HEIGHT_OPTIONS = [
  { value: "1.4", label: "1.4" },
  { value: "1.6", label: "1.6" },
  { value: "1.8", label: "1.8" },
  { value: "2.0", label: "2.0" },
];

const CJK_SPACING_OPTIONS = [
  { value: "0", label: "Off" },
  { value: "0.02", label: "0.02em" },
  { value: "0.05", label: "0.05em" },
  { value: "0.08", label: "0.08em" },
];

const LATIN_FONT_OPTIONS = [
  { value: "system", label: "System Default" },
  { value: "athelas", label: "Athelas" },
  { value: "palatino", label: "Palatino" },
  { value: "georgia", label: "Georgia" },
  { value: "charter", label: "Charter" },
];

const CJK_FONT_OPTIONS = [
  { value: "system", label: "System Default" },
  { value: "pingfang", label: "PingFang SC" },
  { value: "songti", label: "Songti SC" },
  { value: "kaiti", label: "Kaiti SC" },
  { value: "notoserif", label: "Noto Serif CJK" },
];

// --- Types ---

interface PdfExportContentProps {
  renderedHtml: string;
  defaultName?: string;
  onClose: () => void;
}

// --- Component ---

export function PdfExportContent({
  renderedHtml,
  defaultName,
  onClose,
}: PdfExportContentProps) {
  // Font choices inherited from user's editor settings
  const appearance = useSettingsStore.getState().appearance;

  const [options, setOptions] = useState<PdfOptions>({
    pageSize: "a4",
    orientation: "portrait",
    margins: "normal",
    showPageNumbers: true,
    showHeader: true,
    showFooter: false,
    title: defaultName?.replace(/\.[^.]+$/, "") ?? "Document",
    fontSize: 11,
    lineHeight: 1.6,
    cjkLetterSpacing: "0.05em",
    latinFont: appearance.latinFont,
    cjkFont: appearance.cjkFont,
  });

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [previewScale, setPreviewScale] = useState(0.5);

  // Compute scale to fit page into preview container
  const pageDims = getPageDims(options.pageSize, options.orientation);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      const padding = 32; // visual padding around the page
      const availW = rect.width - padding;
      const availH = rect.height - padding;
      if (availW <= 0 || availH <= 0) return;
      const scale = Math.min(availW / pageDims.w, availH / pageDims.h);
      setPreviewScale(Math.min(scale, 1)); // never upscale
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pageDims.w, pageDims.h]);

  // Capture theme CSS once (light theme values)
  const themeCSSRef = useRef(captureThemeCSS());
  const contentCSSRef = useRef(getEditorContentCSS());

  // Build HTML for the iframe
  const buildHtml = useCallback(() => {
    return buildPdfHtml(
      renderedHtml,
      themeCSSRef.current,
      contentCSSRef.current,
      options,
    );
  }, [renderedHtml, options]);

  // Update iframe on options change (debounced)
  useEffect(() => {
    setLoading(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      iframe.srcdoc = buildHtml();
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [buildHtml]);

  // Listen for Paged.js completion messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      // Validate sender is our preview iframe
      if (
        e.data?.type === "pagedjs-complete" &&
        e.source === iframeRef.current?.contentWindow
      ) {
        setLoading(false);
        setPreviewError(false);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Preview timeout — if Paged.js doesn't complete in 30s, show error
  const [previewError, setPreviewError] = useState(false);
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setPreviewError(true);
      }
    }, 30000);
    return () => clearTimeout(timer);
  }, [loading]);

  // Export to PDF
  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const outputPath = await save({
        defaultPath: `${options.title ?? "document"}.pdf`,
        title: "Export PDF",
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!outputPath) {
        setExporting(false);
        return;
      }

      const html = buildHtml();
      await invoke("export_pdf", { html, outputPath });
      toast.success("PDF exported successfully");
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`PDF export failed: ${msg}`);
      setExporting(false);
    }
  }, [buildHtml, options.title, onClose]);

  // Update a single option
  const set = useCallback(
    <K extends keyof PdfOptions>(key: K, value: PdfOptions[K]) => {
      setOptions((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return (
    <div className="pdf-export-body">
      {/* Settings sidebar — full height */}
      <div className="pdf-export-sidebar">
        {/* Drag region — outside scroll area so Tauri can intercept drag */}
        <div data-tauri-drag-region className="pdf-export-drag-region" />
        {/* Scrollable settings */}
        <div className="pdf-export-sidebar-content">
        <PdfSettingsGroup icon={<FileText className="w-3.5 h-3.5" />} title="Page">
          <SettingRow label="Size">
            <Select
              value={options.pageSize}
              options={PAGE_SIZE_OPTIONS}
              onChange={(v) => set("pageSize", v)}
            />
          </SettingRow>
          <SettingRow label="Orientation">
            <Select
              value={options.orientation}
              options={ORIENTATION_OPTIONS}
              onChange={(v) => set("orientation", v)}
            />
          </SettingRow>
          <SettingRow label="Margins">
            <Select
              value={options.margins}
              options={MARGIN_OPTIONS}
              onChange={(v) => set("margins", v)}
            />
          </SettingRow>
        </PdfSettingsGroup>

        <PdfSettingsGroup icon={<Type className="w-3.5 h-3.5" />} title="Typography">
          <SettingRow label="Font Size">
            <Select
              value={String(options.fontSize)}
              options={FONT_SIZE_OPTIONS}
              onChange={(v) => set("fontSize", Number(v))}
            />
          </SettingRow>
          <SettingRow label="Line Height">
            <Select
              value={String(options.lineHeight)}
              options={LINE_HEIGHT_OPTIONS}
              onChange={(v) => set("lineHeight", Number(v))}
            />
          </SettingRow>
          <SettingRow label="CJK Spacing">
            <Select
              value={options.cjkLetterSpacing.replace("em", "")}
              options={CJK_SPACING_OPTIONS}
              onChange={(v) =>
                set("cjkLetterSpacing", v === "0" ? "0" : `${v}em`)
              }
            />
          </SettingRow>
          <SettingRow label="Latin Font">
            <Select
              value={options.latinFont}
              options={LATIN_FONT_OPTIONS}
              onChange={(v) => set("latinFont", v)}
            />
          </SettingRow>
          <SettingRow label="CJK Font">
            <Select
              value={options.cjkFont}
              options={CJK_FONT_OPTIONS}
              onChange={(v) => set("cjkFont", v)}
            />
          </SettingRow>
        </PdfSettingsGroup>

        <PdfSettingsGroup icon={<Layers className="w-3.5 h-3.5" />} title="Elements">
          <SettingRow label="Page Numbers">
            <Toggle
              checked={options.showPageNumbers}
              onChange={(v) => set("showPageNumbers", v)}
            />
          </SettingRow>
          <SettingRow label="Header">
            <Toggle
              checked={options.showHeader}
              onChange={(v) => set("showHeader", v)}
            />
          </SettingRow>
          <SettingRow label="Date">
            <Toggle
              checked={options.showFooter}
              onChange={(v) => set("showFooter", v)}
            />
          </SettingRow>
        </PdfSettingsGroup>

        </div>{/* end .pdf-export-sidebar-content */}
      </div>

      {/* Preview — full height */}
      <div className="pdf-export-preview-wrapper">
        {/* Drag region — outside overflow area so Tauri can intercept drag */}
        <div data-tauri-drag-region className="pdf-export-drag-region" />
        {/* Preview content */}
        <div className="pdf-export-preview" ref={previewContainerRef}>
        {loading && (
          <div className="pdf-export-preview-loading">
            Rendering preview...
          </div>
        )}
        {previewError && (
          <div className="pdf-export-preview-loading">
            Preview failed to render. You can still export.
          </div>
        )}
        {/* Scaled container — sized to the visual (scaled) dimensions
             so the layout doesn't overflow. The inner frame stays at full
             page resolution for crisp rendering. */}
        <div
          className="pdf-export-page-sizer"
          style={{
            width: pageDims.w * previewScale,
            height: pageDims.h * previewScale,
          }}
        >
          <div
            className="pdf-export-page-frame"
            style={{
              width: pageDims.w,
              height: pageDims.h,
              transform: `scale(${previewScale})`,
            }}
          >
            <iframe
              ref={iframeRef}
              title="PDF Preview"
              sandbox="allow-scripts"
            />
          </div>
        </div>
        </div>{/* end .pdf-export-preview */}
        {/* Export action */}
        <div className="pdf-export-action-bar">
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
      </div>{/* end .pdf-export-preview-wrapper */}
    </div>
  );
}
