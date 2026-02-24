//! Tauri commands for PDF export.

use super::renderer;
use std::path::Path;

/// Export HTML content to a PDF file using WKWebView.
///
/// The HTML should include Paged.js for pagination. The renderer
/// loads it in an off-screen WKWebView, waits for Paged.js to
/// finish pagination, then uses createPDF to generate the PDF.
#[tauri::command]
pub async fn export_pdf(html: String, output_path: String) -> Result<(), String> {
    // Validate output path
    let path = Path::new(&output_path);

    // Must have .pdf extension
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    if !ext.eq_ignore_ascii_case("pdf") {
        return Err("Output path must have .pdf extension".to_string());
    }

    // Parent directory must exist
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            return Err("Output directory does not exist".to_string());
        }
    }

    renderer::render_pdf(html, output_path).await
}
