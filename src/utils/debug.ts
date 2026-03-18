/**
 * Debug Logging Utilities
 *
 * Purpose: Conditional logging with two tiers:
 *   - Debug loggers (console.log/debug): dev-only, tree-shaken in production
 *   - Warn/error loggers: active in BOTH dev and production — writes to
 *     tauri-plugin-log file + console so users can submit log files with bug reports
 *
 * In production, warn/error calls are forwarded to @tauri-apps/plugin-log
 * which writes to ~/Library/Logs/app.vmark/ (macOS). The Tauri log plugin
 * must be initialized before these fire (it is — registered first in lib.rs).
 *
 * @coordinates-with @tauri-apps/plugin-log — production warn/error sink
 * @module utils/debug
 */

const isDev = import.meta.env.DEV;

// Production warn/error: forward to tauri-plugin-log for file persistence.
// Lazy-loaded to avoid blocking startup; falls back to console if unavailable.
let _tauriWarn: ((...args: unknown[]) => void) | null = null;
let _tauriError: ((...args: unknown[]) => void) | null = null;

if (!isDev) {
  import("@tauri-apps/plugin-log").then(({ warn, error }) => {
    _tauriWarn = (...args: unknown[]) => warn(args.map(String).join(" "));
    _tauriError = (...args: unknown[]) => error(args.map(String).join(" "));
  }).catch(() => {
    // Plugin not available (e.g., unit tests) — silent fallback
  });
}

/** Warn logger that persists to file in production. */
function prodWarn(tag: string, ...args: unknown[]) {
  if (isDev) {
    console.warn(tag, ...args);
  } else if (_tauriWarn) {
    _tauriWarn(tag, ...args);
  }
}

/** Error logger that persists to file in production. */
function prodError(tag: string, ...args: unknown[]) {
  if (isDev) {
    console.error(tag, ...args);
  } else if (_tauriError) {
    _tauriError(tag, ...args);
  }
}

/**
 * Debug logger for History operations.
 * Only logs in development mode.
 */
export const historyLog = isDev
  ? (...args: unknown[]) => console.log("[History]", ...args)
  : () => {};

/**
 * Debug logger for AutoSave operations.
 * Only logs in development mode.
 */
export const autoSaveLog = isDev
  ? (...args: unknown[]) => console.log("[AutoSave]", ...args)
  : () => {};

/**
 * Debug logger for Terminal operations (IME composition, PTY events).
 * Only logs in development mode.
 */
export const terminalLog = isDev
  ? (...args: unknown[]) => console.log("[Terminal]", ...args)
  : () => {};

/**
 * Debug logger for Crash Recovery operations.
 * Only logs in development mode.
 */
export const crashRecoveryLog = isDev
  ? (...args: unknown[]) => console.log("[CrashRecovery]", ...args)
  : () => {};

/**
 * Debug logger for Hot Exit operations (capture, restore, restart).
 * Only logs in development mode.
 */
export const hotExitLog = isDev
  ? (...args: unknown[]) => console.log("[HotExit]", ...args)
  : () => {};

/**
 * Debug logger for Hot Exit warnings.
 * Only logs in development mode.
 */
export const hotExitWarn = isDev
  ? (...args: unknown[]) => console.warn("[HotExit]", ...args)
  : (...args: unknown[]) => prodWarn("[HotExit]", ...args);

/**
 * Debug logger for File Operations (open, save, save-as, move).
 * Only logs in development mode.
 */
export const fileOpsLog = isDev
  ? (...args: unknown[]) => console.log("[FileOps]", ...args)
  : () => {};

/**
 * Debug logger for File Operations warnings.
 * Only logs in development mode.
 */
export const fileOpsWarn = isDev
  ? (...args: unknown[]) => console.warn("[FileOps]", ...args)
  : (...args: unknown[]) => prodWarn("[FileOps]", ...args);

/**
 * Debug logger for MCP Auto-Start operations.
 * Only logs in development mode.
 */
export const mcpAutoStartLog = isDev
  ? (...args: unknown[]) => console.log("[MCP]", ...args)
  : () => {};

/**
 * Debug logger for Update Checker operations.
 * Only logs in development mode.
 */
export const updateCheckerLog = isDev
  ? (...args: unknown[]) => console.log("[UpdateChecker]", ...args)
  : () => {};

