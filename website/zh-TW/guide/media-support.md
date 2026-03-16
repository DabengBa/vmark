# 媒體支援

VMark 支援在 Markdown 文件中嵌入影片、音訊和 YouTube，使用標準 HTML5 標籤。

## 支援的格式

### 影片

| 格式 | 副檔名 |
|------|--------|
| MP4 | `.mp4` |
| WebM | `.webm` |
| MOV | `.mov` |
| AVI | `.avi` |
| MKV | `.mkv` |
| M4V | `.m4v` |
| OGV | `.ogv` |

### 音訊

| 格式 | 副檔名 |
|------|--------|
| MP3 | `.mp3` |
| M4A | `.m4a` |
| OGG | `.ogg` |
| WAV | `.wav` |
| FLAC | `.flac` |
| AAC | `.aac` |
| Opus | `.opus` |

## 語法

### 影片

使用標準 HTML5 video 標籤：

```html
<video src="path/to/video.mp4" controls></video>
```

包含可選屬性：

```html
<video src="video.mp4" title="Demo" poster="thumbnail.jpg" controls></video>
```

### 音訊

使用標準 HTML5 audio 標籤：

```html
<audio src="path/to/audio.mp3" controls></audio>
```

### YouTube 嵌入

使用隱私增強的 YouTube iframe：

```html
<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

### 圖片語法後備

你也可以使用帶有媒體副檔名的圖片語法 — VMark 會自動將其升級為對應的媒體類型：

```markdown
![](video.mp4)
![](audio.mp3)
```

## 插入媒體

### 工具列

使用工具列中的插入選單：

- **影片** — 開啟影片檔案選擇器，複製至 `.assets/`，插入 `<video>` 標籤
- **音訊** — 開啟音訊檔案選擇器，複製至 `.assets/`，插入 `<audio>` 標籤
- **YouTube** — 從剪貼簿讀取 YouTube URL 並插入隱私增強的嵌入代碼

### 拖放

直接從檔案系統將影片或音訊檔案拖入編輯器。VMark 將：

1. 將檔案複製至文件的 `.assets/` 資料夾
2. 插入帶有相對路徑的對應媒體節點

### 原始碼模式

在原始碼模式中，直接輸入 HTML 標籤。媒體標籤會以彩色左邊框高亮顯示：

- **影片** — 藍綠色邊框
- **音訊** — 靛藍色邊框
- **YouTube** — 紅色邊框

## 編輯媒體

在所見即所得模式中雙擊任何媒體元素，即可開啟媒體彈出視窗：

- **來源路徑** — 編輯檔案路徑或 URL
- **標題** — 可選的 title 屬性
- **封面圖**（僅限影片）— 縮圖圖片路徑
- **移除** — 刪除媒體元素

按 `Escape` 關閉彈出視窗並返回編輯器。

## 路徑解析

VMark 支援三種媒體路徑類型：

| 路徑類型 | 範例 | 行為 |
|----------|------|------|
| 相對路徑 | `./assets/video.mp4` | 相對於文件所在目錄解析 |
| 絕對路徑 | `/Users/me/video.mp4` | 透過 Tauri 資產協定直接使用 |
| 外部 URL | `https://example.com/video.mp4` | 直接從網路載入 |

建議使用相對路徑 — 這讓你的文件在不同電腦之間保持可攜性。

## 安全性

- 相對路徑會驗證以防止目錄遍歷攻擊
- YouTube iframe 限制於 `youtube.com` 和 `youtube-nocookie.com` 網域
- 其他 iframe 來源會被清理程式移除
