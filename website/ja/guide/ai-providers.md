# AIプロバイダー

VMarkの[AI Genie](/ja/guide/ai-genies)は提案を生成するためにAIプロバイダーが必要です。ローカルにインストールされたCLIツールを使用するか、REST APIに直接接続できます。

## クイックセットアップ

最速で始める方法：

1. **設定 > 統合**を開く
2. **検出**をクリックしてインストールされたCLIツールをスキャン
3. CLIが見つかった場合（例: Claude、Gemini）、それを選択 — 完了
4. CLIが利用できない場合は、RESTプロバイダーを選択し、APIキーを入力してモデルを選択

一度にアクティブにできるプロバイダーは1つだけです。

## CLIプロバイダー

CLIプロバイダーはローカルにインストールされたAIツールを使用します。VMarkはそれらをサブプロセスとして実行し、出力をエディタにストリーミングします。

| プロバイダー | CLIコマンド | インストール |
|------------|-----------|-----------|
| Claude | `claude` | [Claude Code](https://docs.anthropic.com/en/docs/claude-code) |
| Codex | `codex` | [OpenAI Codex CLI](https://github.com/openai/codex) |
| Gemini | `gemini` | [Google Gemini CLI](https://github.com/google-gemini/gemini-cli) |

### CLI検出の仕組み

設定 > 統合で**検出**をクリックします。VMarkは各CLIコマンドの `$PATH` を検索して可用性を報告します。CLIが見つかった場合、そのラジオボタンが選択可能になります。

### メリット

- **APIキー不要** — CLIは既存のログインを使用して認証を処理
- **劇的に安価** — CLIツールはサブスクリプションプラン（例: Claude Max、ChatGPT Plus/Pro、Google One AI Premium）を使用し、固定の月額料金がかかります。REST APIプロバイダーはトークンごとに課金され、高負荷使用では10〜30倍のコストになる可能性があります
- **CLIの設定を使用** — モデルの設定、システムプロンプト、請求はCLI自体によって管理されます

::: tip 開発者向けのサブスクリプション vs API
これらのツールをバイブコーディング（Claude Code、Codex CLI、Gemini CLI）にも使用している場合、同じサブスクリプションがVMarkのAI Genieとコーディングセッションの両方をカバーします — 追加費用なし。
:::

### セットアップ: Claude CLI

1. Claude Codeをインストール: `npm install -g @anthropic-ai/claude-code`
2. ターミナルで `claude` を一度実行して認証
3. VMarkで**検出**をクリックして**Claude**を選択

### セットアップ: Gemini CLI

1. Gemini CLIをインストール: `npm install -g @google/gemini-cli`（または[公式リポジトリ](https://github.com/google-gemini/gemini-cli)から）
2. `gemini` を一度実行してGoogleアカウントで認証
3. VMarkで**検出**をクリックして**Gemini**を選択

## REST APIプロバイダー

RESTプロバイダーはクラウドAPIに直接接続します。各プロバイダーにはエンドポイント、APIキー、モデル名が必要です。

| プロバイダー | デフォルトエンドポイント | 環境変数 |
|------------|----------------------|---------|
| Anthropic | `https://api.anthropic.com` | `ANTHROPIC_API_KEY` |
| OpenAI | `https://api.openai.com` | `OPENAI_API_KEY` |
| Google AI | _（組み込み）_ | `GOOGLE_API_KEY` または `GEMINI_API_KEY` |
| Ollama (API) | `http://localhost:11434` | — |

### 設定フィールド

RESTプロバイダーを選択すると、3つのフィールドが表示されます：

- **APIエンドポイント** — ベースURL（Google AIは固定エンドポイントを使用するため非表示）
- **APIキー** — シークレットキー（メモリのみに保存 — ディスクには書き込まれない）
- **モデル** — モデル識別子（例: `claude-sonnet-4-5-20250929`、`gpt-4o`、`gemini-2.0-flash`）

### 環境変数の自動入力

VMarkは起動時に標準的な環境変数を読み取ります。`ANTHROPIC_API_KEY`、`OPENAI_API_KEY`、または `GEMINI_API_KEY` がシェルプロファイルに設定されている場合、そのプロバイダーを選択するとAPIキーフィールドが自動的に入力されます。

これにより、`~/.zshrc` または `~/.bashrc` でキーを一度設定できます：

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

その後VMmarkを再起動 — 手動でキーを入力する必要はありません。

### セットアップ: Anthropic（REST）

1. [console.anthropic.com](https://console.anthropic.com)からAPIキーを取得
2. VMark設定 > 統合で**Anthropic**を選択
3. APIキーを貼り付け
4. モデルを選択（デフォルト: `claude-sonnet-4-5-20250929`）

### セットアップ: OpenAI（REST）

1. [platform.openai.com](https://platform.openai.com)からAPIキーを取得
2. VMark設定 > 統合で**OpenAI**を選択
3. APIキーを貼り付け
4. モデルを選択（デフォルト: `gpt-4o`）

### セットアップ: Google AI（REST）

1. [aistudio.google.com](https://aistudio.google.com)からAPIキーを取得
2. VMark設定 > 統合で**Google AI**を選択
3. APIキーを貼り付け
4. モデルを選択（デフォルト: `gemini-2.0-flash`）

### セットアップ: Ollama API（REST）

ローカルのOllamaインスタンスにREST形式でアクセスしたい場合、またはOllamaがネットワーク上の別のマシンで実行されている場合に使用します。

1. Ollamaが実行されていることを確認: `ollama serve`
2. VMark設定 > 統合で**Ollama (API)**を選択
3. エンドポイントを `http://localhost:11434`（またはOllamaホスト）に設定
4. APIキーは空欄のまま
5. モデルをプルしたモデル名に設定（例: `llama3.2`）

## プロバイダーの選択

| 状況 | 推奨 |
|------|------|
| Claude Codeが既にインストールされている | **Claude（CLI）** — ゼロ設定、サブスクリプションを使用 |
| CodexまたはGeminiが既にインストールされている | **Codex / Gemini（CLI）** — サブスクリプションを使用 |
| プライバシー/オフラインが必要 | Ollamaをインストール → **Ollama（CLI）** |
| カスタムまたは自己ホストモデル | エンドポイント付きの**Ollama（API）** |
| 最安値のクラウドオプションが欲しい | **任意のCLIプロバイダー** — サブスクリプションはAPIより劇的に安価 |
| サブスクリプションなし、軽い利用のみ | APIキー環境変数を設定 → **RESTプロバイダー**（トークン課金） |
| 最高品質の出力が必要 | **Claude（CLI）**または`claude-sonnet-4-5-20250929`付きの**Anthropic（REST）** |

## ジーニーごとのモデルオーバーライド

個々のGenieは `model` フロントマターフィールドを使用してプロバイダーのデフォルトモデルをオーバーライドできます：

```markdown
---
name: quick-fix
description: クイック文法修正
scope: selection
model: claude-haiku-4-5-20251001
---
```

これは単純なタスクを高速/低コストモデルにルーティングしながら強力なデフォルトを維持するのに便利です。

## セキュリティノート

- **APIキーはエフェメラル** — メモリのみに保存、ディスクや `localStorage` には書き込まれない
- **環境変数**は起動時に一度読み取られ、メモリにキャッシュされる
- **CLIプロバイダー**は既存のCLI認証を使用 — VMarkは認証情報を見ない
- **すべてのリクエストは直接**マシンからプロバイダーへ送信 — 中間にVMarkサーバーはない

## トラブルシューティング

**「AIプロバイダーが利用できません」** — **検出**をクリックしてCLIをスキャンするか、APIキーでRESTプロバイダーを設定してください。

**CLIが「見つかりません」と表示される** — CLIが `$PATH` にありません。インストールするかシェルプロファイルを確認してください。macOSでは、GUIアプリがターミナルの `$PATH` を継承しない場合があります — パスを `/etc/paths.d/` に追加してみてください。

**RESTプロバイダーが401を返す** — APIキーが無効か期限切れです。プロバイダーのコンソールで新しいキーを生成してください。

**RESTプロバイダーが429を返す** — レート制限に達しました。少し待ってから再試行するか、別のプロバイダーに切り替えてください。

**応答が遅い** — CLIプロバイダーにはサブプロセスのオーバーヘッドがあります。より速い応答のためには、直接接続するRESTプロバイダーを使用してください。最速のローカルオプションには、小さなモデルでOllamaを使用してください。

**モデルが見つからないエラー** — モデル識別子がプロバイダーが提供するものと一致しません。有効なモデル名についてはプロバイダーのドキュメントを確認してください。

## 関連情報

- [AI Genie](/ja/guide/ai-genies) — AIライティング支援の使用方法
- [MCPセットアップ](/ja/guide/mcp-setup) — Model Context ProtocolによるAI外部統合