/**
 * Debug logger for AI Provider operations.
 * Only logs in development mode.
 */
export const aiProviderLog = isDev
  ? (...args: unknown[]) => console.log("[AIProvider]", ...args)
  : () => {};

/**
 * Debug logger for AI Provider warnings.
 * Only logs in development mode.
 */
export const aiProviderWarn = isDev
  ? (...args: unknown[]) => console.warn("[AIProvider]", ...args)
  : (...args: unknown[]) => prodWarn("[AIProvider]", ...args);

/**
 * Debug logger for Genies store operations.
 * Only logs in development mode.
 */
export const geniesLog = isDev
  ? (...args: unknown[]) => console.log("[Genies]", ...args)
  : () => {};

/**
 * Debug logger for Genies warnings.
 * Only logs in development mode.
 */
export const geniesWarn = isDev
  ? (...args: unknown[]) => console.warn("[Genies]", ...args)
  : (...args: unknown[]) => prodWarn("[Genies]", ...args);

/**
 * Debug logger for Recent Files/Workspaces warnings.
 * Only logs in development mode.
 */
export const recentWarn = isDev
  ? (...args: unknown[]) => console.warn("[Recent]", ...args)
  : (...args: unknown[]) => prodWarn("[Recent]", ...args);

/**
 * Debug logger for Shortcuts store warnings.
 * Only logs in development mode.
 */
export const shortcutsWarn = isDev
  ? (...args: unknown[]) => console.warn("[Shortcuts]", ...args)
  : (...args: unknown[]) => prodWarn("[Shortcuts]", ...args);

/**
 * Debug logger for Image Handler operations.
 * Only logs in development mode.
 */
export const imageHandlerWarn = isDev
  ? (...args: unknown[]) => console.warn("[imageHandler]", ...args)
  : (...args: unknown[]) => prodWarn("[imageHandler]", ...args);

/**
 * Debug logger for Smart Paste operations.
 * Only logs in development mode.
 */
export const smartPasteWarn = isDev
  ? (...args: unknown[]) => console.warn("[smartPaste]", ...args)
  : (...args: unknown[]) => prodWarn("[smartPaste]", ...args);

/**
 * Debug logger for Footnote Popup warnings.
 * Only logs in development mode.
 */
export const footnotePopupWarn = isDev
  ? (...args: unknown[]) => console.warn("[FootnotePopup]", ...args)
  : (...args: unknown[]) => prodWarn("[FootnotePopup]", ...args);


/**
 * Debug logger for Media Popup warnings.
 * Only logs in development mode.
 */
export const mediaPopupWarn = isDev
  ? (...args: unknown[]) => console.warn("[MediaPopup]", ...args)
  : (...args: unknown[]) => prodWarn("[MediaPopup]", ...args);

/**
 * Debug logger for WYSIWYG Adapter warnings.
 * Only logs in development mode.
 */
export const wysiwygAdapterWarn = isDev
  ? (...args: unknown[]) => console.warn("[wysiwygAdapter]", ...args)
  : (...args: unknown[]) => prodWarn("[wysiwygAdapter]", ...args);

/**
 * Debug logger for Mermaid/Markmap/SVG diagram warnings.
 * Only logs in development mode.
 */
export const diagramWarn = isDev
  ? (...args: unknown[]) => console.warn("[Diagram]", ...args)
  : (...args: unknown[]) => prodWarn("[Diagram]", ...args);

/**
 * Debug logger for HTML/Markdown paste warnings.
 * Only logs in development mode.
 */
export const pasteWarn = isDev
  ? (...args: unknown[]) => console.warn("[Paste]", ...args)
  : (...args: unknown[]) => prodWarn("[Paste]", ...args);

/**
 * Debug logger for Image View security warnings.
 * Only logs in development mode.
 */
export const imageViewWarn = isDev
  ? (...args: unknown[]) => console.warn("[ImageView]", ...args)
  : (...args: unknown[]) => prodWarn("[ImageView]", ...args);

/**
 * Debug logger for Source mode popup warnings.
 * Only logs in development mode.
 */
export const sourcePopupWarn = isDev
  ? (...args: unknown[]) => console.warn("[SourcePopup]", ...args)
  : (...args: unknown[]) => prodWarn("[SourcePopup]", ...args);

/**
 * Debug logger for Action Registry warnings.
 * Only logs in development mode.
 */
