//! PDF Export
//!
//! Native PDF generation using WKWebView + Paged.js (macOS only).
//! The frontend sends fully rendered HTML (with Paged.js pagination)
//! and this module creates a PDF via WKWebView's createPDF API.

pub mod commands;
mod renderer;
