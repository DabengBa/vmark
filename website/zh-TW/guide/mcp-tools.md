# MCP 工具參考

本頁記錄 Claude（或其他 AI 助理）連接 VMark 時可用的所有 MCP 工具。

VMark 公開一組 **複合工具**、**協定工具** 和 **資源** — 均記錄於下方。複合工具使用 `action` 參數來選取操作 — 這在減少 Token 開銷的同時保持所有功能的可存取性。

::: tip 建議工作流程
對於大多數寫作任務，你只需要少數幾個操作：

**了解：** `structure` → `get_digest`，`document` → `search`
**讀取：** `structure` → `get_section`，`document` → `read_paragraph` / `get_content`
**寫入：** `structure` → `update_section` / `insert_section`，`document` → `write_paragraph` / `smart_insert`
**控制：** `editor` → `undo` / `redo`，`suggestions` → `accept` / `reject`
**檔案：** `workspace` → `save`，`tabs` → `switch` / `list`

其餘操作提供進階自動化情境的精細控制。
:::

::: tip Mermaid 圖表
透過 MCP 使用 AI 生成 Mermaid 圖表時，建議安裝 [mermaid-validator MCP 伺服器](/zh-TW/guide/mermaid#mermaid-validator-mcp-server-syntax-checking) — 它在圖表到達你的文件之前，使用相同的 Mermaid v11 解析器捕捉語法錯誤。
:::

---

## `document`

讀取、寫入、搜尋和轉換文件內容。12 個操作。

所有操作接受可選的 `windowId`（字串）參數以鎖定特定視窗。預設為聚焦的視窗。

### `get_content`

以 Markdown 文字形式取得完整文件內容。

### `set_content`

取代整份文件內容。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `content` | string | 是 | 新文件內容（支援 Markdown）。 |

::: warning 僅限空白文件
為安全起見，此操作只在目標文件 **為空** 時允許使用。對於非空文件，請改用 `insert_at_cursor`、`apply_diff` 或 `selection` → `replace` — 這些會建立需要使用者核准的建議。
:::

### `insert_at_cursor`

在目前游標位置插入文字。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `text` | string | 是 | 要插入的文字（支援 Markdown）。 |

**返回：** `{ message, position, suggestionId?, applied }`

::: tip 建議系統
預設情況下，此操作建立一個需要使用者核准的 **建議**。文字以幽靈文字預覽顯示。使用者可以接受（Enter）或拒絕（Escape）。若設定 → 整合中啟用了 **自動核准編輯**，變更會立即套用。
:::

### `insert_at_position`

在特定字元位置插入文字。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `text` | string | 是 | 要插入的文字（支援 Markdown）。 |
| `position` | number | 是 | 字元位置（從 0 開始計算）。 |

**返回：** `{ message, position, suggestionId?, applied }`

### `search`

在文件中搜尋文字。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `query` | string | 是 | 要搜尋的文字。 |
| `caseSensitive` | boolean | 否 | 區分大小寫搜尋。預設：false。 |

**返回：** 帶有位置和行號的符合項目陣列。

### `replace_in_source`

在 Markdown 原始碼層級取代文字，略過 ProseMirror 節點邊界。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `search` | string | 是 | 要在 Markdown 原始碼中搜尋的文字。 |
| `replace` | string | 是 | 替換文字（支援 Markdown）。 |
| `all` | boolean | 否 | 取代所有符合項目。預設：false。 |

**返回：** `{ count, message, suggestionIds?, applied }`

::: tip 使用時機
優先使用 `apply_diff` — 它更快且更精確。只有當搜尋文字跨越格式邊界（粗體、斜體、連結等）且 `apply_diff` 找不到時，才改用 `replace_in_source`。
:::

### `batch_edit`

以原子方式套用多個操作。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `operations` | array | 是 | 操作陣列（最多 100 個）。 |
| `baseRevision` | string | 是 | 用於衝突偵測的預期版本。 |
| `requestId` | string | 否 | 冪等性金鑰。 |
| `mode` | string | 否 | `dryRun` 可預覽而不套用。套用或建議由使用者設定控制。 |

每個操作需要 `type`（`update`、`insert`、`delete`、`format` 或 `move`）、`nodeId` 和可選的 `text`/`content`。

**返回：** `{ success, changedNodeIds[], suggestionIds[] }`

### `apply_diff`

使用符合策略控制尋找和取代文字。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `original` | string | 是 | 要搜尋的文字。 |
| `replacement` | string | 是 | 要取代的文字。 |
| `baseRevision` | string | 是 | 用於衝突偵測的預期版本。 |
| `matchPolicy` | string | 否 | `first`、`all`、`nth` 或 `error_if_multiple`。預設：`first`。 |
| `nth` | number | 否 | 要取代第幾個符合項目（從 0 開始，用於 `nth` 策略）。 |
| `scopeQuery` | object | 否 | 用於縮小搜尋範圍的過濾器。 |
| `mode` | string | 否 | `dryRun` 可預覽而不套用。套用或建議由使用者設定控制。 |

**返回：** `{ matchCount, appliedCount, matches[], suggestionIds[] }`

### `replace_anchored`

使用上下文錨定進行精確定向取代文字。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `anchor` | object | 是 | `{ text, beforeContext, afterContext }` |
| `replacement` | string | 是 | 替換文字。 |
| `baseRevision` | string | 是 | 用於衝突偵測的預期版本。 |
| `mode` | string | 否 | `dryRun` 可預覽而不套用。套用或建議由使用者設定控制。 |

### `read_paragraph`

依索引或內容符合從文件讀取段落。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `target` | object | 是 | `{ index: 0 }` 或 `{ containing: "text" }` |
| `includeContext` | boolean | 否 | 包含周圍的段落。預設：false。 |

**返回：** `{ index, content, wordCount, charCount, position, context? }`

### `write_paragraph`

修改文件中的段落。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `baseRevision` | string | 是 | 用於衝突偵測的文件版本。 |
| `target` | object | 是 | `{ index: 0 }` 或 `{ containing: "text" }` |
| `operation` | string | 是 | `replace`、`append`、`prepend` 或 `delete`。 |
| `content` | string | 條件 | 新內容（`delete` 以外的操作必填）。 |
| `mode` | string | 否 | `dryRun` 可預覽而不套用。套用或建議由使用者設定控制。 |

**返回：** `{ success, message, suggestionId?, applied, newRevision? }`

### `smart_insert`

在常見文件位置插入內容。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `baseRevision` | string | 是 | 用於衝突偵測的文件版本。 |
| `destination` | varies | 是 | 插入位置（見下文）。 |
| `content` | string | 是 | 要插入的 Markdown 內容。 |
| `mode` | string | 否 | `dryRun` 可預覽而不套用。套用或建議由使用者設定控制。 |

**目標選項：**
- `"end_of_document"` — 在末尾插入
- `"start_of_document"` — 在開頭插入
- `{ after_paragraph: 2 }` — 在索引 2 的段落後插入
- `{ after_paragraph_containing: "conclusion" }` — 在包含該文字的段落後插入
- `{ after_section: "Introduction" }` — 在該節標題後插入

**返回：** `{ success, message, suggestionId?, applied, newRevision?, insertedAt? }`

::: tip 使用時機
- **有標題的結構化文件**：使用 `structure` → `get_section`、`update_section`、`insert_section`
- **無標題的平鋪文件**：使用 `document` → `read_paragraph`、`write_paragraph`、`smart_insert`
- **文件末尾**：使用 `document` → `smart_insert`，設定 `"end_of_document"`
:::

---

## `structure`

文件結構查詢和節操作。8 個操作。

所有操作接受可選的 `windowId` 參數。

### `get_ast`

取得文件的抽象語法樹。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `projection` | string[] | 否 | 要包含的欄位：`id`、`type`、`text`、`attrs`、`marks`、`children`。 |
| `filter` | object | 否 | 依 `type`、`level`、`contains`、`hasMarks` 過濾。 |
| `limit` | number | 否 | 最大結果數。 |
| `offset` | number | 否 | 跳過的數量。 |
| `afterCursor` | string | 否 | 游標分頁的節點 ID。 |

**返回：** 包含節點類型、位置和內容的完整 AST。

### `get_digest`

取得文件結構的緊湊摘要。

**返回：** `{ revision, title, wordCount, charCount, outline[], sections[], blockCounts, hasImages, hasTables, hasCodeBlocks, languages[] }`

### `list_blocks`

列出文件中所有帶節點 ID 的區塊。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `query` | object | 否 | 依 `type`、`level`、`contains`、`hasMarks` 過濾。 |
| `projection` | string[] | 否 | 要包含的欄位。 |
| `limit` | number | 否 | 最大結果數。 |
| `afterCursor` | string | 否 | 游標分頁的節點 ID。 |

**返回：** `{ revision, blocks[], hasMore, nextCursor? }`

節點 ID 使用前綴：`h-0`（標題）、`p-0`（段落）、`code-0`（程式碼區塊）等。

### `resolve_targets`

突變的預飛行檢查 — 依查詢尋找節點。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `query` | object | 是 | 查詢條件：`type`、`level`、`contains`、`hasMarks`。 |
| `maxResults` | number | 否 | 最大候選數。 |

**返回：** 已解析的目標位置和類型。

### `get_section`

取得文件節的內容（標題及其內容，直到下一個同級或更高級別的標題）。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `heading` | string \| object | 是 | 標題文字（字串）或 `{ level, index }`。 |
| `includeNested` | boolean | 否 | 包含子節。 |

**返回：** 含標題、正文和位置的節內容。

### `update_section`

更新節的內容。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `baseRevision` | string | 是 | 文件版本。 |
| `target` | object | 是 | `{ heading, byIndex, 或 sectionId }` |
| `newContent` | string | 是 | 新的節內容（Markdown）。 |
| `mode` | string | 否 | `dryRun` 可預覽而不套用。套用或建議由使用者設定控制。 |

### `insert_section`

插入新節。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `baseRevision` | string | 是 | 文件版本。 |
| `after` | object | 否 | 要在其後插入的節目標。 |
| `sectionHeading` | object | 是 | `{ level, text }` — 標題層級（1-6）和文字。 |
| `content` | string | 否 | 節正文內容。 |
| `mode` | string | 否 | `dryRun` 可預覽而不套用。套用或建議由使用者設定控制。 |

### `move_section`

將節移至新位置。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `baseRevision` | string | 是 | 文件版本。 |
| `section` | object | 是 | 要移動的節：`{ heading, byIndex, 或 sectionId }`。 |
| `after` | object | 否 | 要移至其後的節目標。 |
| `mode` | string | 否 | `dryRun` 可預覽而不套用。套用或建議由使用者設定控制。 |

---

## `selection`

讀取和操作文字選取和游標。5 個操作。

所有操作接受可選的 `windowId` 參數。

### `get`

取得目前的文字選取。

**返回：** `{ text, range: { from, to }, isEmpty }`

### `set`

設定選取範圍。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `from` | number | 是 | 起始位置（包含）。 |
| `to` | number | 是 | 結束位置（不包含）。 |

::: tip
`from` 和 `to` 使用相同值可定位游標而不選取文字。
:::

### `replace`

用新文字取代選取的文字。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `text` | string | 是 | 替換文字（支援 Markdown）。 |

**返回：** `{ message, range, originalContent, suggestionId?, applied }`

::: tip 建議系統
預設情況下，此操作建立一個需要使用者核准的 **建議**。原始文字帶刪除線顯示，新文字以幽靈文字顯示。若設定 → 整合中啟用了 **自動核准編輯**，變更會立即套用。
:::

### `get_context`

取得游標周圍的文字以了解上下文。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `linesBefore` | number | 否 | 游標前的行數。預設：3。 |
| `linesAfter` | number | 否 | 游標後的行數。預設：3。 |

**返回：** `{ before, after, currentLine, currentParagraph, block }`

`block` 物件包含：

| 欄位 | 類型 | 說明 |
|------|------|------|
| `type` | string | 區塊類型：`paragraph`、`heading`、`codeBlock`、`blockquote` 等 |
| `level` | number | 標題層級 1-6（僅限標題） |
| `language` | string | 程式碼語言（僅限有語言設定的程式碼區塊） |
| `inList` | string | 在清單內時的清單類型：`bullet`、`ordered` 或 `task` |
| `inBlockquote` | boolean | 在引言內時為 `true` |
| `inTable` | boolean | 在表格內時為 `true` |
| `position` | number | 區塊起始的文件位置 |

### `set_cursor`

設定游標位置（清除選取）。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `position` | number | 是 | 字元位置（從 0 開始計算）。 |

---

## `format`

文字格式、區塊類型、清單和清單批次操作。10 個操作。

所有操作接受可選的 `windowId` 參數。

### `toggle`

在目前選取上切換格式標記。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `mark` | string | 是 | `bold`、`italic`、`code`、`strike`、`underline` 或 `highlight` |

### `set_link`

在選取的文字上建立超連結。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `href` | string | 是 | 連結 URL。 |
| `title` | string | 否 | 連結標題（提示）。 |

### `remove_link`

從選取中移除超連結。無需其他參數。

### `clear`

從選取中移除所有格式。無需其他參數。

### `set_block_type`

將目前區塊轉換為特定類型。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `blockType` | string | 是 | `paragraph`、`heading`、`codeBlock` 或 `blockquote` |
| `level` | number | 條件 | 標題層級 1-6（`heading` 必填）。 |
| `language` | string | 否 | 程式碼語言（用於 `codeBlock`）。 |

### `insert_hr`

在游標處插入水平線（`---`）。無需其他參數。

### `toggle_list`

在目前區塊上切換清單類型。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `listType` | string | 是 | `bullet`、`ordered` 或 `task` |

### `indent_list`

增加目前清單項目的縮排。無需其他參數。

### `outdent_list`

減少目前清單項目的縮排。無需其他參數。

### `list_modify`

批次修改清單的結構和內容。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `baseRevision` | string | 是 | 文件版本。 |
| `target` | object | 是 | `{ listId }`、`{ selector }` 或 `{ listIndex }` |
| `operations` | array | 是 | 清單操作陣列。 |
| `mode` | string | 否 | `dryRun` 可預覽而不套用。套用或建議由使用者設定控制。 |

操作：`add_item`、`delete_item`、`update_item`、`toggle_check`、`reorder`、`set_indent`

---

## `table`

表格操作。3 個操作。

所有操作接受可選的 `windowId` 參數。

### `insert`

在游標處插入新表格。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `rows` | number | 是 | 列數（至少 1）。 |
| `cols` | number | 是 | 欄數（至少 1）。 |
| `withHeaderRow` | boolean | 否 | 是否包含標題列。預設：true。 |

### `delete`

刪除游標位置的表格。無需其他參數。

### `modify`

批次修改表格的結構和內容。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `baseRevision` | string | 是 | 文件版本。 |
| `target` | object | 是 | `{ tableId }`、`{ afterHeading }` 或 `{ tableIndex }` |
| `operations` | array | 是 | 表格操作陣列。 |
| `mode` | string | 否 | `dryRun` 可預覽而不套用。套用或建議由使用者設定控制。 |

操作：`add_row`、`delete_row`、`add_column`、`delete_column`、`update_cell`、`set_header`

---

## `editor`

編輯器狀態操作。3 個操作。

所有操作接受可選的 `windowId` 參數。

### `undo`

還原最後一次編輯操作。

### `redo`

重做最後一次已還原的操作。

### `focus`

聚焦編輯器（將其帶至前景，準備好接受輸入）。

---

## `workspace`

管理文件、視窗和工作區狀態。12 個操作。

對特定視窗操作的操作接受可選的 `windowId` 參數。

### `list_windows`

列出所有開啟的 VMark 視窗。

**返回：** `{ label, title, filePath, isFocused, isAiExposed }` 的陣列

### `get_focused`

取得聚焦視窗的標籤。

### `focus_window`

聚焦特定視窗。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `windowId` | string | 是 | 要聚焦的視窗標籤。 |

### `new_document`

建立新的空白文件。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `title` | string | 否 | 可選的文件標題。 |

### `open_document`

從檔案系統開啟文件。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `path` | string | 是 | 要開啟的檔案路徑。 |

### `save`

儲存目前文件。

### `save_as`

將文件儲存至新路徑。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `path` | string | 是 | 新的檔案路徑。 |

### `get_document_info`

取得文件元資料。

**返回：** `{ filePath, isDirty, title, wordCount, charCount }`

### `close_window`

關閉視窗。

### `list_recent_files`

列出最近開啟的檔案。

**返回：** `{ path, name, timestamp }` 的陣列（最多 10 個檔案，最近的在前）。

### `get_info`

取得目前工作區狀態的資訊。

**返回：** `{ isWorkspaceMode, rootPath, workspaceName }`

### `reload_document`

從磁碟重新載入活躍文件。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `force` | boolean | 否 | 強制重新載入，即使文件有未儲存的變更。預設：false。 |

若文件未命名或有未儲存變更且未設定 `force: true`，則失敗。

---

## `tabs`

管理視窗內的編輯器分頁。6 個操作。

所有操作接受可選的 `windowId` 參數。

### `list`

列出視窗中的所有分頁。

**返回：** `{ id, title, filePath, isDirty, isActive }` 的陣列

### `switch`

切換至特定分頁。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `tabId` | string | 是 | 要切換至的分頁 ID。 |

### `close`

關閉分頁。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `tabId` | string | 否 | 要關閉的分頁 ID。預設為活躍分頁。 |

### `create`

建立新的空白分頁。

**返回：** `{ tabId }`

### `get_info`

取得詳細的分頁資訊。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `tabId` | string | 否 | 分頁 ID。預設為活躍分頁。 |

**返回：** `{ id, title, filePath, isDirty, isActive }`

### `reopen_closed`

重新開啟最近關閉的分頁。

**返回：** `{ tabId, filePath, title }` 或無可用時的訊息。

VMark 追蹤每個視窗最後關閉的 10 個分頁。

---

## `media`

插入數學、圖表、媒體、Wiki 連結和中日韓文格式。11 個操作。

所有操作接受可選的 `windowId` 參數。

### `math_inline`

插入行內 LaTeX 數學。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `latex` | string | 是 | LaTeX 表達式（例如 `E = mc^2`）。 |

### `math_block`

插入區塊級數學方程式。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `latex` | string | 是 | LaTeX 表達式。 |

### `mermaid`

插入 Mermaid 圖表。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `code` | string | 是 | Mermaid 圖表程式碼。 |

### `markmap`

插入 Markmap 心智圖。使用標準 Markdown 標題定義樹狀結構。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `code` | string | 是 | 帶有定義心智圖樹狀結構標題的 Markdown。 |

### `svg`

插入 SVG 圖形。SVG 以行內方式渲染，附有平移、縮放和 PNG 匯出功能。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `code` | string | 是 | SVG 標記（帶 `<svg>` 根元素的有效 XML）。 |

### `wiki_link`

插入 Wiki 風格連結。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `target` | string | 是 | 連結目標（頁面名稱）。 |
| `displayText` | string | 否 | 顯示文字（若與目標不同）。 |

**結果：** `[[target]]` 或 `[[target|displayText]]`

### `video`

插入 HTML5 影片元素。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `src` | string | 是 | 影片檔案路徑或 URL。 |
| `baseRevision` | string | 是 | 文件版本。 |
| `title` | string | 否 | Title 屬性。 |
| `poster` | string | 否 | 封面圖片路徑或 URL。 |

### `audio`

插入 HTML5 音訊元素。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `src` | string | 是 | 音訊檔案路徑或 URL。 |
| `baseRevision` | string | 是 | 文件版本。 |
| `title` | string | 否 | Title 屬性。 |

### `video_embed`

插入影片嵌入（iframe）。支援 YouTube（隱私增強）、Vimeo 和 Bilibili。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `videoId` | string | 是 | 影片 ID（YouTube：11 個字元，Vimeo：數字，Bilibili：BV ID）。 |
| `baseRevision` | string | 是 | 文件版本。 |
| `provider` | string | 否 | `youtube`（預設）、`vimeo` 或 `bilibili`。 |

### `cjk_punctuation`

在半形和全形之間轉換標點。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `direction` | string | 是 | `to-fullwidth` 或 `to-halfwidth`。 |

### `cjk_spacing`

在中日韓文和拉丁字元之間新增或移除間距。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `spacingAction` | string | 是 | `add` 或 `remove`。 |

---

## `suggestions`

管理等待使用者核准的 AI 生成的編輯建議。5 個操作。

當 AI 使用 `document` → `insert_at_cursor` / `insert_at_position` / `replace_in_source`、`selection` → `replace` 或 `document` → `apply_diff` / `batch_edit` 時，變更會被暫存為需要使用者核准的建議。

所有操作接受可選的 `windowId` 參數。

::: info 還原/重做安全性
建議在接受之前不會修改文件。這保留了完整的還原/重做功能 — 使用者可以在接受後還原，拒絕則不在歷史記錄中留下任何痕跡。
:::

::: tip 自動核准模式
若設定 → 整合中啟用了 **自動核准編輯**，變更直接套用而不建立建議。以下操作只在自動核准停用（預設）時需要。
:::

### `list`

列出所有待定建議。

**返回：** `{ suggestions: [...], count, focusedId }`

每個建議包含 `id`、`type`（`insert`、`replace`、`delete`）、`from`、`to`、`newContent`、`originalContent` 和 `createdAt`。

### `accept`

接受特定建議，將其變更套用至文件。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `suggestionId` | string | 是 | 要接受的建議 ID。 |

### `reject`

拒絕特定建議，捨棄它而不做任何變更。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `suggestionId` | string | 是 | 要拒絕的建議 ID。 |

### `accept_all`

依文件順序接受所有待定建議。

### `reject_all`

拒絕所有待定建議。

---

## 協定工具

兩個用於查詢伺服器功能和文件狀態的獨立工具。這些不使用複合 `action` 模式。

### `get_capabilities`

取得 MCP 伺服器的功能和可用工具。

**返回：** `{ version, supportedNodeTypes[], supportedQueryOperators[], limits, features }`

### `get_document_revision`

取得目前文件版本，用於樂觀鎖定。

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| `windowId` | string | 否 | 視窗識別符。 |

**返回：** `{ revision, lastUpdated }`

在突變操作中使用版本以偵測並發編輯。

---

## MCP 資源

除工具外，VMark 還公開以下唯讀資源：

| 資源 URI | 說明 |
|----------|------|
| `vmark://document/outline` | 文件標題階層 |
| `vmark://document/metadata` | 文件元資料（路徑、字數等） |
| `vmark://windows/list` | 已開啟視窗的清單 |
| `vmark://windows/focused` | 目前聚焦的視窗標籤 |
