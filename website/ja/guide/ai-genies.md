# AI Genie

AI GenieはAIを使ってテキストを変換するプロンプトテンプレートです。テキストを選択してGenieを呼び出し、提案された変更をレビューする — すべてエディタを離れることなく。

## クイックスタート

1. **設定 > 統合**でAIプロバイダーを設定する（[AIプロバイダー](/ja/guide/ai-providers)を参照）
2. エディタでテキストを選択する
3. `Mod + Y` を押してGenieピッカーを開く
4. Genieを選択するかフリーフォームのプロンプトを入力する
5. インライン提案をレビューする — 承認または拒否

## Genieピッカー

`Mod + Y`（またはメニュー**ツール > AI Genie**）を押すと、単一の統合入力を持つスポットライトスタイルのオーバーレイが開きます。

**検索とフリーフォーム** — 入力を開始すると、名前、説明、またはカテゴリでGenieがフィルタリングされます。Genieが一致しない場合、入力フィールドはフリーフォームのプロンプトフィールドになります。

**クイックチップ** — スコープが「selection」で入力が空の場合、よく使われるアクション（Polish、Condense、Grammar、Rephrase）のワンクリックボタンが表示されます。

**2段階フリーフォーム** — Genieが一致しない場合、`Enter`を一度押して確認ヒントを確認し、再度`Enter`を押してAIプロンプトとして送信します。これにより誤送信を防ぎます。

**スコープ切り替え** — `Tab`を押してスコープを切り替えます: selection → block → document → all。

**プロンプト履歴** — フリーフォームモード（一致するGenieなし）では、`ArrowUp` / `ArrowDown`で過去のプロンプトを循環できます。`Ctrl + R`で検索可能な履歴ドロップダウンを開きます。ゴーストテキストで最近一致するプロンプトがグレーのヒントとして表示されます — `Tab`で受け入れます。

### 処理フィードバック

Genieを選択するかフリーフォームのプロンプトを送信すると、ピッカーにインラインフィードバックが表示されます:

- **処理中** — 経過時間カウンター付きの思考中インジケーター。`Escape`でキャンセル。
- **プレビュー** — AIの応答がリアルタイムでストリーミングされます。`Accept`で適用、`Reject`で破棄。
- **エラー** — 問題が発生した場合、`Retry`ボタン付きでエラーメッセージが表示されます。

ステータスバーにもAIの進捗状況が表示されます — 実行中は経過時間付きのスピンアイコン、成功時は短い「Done」フラッシュ、エラーインジケーターとRetry/Dismissボタン。ステータスバーは`F7`で非表示にしていても、AIがアクティブな状態になると自動的に表示されます。

## 組み込みGenie

VMarkには4つのカテゴリにわたる13のGenieが搭載されています:

### 編集

| Genie | 説明 | スコープ |
|-------|------|---------|
| Polish | 明確さとフローを改善する | Selection |
| Condense | テキストをより簡潔にする | Selection |
| Fix Grammar | 文法とスペルを修正する | Selection |
| Simplify | よりシンプルな表現を使う | Selection |

### クリエイティブ

| Genie | 説明 | スコープ |
|-------|------|---------|
| Expand | アイデアをより豊かな文章に発展させる | Selection |
| Rephrase | 同じことを別の言い方で表現する | Selection |
| Vivid | 感覚的な詳細とイメージを追加する | Selection |
| Continue | ここから書き続ける | Block |

### 構造

| Genie | 説明 | スコープ |
|-------|------|---------|
| Summarize | ドキュメントを要約する | Document |
| Outline | アウトラインを生成する | Document |
| Headline | タイトルオプションを提案する | Document |

### ツール

| Genie | 説明 | スコープ |
|-------|------|---------|
| Translate | 英語に翻訳する | Selection |
| Rewrite in English | テキストを英語で書き直す | Selection |

## スコープ

各Genieは3つのスコープのいずれかで動作します:

- **Selection** — ハイライトされたテキスト。何も選択されていない場合、現在のブロックにフォールバックします。
- **Block** — カーソル位置の段落またはブロック要素。
- **Document** — ドキュメント全体のコンテンツ。

スコープは`{{content}}`としてAIに渡すテキストの抽出範囲を決定します。

::: tip
スコープが**Selection**でも何も選択されていない場合、Genieは現在の段落で動作します。
:::