export const actionRegistryWarn = isDev
  ? (...args: unknown[]) => console.warn("[ActionRegistry]", ...args)
  : (...args: unknown[]) => prodWarn("[ActionRegistry]", ...args);

/**
 * Debug logger for Markdown Copy warnings.
 * Only logs in development mode.
 */
export const markdownCopyWarn = isDev
  ? (...args: unknown[]) => console.warn("[markdownCopy]", ...args)
  : (...args: unknown[]) => prodWarn("[markdownCopy]", ...args);

/**
 * Debug logger for Wiki Link Popup warnings.
 * Only logs in development mode.
 */
export const wikiLinkPopupWarn = isDev
  ? (...args: unknown[]) => console.warn("[WikiLinkPopup]", ...args)
  : (...args: unknown[]) => prodWarn("[WikiLinkPopup]", ...args);

/** Debug logger for History warnings. */
export const historyWarn = isDev
  ? (...args: unknown[]) => console.warn("[History]", ...args)
  : (...args: unknown[]) => prodWarn("[History]", ...args);

/** Debug logger for Window Close operations. */
export const windowCloseLog = isDev
  ? (...args: unknown[]) => console.log("[WindowClose]", ...args)
  : () => {};

/** Debug logger for Window Close warnings. */
export const windowCloseWarn = isDev
  ? (...args: unknown[]) => console.warn("[WindowClose]", ...args)
  : (...args: unknown[]) => prodWarn("[WindowClose]", ...args);

/** Debug logger for Unified Menu Dispatcher operations. */
export const menuDispatcherLog = isDev
  ? (...args: unknown[]) => console.debug("[UnifiedMenuDispatcher]", ...args)
  : () => {};

/** Debug logger for Unified Menu Dispatcher warnings. */
export const menuDispatcherWarn = isDev
  ? (...args: unknown[]) => console.warn("[UnifiedMenuDispatcher]", ...args)
  : (...args: unknown[]) => prodWarn("[UnifiedMenuDispatcher]", ...args);

/** Debug logger for File Watcher warnings. */
export const watcherWarn = isDev
  ? (...args: unknown[]) => console.warn("[Watcher]", ...args)
  : (...args: unknown[]) => prodWarn("[Watcher]", ...args);

/** Debug logger for Export warnings. */
export const exportWarn = isDev
  ? (...args: unknown[]) => console.warn("[Export]", ...args)
  : (...args: unknown[]) => prodWarn("[Export]", ...args);

/** Debug logger for MCP Bridge operations. */
export const mcpBridgeLog = isDev
  ? (...args: unknown[]) => console.debug("[MCP Bridge]", ...args)
  : () => {};

/** Debug logger for Markdown Pipeline warnings. */
export const mdPipelineWarn = isDev
  ? (...args: unknown[]) => console.warn("[MarkdownPipeline]", ...args)
  : (...args: unknown[]) => prodWarn("[MarkdownPipeline]", ...args);

/** Debug logger for Workspace warnings. */
export const workspaceWarn = isDev
  ? (...args: unknown[]) => console.warn("[Workspace]", ...args)
  : (...args: unknown[]) => prodWarn("[Workspace]", ...args);

/** Debug logger for Title Bar warnings. */
export const titleBarWarn = isDev
  ? (...args: unknown[]) => console.warn("[TitleBar]", ...args)
  : (...args: unknown[]) => prodWarn("[TitleBar]", ...args);

/** Debug logger for Genie (AI inline) warnings. */
export const genieWarn = isDev
  ? (...args: unknown[]) => console.warn("[Genie]", ...args)
  : (...args: unknown[]) => prodWarn("[Genie]", ...args);

/** Debug logger for Image Context Menu warnings. */
export const imageContextMenuWarn = isDev
  ? (...args: unknown[]) => console.warn("[ImageContextMenu]", ...args)
  : (...args: unknown[]) => prodWarn("[ImageContextMenu]", ...args);

/** Debug logger for Orphan Image Cleanup warnings. */
export const orphanCleanupWarn = isDev
  ? (...args: unknown[]) => console.warn("[OrphanCleanup]", ...args)
  : (...args: unknown[]) => prodWarn("[OrphanCleanup]", ...args);

