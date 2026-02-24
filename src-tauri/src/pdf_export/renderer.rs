//! Off-screen WKWebView PDF renderer (macOS only).
//!
//! Flow:
//! 1. Dispatch to main thread (WKWebView requirement)
//! 2. Create WKWebView + load HTML
//! 3. Poll document.title for "PAGEDJS_COMPLETE:N" (set by Paged.js handler)
//! 4. createPDF → NSData → write to file

use objc2::rc::Retained;
use objc2::MainThreadOnly;
use objc2_foundation::NSString;
use std::sync::{Arc, Mutex};
use tokio::sync::oneshot;

/// Render HTML to PDF via off-screen WKWebView.
///
/// The HTML must contain a Paged.js completion handler that sets
/// `document.title` to `"PAGEDJS_COMPLETE:<pageCount>"` when done.
pub async fn render_pdf(html: String, output_path: String) -> Result<(), String> {
    let (tx, rx) = oneshot::channel::<Result<(), String>>();
    let tx = Arc::new(Mutex::new(Some(tx)));

    let tx_clone = tx.clone();
    // WKWebView must be created and used on the main thread
    dispatch2::Queue::main().exec_async(move || {
        let result = render_pdf_on_main_thread(&html, &output_path);
        if let Some(sender) = tx_clone.lock().unwrap().take() {
            let _ = sender.send(result);
        }
    });

    rx.await.map_err(|_| "PDF render channel closed".to_string())?
}

/// Main-thread PDF rendering logic.
fn render_pdf_on_main_thread(html: &str, output_path: &str) -> Result<(), String> {
    use objc2::MainThreadMarker;
    use objc2_core_foundation::CGRect;
    use objc2_web_kit::{WKWebView, WKWebViewConfiguration};

    let mtm = MainThreadMarker::new()
        .ok_or("PDF export must run on the main thread")?;

    // Create configuration and webview
    let config = unsafe { WKWebViewConfiguration::new(mtm) };
    let frame = CGRect::new(
        objc2_core_foundation::CGPoint::new(0.0, 0.0),
        objc2_core_foundation::CGSize::new(800.0, 600.0),
    );
    let webview = unsafe {
        WKWebView::initWithFrame_configuration(WKWebView::alloc(mtm), frame, &config)
    };

    // Load HTML
    let html_ns = NSString::from_str(html);
    unsafe { webview.loadHTMLString_baseURL(&html_ns, None) };

    // Poll for Paged.js completion via document.title
    let max_polls = 150; // 30 seconds at 200ms intervals
    let mut completed = false;

    for _ in 0..max_polls {
        run_loop_tick(0.2);

        match eval_js_sync(&webview, "document.title") {
            Some(title) if title.starts_with("PAGEDJS_COMPLETE:") => {
                completed = true;
                break;
            }
            _ => continue,
        }
    }

    if !completed {
        return Err("Paged.js pagination timeout (30s)".to_string());
    }

    // Create PDF
    create_pdf_sync(&webview, output_path)
}

/// Evaluate JavaScript synchronously by spinning the run loop.
fn eval_js_sync(
    webview: &objc2_web_kit::WKWebView,
    script: &str,
) -> Option<String> {
    let result: Arc<Mutex<Option<Option<String>>>> = Arc::new(Mutex::new(None));
    let result_clone = result.clone();

    let script_ns = NSString::from_str(script);
    let block = block2::RcBlock::new(
        move |value: *mut objc2::runtime::AnyObject,
              _error: *mut objc2_foundation::NSError| {
            let val = if !value.is_null() {
                let s: String = unsafe {
                    let desc: Retained<NSString> = objc2::msg_send![&*value, description];
                    desc.to_string()
                };
                Some(s)
            } else {
                None
            };
            *result_clone.lock().unwrap() = Some(val);
        },
    );

    unsafe {
        webview.evaluateJavaScript_completionHandler(&script_ns, Some(&block));
    }

    // Spin run loop until result arrives (up to 5s)
    for _ in 0..500 {
        run_loop_tick(0.01);
        if result.lock().unwrap().is_some() {
            break;
        }
    }

    let val = result.lock().unwrap().take().flatten();
    val
}

/// Create PDF synchronously by spinning the run loop.
fn create_pdf_sync(
    webview: &objc2_web_kit::WKWebView,
    output_path: &str,
) -> Result<(), String> {
    let result: Arc<Mutex<Option<Result<Vec<u8>, String>>>> = Arc::new(Mutex::new(None));
    let result_clone = result.clone();

    let block = block2::RcBlock::new(
        move |data: *mut objc2_foundation::NSData,
              error: *mut objc2_foundation::NSError| {
            let val = if !error.is_null() {
                let err_str = unsafe {
                    let desc: Retained<NSString> =
                        objc2::msg_send![&*error, localizedDescription];
                    desc.to_string()
                };
                Err(format!("createPDF failed: {}", err_str))
            } else if data.is_null() {
                Err("createPDF returned null data".to_string())
            } else {
                let bytes = unsafe { &*data }.to_vec();
                Ok(bytes)
            };
            *result_clone.lock().unwrap() = Some(val);
        },
    );

    unsafe {
        webview.createPDFWithConfiguration_completionHandler(None, &block);
    }

    // Spin run loop until result arrives (up to 60s for large docs)
    for _ in 0..1200 {
        run_loop_tick(0.05);
        if result.lock().unwrap().is_some() {
            break;
        }
    }

    let pdf_bytes = result
        .lock()
        .unwrap()
        .take()
        .ok_or_else(|| "createPDF timeout".to_string())??;

    std::fs::write(output_path, &pdf_bytes)
        .map_err(|e| format!("Failed to write PDF: {}", e))
}

/// Tick the main run loop for the given duration (seconds).
///
/// Uses CFRunLoopRunInMode with default mode to allow WKWebView to process
/// events (loading HTML, running JS, rendering Paged.js pagination).
fn run_loop_tick(seconds: f64) {
    use objc2_core_foundation::CFRunLoop;

    unsafe {
        CFRunLoop::run_in_mode(
            objc2_core_foundation::kCFRunLoopDefaultMode,
            seconds,
            false,
        );
    }
}