## 提案のレビュー

Genieが実行されると、提案がインラインに表示されます:

- **Replace** — 取り消し線付きの元のテキスト、緑色の新しいテキスト
- **Insert** — ソースブロックの後に緑色で表示される新しいテキスト
- **Delete** — 取り消し線付きの元のテキスト

各提案には承認（チェックマーク）と拒否（X）ボタンがあります。

### キーボードショートカット

| アクション | ショートカット |
|-----------|--------------|
| 提案を承認 | `Enter` |
| 提案を拒否 | `Escape` |
| 次の提案 | `Tab` |
| 前の提案 | `Shift + Tab` |
| すべて承認 | `Mod + Shift + Enter` |
| すべて拒否 | `Mod + Shift + Escape` |

## ステータスバーインジケーター

AIが生成中、ステータスバーには経過時間カウンター付きのスピンするスパークルアイコン（「Thinking... 3s」）が表示されます。キャンセルボタン（×）でリクエストを停止できます。

完了後、3秒間短い「Done」チェックマークが点滅します。エラーが発生した場合、ステータスバーにRetryとDismissボタン付きでエラーメッセージが表示されます。

ステータスバーは`F7`で非表示にしていても、AIがアクティブな状態（実行中、エラー、または成功）になると自動的に表示されます。

---

## カスタムGenieの作成

独自のGenieを作成できます。各GenieはYAMLフロントマターとプロンプトテンプレートを持つ単一のMarkdownファイルです。

### Genieの保存場所

Genieはアプリケーションデータディレクトリに保存されます:

| プラットフォーム | パス |
|----------------|------|
| macOS | `~/Library/Application Support/com.vmark.app/genies/` |
| Windows | `%APPDATA%\com.vmark.app\genies\` |
| Linux | `~/.local/share/com.vmark.app/genies/` |

メニュー**ツール > Genieフォルダを開く**からこのフォルダを開きます。

### ディレクトリ構造

サブディレクトリはピッカーの**カテゴリ**になります。好きなようにGenieを整理できます:

```
genies/
├── editing/
│   ├── polish.md
│   ├── condense.md
│   └── fix-grammar.md
├── creative/
│   ├── expand.md
│   └── rephrase.md
├── academic/          ← カスタムカテゴリ
│   ├── cite.md
│   └── abstract.md
└── my-workflows/      ← 別のカスタムカテゴリ
    └── blog-intro.md
```

### ファイル形式

すべてのGenieファイルには2つの部分があります: **フロントマター**（メタデータ）と**テンプレート**（プロンプト）。

```markdown
---
description: Improve clarity and flow
scope: selection
category: editing
---

You are an expert editor. Improve the clarity, flow, and conciseness
of the following text while preserving the author's voice and intent.

Return only the improved text — no explanations.

{{content}}
```

ファイル名`polish.md`はピッカーで「Polish」という表示名になります。

### フロントマターフィールド

| フィールド | 必須 | 値 | デフォルト |
|----------|------|-----|----------|
| `description` | いいえ | ピッカーに表示される短い説明 | 空 |
| `scope` | いいえ | `selection`、`block`、`document` | `selection` |
| `category` | いいえ | グループ化のカテゴリ名 | サブディレクトリ名 |
| `action` | いいえ | `replace`、`insert` | `replace` |
| `context` | いいえ | `1`、`2` | `0`（なし） |
| `model` | いいえ | プロバイダーのデフォルトを上書きするモデル識別子 | プロバイダーのデフォルト |

**Genie名** — 表示名は常に**ファイル名**（`.md`なし）から取得されます。例: `fix-grammar.md`はピッカーで「Fix Grammar」と表示されます。表示名を変更するにはファイル名を変更します。

### `{{content}}`プレースホルダー

`{{content}}`プレースホルダーはすべてのGenieの核心です。Genieが実行されると、VMarkは:

1. スコープに基づいてテキストを**抽出**する（選択テキスト、現在のブロック、またはドキュメント全体）
2. テンプレート内のすべての`{{content}}`を抽出されたテキストで**置換**する
3. 入力されたプロンプトをアクティブなAIプロバイダーに**送信**する
4. 応答をインライン提案としてストリームで**返す**

例えば、このテンプレートの場合:

```markdown
Translate the following text into French.