/** Debug logger for Confirm Quit warnings. */
export const confirmQuitWarn = isDev
  ? (...args: unknown[]) => console.warn("[ConfirmQuit]", ...args)
  : (...args: unknown[]) => prodWarn("[ConfirmQuit]", ...args);

/** Debug logger for Finder File Open warnings. */
export const finderFileOpenWarn = isDev
  ? (...args: unknown[]) => console.warn("[FinderFileOpen]", ...args)
  : (...args: unknown[]) => prodWarn("[FinderFileOpen]", ...args);

/** Debug logger for Image Hash Registry warnings. */
export const imageHashWarn = isDev
  ? (...args: unknown[]) => console.warn("[ImageHashRegistry]", ...args)
  : (...args: unknown[]) => prodWarn("[ImageHashRegistry]", ...args);

/** Debug logger for Image Resize operations. */
export const imageResizeLog = isDev
  ? (...args: unknown[]) => console.log("[ImageResize]", ...args)
  : () => {};

/** Debug logger for Workspace Storage warnings. */
export const workspaceStorageWarn = isDev
  ? (...args: unknown[]) => console.warn("[WorkspaceStorage]", ...args)
  : (...args: unknown[]) => prodWarn("[WorkspaceStorage]", ...args);

/** Debug logger for Clipboard warnings. */
export const clipboardWarn = isDev
  ? (...args: unknown[]) => console.warn("[Clipboard]", ...args)
  : (...args: unknown[]) => prodWarn("[Clipboard]", ...args);

/** Debug logger for Render warnings. */
export const renderWarn = isDev
  ? (...args: unknown[]) => console.warn("[Render]", ...args)
  : (...args: unknown[]) => prodWarn("[Render]", ...args);

/** Debug logger for Cleanup warnings. */
export const cleanupWarn = isDev
  ? (...args: unknown[]) => console.warn("[Cleanup]", ...args)
  : (...args: unknown[]) => prodWarn("[Cleanup]", ...args);

/** Debug logger for Status Bar warnings. */
export const statusBarWarn = isDev
  ? (...args: unknown[]) => console.warn("[StatusBar]", ...args)
  : (...args: unknown[]) => prodWarn("[StatusBar]", ...args);

/** Debug logger for List Click Fix warnings. */
export const listClickFixLog = isDev
  ? (...args: unknown[]) => console.warn("[ListClickFix]", ...args)
  : (...args: unknown[]) => prodWarn("[ListClickFix]", ...args);

/** Debug logger for Window Context errors. */
export const windowContextError = isDev
  ? (...args: unknown[]) => console.error("[WindowContext]", ...args)
  : (...args: unknown[]) => prodError("[WindowContext]", ...args);

/** Debug logger for Source Link errors. */
export const sourceLinkError = isDev
  ? (...args: unknown[]) => console.error("[SourceLink]", ...args)
  : (...args: unknown[]) => prodError("[SourceLink]", ...args);

/** Debug logger for Resolve Media errors. */
export const resolveMediaError = isDev
  ? (...args: unknown[]) => console.error("[ResolveMedia]", ...args)
  : (...args: unknown[]) => prodError("[ResolveMedia]", ...args);

/** Debug logger for Source Peek errors. */
export const sourcePeekError = isDev
  ? (...args: unknown[]) => console.error("[SourcePeek]", ...args)
  : (...args: unknown[]) => prodError("[SourcePeek]", ...args);

/** Debug logger for Save errors. */
export const saveError = isDev
  ? (...args: unknown[]) => console.error("[Save]", ...args)
  : (...args: unknown[]) => prodError("[Save]", ...args);

/** Debug logger for Table Actions errors. */
export const tableActionsError = isDev
  ? (...args: unknown[]) => console.error("[TableActions]", ...args)
  : (...args: unknown[]) => prodError("[TableActions]", ...args);

/** Debug logger for Image Hash Registry errors. */
export const imageHashError = isDev
  ? (...args: unknown[]) => console.error("[ImageHashRegistry]", ...args)
  : (...args: unknown[]) => prodError("[ImageHashRegistry]", ...args);

/** Debug logger for WYSIWYG Adapter errors. */
export const wysiwygAdapterError = isDev
  ? (...args: unknown[]) => console.error("[wysiwygAdapter]", ...args)
  : (...args: unknown[]) => prodError("[wysiwygAdapter]", ...args);

