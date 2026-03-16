# メディアサポート

VMarkは標準的なHTML5タグを使って、Markdownドキュメントにビデオ、オーディオ、YouTubeの埋め込みをサポートします。

## サポートされるフォーマット

### ビデオ

| フォーマット | 拡張子 |
|--------|-----------|
| MP4 | `.mp4` |
| WebM | `.webm` |
| MOV | `.mov` |
| AVI | `.avi` |
| MKV | `.mkv` |
| M4V | `.m4v` |
| OGV | `.ogv` |

### オーディオ

| フォーマット | 拡張子 |
|--------|-----------|
| MP3 | `.mp3` |
| M4A | `.m4a` |
| OGG | `.ogg` |
| WAV | `.wav` |
| FLAC | `.flac` |
| AAC | `.aac` |
| Opus | `.opus` |

## 構文

### ビデオ

標準的なHTML5のvideoタグを使います:

```html
<video src="path/to/video.mp4" controls></video>
```

オプション属性付き:

```html
<video src="video.mp4" title="Demo" poster="thumbnail.jpg" controls></video>
```

### オーディオ

標準的なHTML5のaudioタグを使います:

```html
<audio src="path/to/audio.mp3" controls></audio>
```

### YouTube埋め込み

プライバシー強化されたYouTubeのiframeを使います:

```html
<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

### 画像構文へのフォールバック

メディアファイルの拡張子を持つ画像構文も使えます — VMarkが自動的に適切なメディアタイプに変換します:

```markdown
![](video.mp4)
![](audio.mp3)
```

## メディアの挿入

### ツールバー

ツールバーの「挿入」メニューを使います:

- **ビデオ** — ビデオファイルのファイルピッカーを開き、`.assets/`にコピーし、`<video>`タグを挿入
- **オーディオ** — オーディオファイルのファイルピッカーを開き、`.assets/`にコピーし、`<audio>`タグを挿入
- **YouTube** — クリップボードからYouTube URLを読み取り、プライバシー強化された埋め込みを挿入

### ドラッグ&ドロップ

ファイルシステムからビデオまたはオーディオファイルをエディタに直接ドラッグします。VMarkは次の処理を行います:

1. ドキュメントの`.assets/`フォルダーにファイルをコピー
2. 相対パスを持つ適切なメディアノードを挿入

### ソースモード

ソースモードでは、HTMLタグを直接入力します。メディアタグは色付きの左ボーダーでハイライトされます:

- **ビデオ** — ティールのボーダー
- **オーディオ** — インディゴのボーダー
- **YouTube** — 赤のボーダー

## メディアの編集

WYSIWYGモードでメディア要素をダブルクリックすると、メディアポップアップが開きます:

- **ソースパス** — ファイルパスまたはURLを編集
- **タイトル** — オプションのtitle属性
- **ポスター**（ビデオのみ） — サムネイル画像のパス
- **削除** — メディア要素を削除

`Escape`を押してポップアップを閉じ、エディタに戻ります。

## パスの解決

VMarkは3種類のメディアパスをサポートします:

| パスの種類 | 例 | 動作 |
|-----------|---------|----------|
| 相対パス | `./assets/video.mp4` | ドキュメントのディレクトリを基準に解決 |
| 絶対パス | `/Users/me/video.mp4` | Tauriアセットプロトコルを通じて直接使用 |
| 外部URL | `https://example.com/video.mp4` | ウェブから直接読み込み |

相対パスを推奨します — マシン間でドキュメントを移植しやすくなります。

## セキュリティ

- 相対パスはディレクトリトラバーサル攻撃に対して検証されます
- YouTubeのiframeは`youtube.com`と`youtube-nocookie.com`ドメインに制限されます
- 他のiframeソースはサニタイザーによって除去されます