{{content}}
```

ユーザーが「Hello, how are you?」を選択した場合、AIは次を受け取ります:

```
Translate the following text into French.

Hello, how are you?
```

AIは「Bonjour, comment allez-vous ?」と応答し、選択されたテキストを置き換えるインライン提案として表示されます。

### `{{context}}`プレースホルダー

`{{context}}`プレースホルダーは、AIに読み取り専用の周辺テキストを提供します — これにより、近くのブロックを変更せずにトーン、スタイル、構造を合わせることができます。

**仕組み:**

1. フロントマターで`context: 1`または`context: 2`を設定して±1または±2の隣接ブロックを含める
2. テンプレート内の周辺テキストを挿入したい場所に`{{context}}`を使用する
3. AIはコンテキストを見ますが、提案は`{{content}}`のみを置き換えます

**複合ブロックはアトミック** — 隣接ブロックがリスト、テーブル、引用ブロック、またはdetailsブロックの場合、構造全体が1つのブロックとしてカウントされます。

**スコープ制限** — コンテキストは`selection`と`block`スコープでのみ機能します。`document`スコープの場合、コンテンツはすでにドキュメント全体です。

**フリーフォームプロンプト** — ピッカーでフリーフォームの指示を入力すると、VMarkは`selection`と`block`スコープに対して自動的に±1の周辺ブロックをコンテキストとして含めます。設定は不要です。

**後方互換性** — `{{context}}`のないGenieは以前と同様に動作します。テンプレートに`{{context}}`が含まれていない場合、周辺テキストは抽出されません。

**例 — AIが受け取るもの:**

`context: 1`を設定し、3段落のドキュメントの2番目の段落にカーソルがある場合:

```
[Before]
First paragraph content here.

[After]
Third paragraph content here.
```

その方向に隣接するブロックがない場合（例: コンテンツがドキュメントの先頭または末尾にある場合）、`[Before]`と`[After]`セクションは省略されます。

### `action`フィールド

デフォルトでは、Genieはソーステキストを**置き換え**ます。`action: insert`を設定すると、代わりにソースブロックの後に出力を**追加**します。

`replace`の使用: 編集、言い換え、翻訳、文法修正 — 元のテキストを変換するもの全般。

`insert`の使用: 続きを書く、コンテンツの下に要約を生成する、コメントを追加する — 元のテキストを削除せずに新しいテキストを追加するもの全般。

**例 — insertアクション:**

```markdown
---
description: Continue writing from here
scope: block
action: insert
---

Continue writing naturally from where the following text leaves off.
Match the author's voice, style, and tone. Write 2-3 paragraphs.

Do not repeat or summarize the existing text — just continue it.

{{content}}
```

### `model`フィールド

特定のGenieのデフォルトモデルを上書きします。シンプルなタスクには安価なモデル、複雑なタスクにはより強力なモデルを使いたい場合に便利です。

```markdown
---
description: Quick grammar fix (uses fast model)
scope: selection
model: claude-haiku-4-5-20251001
---

Fix grammar and spelling errors. Return only the corrected text.

{{content}}
```

モデル識別子は、アクティブなプロバイダーが受け付けるものと一致する必要があります。

## 効果的なプロンプトの書き方

### 出力形式を具体的に指定する

AIに何を返すべきか正確に伝えます。これがないと、モデルは説明、ヘッダー、またはコメントを追加する傾向があります。

```markdown
<!-- Good -->
Return only the improved text — no explanations.

<!-- Bad — AI may wrap output in quotes, add "Here's the improved version:", etc. -->
Improve this text.
```

### 役割を設定する

AIに動作の軸となるペルソナを与えます。

```markdown
<!-- Good -->
You are an expert technical editor who specializes in API documentation.

<!-- Okay but less focused -->
Edit the following text.
```

### スコープを制約する

AIが変更すべきでないものを伝えます。これにより過剰な編集を防ぎます。

```markdown
<!-- Good -->
Fix grammar and spelling errors only.
Do not change the meaning, style, or tone.
Do not restructure sentences.

<!-- Bad — gives the AI too much freedom -->
Fix this text.
```

### プロンプトでMarkdownを使う

プロンプトテンプレートでMarkdown書式を使えます。AIに構造化された出力を生成させたい場合に役立ちます。

```markdown
---
description: Generate a pros/cons analysis
scope: selection
action: insert
---

