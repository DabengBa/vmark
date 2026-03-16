# Workspace Management

A workspace in VMark is a folder opened as the root of your project. When you open a workspace, the sidebar shows a file tree, Quick Open indexes every markdown file, the terminal starts in the project root, and your open tabs are remembered for next time.

Without a workspace you can still open individual files, but you lose the file explorer, in-project search, and session restore.

## Opening a Workspace

| Method | How |
|--------|-----|
| Menu | **File > Open Workspace** |
| Quick Open | `Mod + O`, then select **Browse...** at the bottom |
| Drag and drop | Drag a markdown file from Finder into the window — VMark detects its project root and opens the workspace automatically |
| Recent Workspaces | **File > Recent Workspaces** and pick a previous project |

When you open a workspace, VMark shows the sidebar with the file explorer. If the workspace was opened before, previously open tabs are restored.

::: tip
If the current window has unsaved changes, VMark offers to open the workspace in a new window instead of replacing your work.
:::

## File Explorer

The file explorer appears in the sidebar whenever a workspace is open. It shows a tree of markdown files rooted at the workspace folder.

### Navigation

- **Single-click** a folder to expand or collapse it
- **Double-click** or **Enter** on a file to open it in a tab
- Non-markdown files open with your system's default application

### File Operations

Right-click any file or folder to access the context menu:

| Action | Description |
|--------|-------------|
| Open | Open the file in a new tab |
| Rename | Edit the file or folder name inline (also `F2`) |
| Duplicate | Create a copy of the file |
| Move To... | Move the file to a different folder via a dialog |
| Delete | Move the file or folder to the system trash |
| Copy Path | Copy the absolute file path to the clipboard |
| Reveal in Finder | Show the file in Finder (macOS) |
| New File | Create a new markdown file in this location |
| New Folder | Create a new folder in this location |

You can also **drag and drop** files between folders directly in the tree.

### Visibility Toggles

By default the explorer shows only markdown files and hides dotfiles. Two toggles change this:

| Toggle | Shortcut | What it does |
|--------|----------|-------------|
| Show Hidden Files | `Mod + Shift + .` (macOS) / `Ctrl + H` (Win/Linux) | Reveals dotfiles and hidden folders |
| Show All Files | *(Settings or context menu)* | Shows non-markdown files alongside your documents |

Both settings are saved per-workspace and persist across sessions.

### Excluded Folders

Certain folders are excluded from the tree by default:

- `.git`
- `node_modules`

These defaults are applied when a workspace is first opened.

## Quick Open

Press `Mod + O` to open the Quick Open overlay. It provides fuzzy search across three sources:

1. **Recent files** you have opened before
2. **Open tabs** in the current window (marked with a dot indicator)
3. **All markdown files** in the workspace

Type a few characters to filter — matching is fuzzy, so `rme` finds `README.md`. Use arrow keys to navigate and **Enter** to open. A pinned **Browse...** row at the bottom opens a file dialog.

| Action | Shortcut |
|--------|----------|
| Open Quick Open | `Mod + O` |
| Navigate results | `Up / Down` |
| Open selected file | `Enter` |
| Close | `Escape` |

::: tip
Without a workspace, Quick Open still works — it shows recent files and open tabs but cannot search the file tree.
:::

## Recent Workspaces

VMark remembers up to 10 recently opened workspaces. Access them from **File > Recent Workspaces** in the menu bar.

- Workspaces are sorted by last-opened time (most recent first)
- The list syncs to the native menu on every change
- Choose **Clear Recent Workspaces** to reset the list

## Workspace Settings

Each workspace has its own configuration that persists between sessions. Settings are stored in the VMark application data directory — not inside the project folder — so your workspace stays clean.

The following settings are saved per workspace:

| Setting | Description |
|---------|-------------|
| Excluded folders | Folders hidden from the file explorer |
| Show hidden files | Whether dotfiles are visible |
| Show all files | Whether non-markdown files are visible |
| Last open tabs | File paths for session restore on next open |

::: tip
Workspace configuration is tied to the folder path. Opening the same folder on the same machine always restores your settings, even from a different window.
:::

## Session Restore

When you close a window that has a workspace open, VMark saves the list of open tabs to the workspace config. The next time you open the same workspace, those tabs are restored automatically.

- Only tabs with a saved file path are restored (untitled tabs are not persisted)
- If a file has been moved or deleted since the last session, it is silently skipped
- Session data is saved on window close and on workspace close (`File > Close Workspace`)

## Multi-Window

Each VMark window can have its own independent workspace. This lets you work on multiple projects simultaneously.

- **File > New Window** opens a fresh window
- Opening a workspace in a new window does not affect other windows
- Window size and position are remembered per window

When you drag a markdown file from Finder and the current window already has unsaved work, VMark opens the file's project in a new window automatically.

## Terminal Integration

The integrated terminal automatically uses the workspace root as its working directory. When you open or switch workspaces, all terminal sessions `cd` to the new root.

The `VMARK_WORKSPACE` environment variable is set to the workspace path in every terminal session, so your scripts can reference the project root.

[Learn more about the terminal →](/guide/terminal)