Analyze the following text and produce a brief pros/cons list.

Format as:

**Pros:**
- point 1
- point 2

**Cons:**
- point 1
- point 2

{{content}}
```

### プロンプトを集中させる

1つのGenie、1つの仕事。複数のタスクを1つのGenieにまとめないで — 代わりに別々のGenieを作成してください。

```markdown
<!-- Good — one clear job -->
---
description: Convert to active voice
scope: selection
---

Rewrite the following text using active voice.
Do not change the meaning.
Return only the rewritten text.

{{content}}
```

## カスタムGenieの例

### 学術 — アブストラクトの作成

```markdown
---
description: Generate an academic abstract
scope: document
action: insert
---

Read the following paper and write a concise academic abstract
(150-250 words). Follow standard structure: background, methods,
results, conclusion.

{{content}}
```

### ブログ — フックの生成

```markdown
---
description: Write an engaging opening paragraph
scope: document
action: insert
---

Read the following draft and write a compelling opening paragraph
that hooks the reader. Use a question, surprising fact, or vivid
scene. Keep it under 3 sentences.

{{content}}
```

### コード — コードブロックの説明

```markdown
---
description: Add a plain-English explanation above code
scope: selection
action: insert
---

Read the following code and write a brief plain-English explanation
of what it does. Use 1-2 sentences. Do not include the code itself
in your response.

{{content}}
```

### メール — プロフェッショナルな表現に

```markdown
---
description: Rewrite in professional tone
scope: selection
---

Rewrite the following text in a professional, business-appropriate tone.
Keep the same meaning and key points. Remove casual language,
slang, and filler words.

Return only the rewritten text — no explanations.

{{content}}
```

### 翻訳 — 簡体字中国語へ

```markdown
---
description: Translate to Simplified Chinese
scope: selection
---

Translate the following text into Simplified Chinese.
Preserve the original meaning, tone, and formatting.
Use natural, idiomatic Chinese — not word-for-word translation.

Return only the translated text — no explanations.

{{content}}
```

### コンテキスト対応 — 周辺に合わせる

```markdown
---
description: Rewrite to match surrounding tone and style
scope: selection
context: 1
---

Rewrite the following content to fit naturally with its surrounding context.
Match the tone, style, and level of detail.

Return only the rewritten text — no explanations.

## Surrounding context (do not include in output):
{{context}}

## Content to rewrite:
{{content}}
```

### レビュー — ファクトチェック

```markdown
---
description: Flag claims that need verification
scope: selection
action: insert
---

Read the following text and list any factual claims that should be
verified. For each claim, note why it might need checking (e.g.,
specific numbers, dates, statistics, or strong assertions).

Format as a bullet list. If everything looks solid, say
"No claims flagged for verification."

{{content}}
```

## 制限事項

- GenieはWYSIWYGモードでのみ動作します。ソースモードでは、その説明のトースト通知が表示されます。
- 同時に1つのGenieしか実行できません。AIがすでに生成中の場合、ピッカーは別のGenieを開始しません。
- `{{content}}`プレースホルダーは文字通りに置換されます — 条件分岐やループはサポートされていません。
- `scope: document`を使用すると、非常に大きなドキュメントはプロバイダーのトークン制限に達する場合があります。

## トラブルシューティング

**「AIプロバイダーが利用できません」** — 設定 > 統合を開いてプロバイダーを設定してください。[AIプロバイダー](/ja/guide/ai-providers)を参照。

**Genieがピッカーに表示されない** — ファイルに`.md`拡張子があり、`---`フェンス付きの有効なフロントマターがあり、Genieディレクトリ（1レベル以上深いサブディレクトリではなく）にあることを確認してください。

**AIがゴミか、エラーを返す** — APIキーが正しく、モデル名がプロバイダーに有効であることを確認してください。エラーの詳細はターミナル/コンソールを確認してください。

**提案が期待と一致しない** — プロンプトを改善してください。制約（「テキストのみを返す」、「説明しない」）を追加し、役割を設定するか、スコープを絞り込んでください。

## 関連情報

- [AIプロバイダー](/ja/guide/ai-providers) — CLIまたはREST APIプロバイダーの設定
- [キーボードショートカット](/ja/guide/shortcuts) — 完全なショートカットリファレンス
- [MCPツール](/ja/guide/mcp-tools) — MCP経由の外部AI統合
