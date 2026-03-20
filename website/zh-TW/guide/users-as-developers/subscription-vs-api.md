# 訂閱制 vs API 計費

AI 程式設計工具提供兩種認證方式：**訂閱方案** 和 **API 金鑰**。對於持續的程式設計工作階段（Vibe Coding），訂閱制的費用遠低於 API 計費 — 相同工作量通常便宜 10–30 倍。[^1]

## 費用差異

典型的活躍程式設計工作階段每小時消耗數十萬個 Token。以下是費用比較：

### Claude Code

| 方式 | 費用 | 你得到什麼 |
|------|------|----------|
| **Claude Max**（訂閱制） | $100–200/月 | 程式設計工作階段期間無限使用 |
| **API 金鑰**（`ANTHROPIC_API_KEY`） | $600–2,000+/月 | 按 Token 計費；大量使用時費用迅速累積 |

**認證指令：**
```bash
claude          # 使用 Claude Max 訂閱自動登入（推薦）
```

### Codex CLI（OpenAI）

| 方式 | 費用 | 你得到什麼 |
|------|------|----------|
| **ChatGPT Plus**（訂閱制） | $20/月 | 中度使用 |
| **ChatGPT Pro**（訂閱制） | $200/月 | 重度使用 |
| **API 金鑰**（`OPENAI_API_KEY`） | $200–1,000+/月 | 按 Token 計費 |

**認證指令：**
```bash
codex login     # 使用 ChatGPT 訂閱登入（推薦）
```

### Gemini CLI（Google）

| 方式 | 費用 | 你得到什麼 |
|------|------|----------|
| **免費方案** | $0 | 慷慨的免費配額 |
| **Google One AI Premium** | ~$20/月 | 更高的使用上限 |
| **API 金鑰**（`GEMINI_API_KEY`） | 依用量計費 | 按 Token 計費 |

**認證指令：**
```bash
gemini          # 使用 Google 帳號登入（推薦）
```

## 經驗法則

> **訂閱制 = 持續程式設計工作階段便宜 10–30 倍。**

算術很簡單：訂閱制提供固定月費，而 API 計費則按 Token 收費。AI 程式設計工具消耗大量 Token — 它們讀取整個檔案、生成長段程式碼，並在多輪編輯中反覆迭代。一個複雜的功能就可能消耗數百萬個 Token。[^2]

## API 金鑰仍然合適的情況

API 金鑰是以下情況的正確選擇：

| 使用情境 | 原因 |
|---------|------|
| **CI/CD 流水線** | 短暫且不頻繁執行的自動化任務 |
| **輕度或偶爾使用** | 每週幾次查詢 |
| **程式化存取** | 直接呼叫 API 的腳本和整合 |
| **團隊/組織計費** | 透過 API 使用量儀表板集中計費 |

對於互動式程式設計工作階段 — 你與 AI 來回溝通好幾個小時 — 訂閱制在成本上每次都勝出。[^3]

## 在 VMark 中設定

VMark 的 `AGENTS.md` 將訂閱優先認證作為專案慣例強制執行。當你複製儲存庫並開啟 AI 程式設計工具時，它會提醒你使用訂閱認證：

```
優先使用訂閱認證，而非所有 AI 程式設計工具的 API 金鑰。
```

三個工具在認證後都可以直接使用：

```bash
# 推薦：訂閱認證
claude              # Claude Code 搭配 Claude Max
codex login         # Codex CLI 搭配 ChatGPT Plus/Pro
gemini              # Gemini CLI 搭配 Google 帳號

# 備用：API 金鑰
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AI...
```

::: tip macOS GUI 應用程式的 PATH 問題
macOS GUI 應用程式（例如從 Spotlight 啟動的終端機）只有最基本的 PATH。如果工具在你的終端機中能運作，但 Claude Code 找不到它，請確保二進位檔的位置已加入你的 Shell 設定檔（`~/.zshrc` 或 `~/.bashrc`）。
:::

[^1]: 典型的密集 AI 程式設計工作階段每次互動消耗 50,000–100,000+ 個 Token。以目前的 API 費率（例如 Claude Sonnet 每 100 萬輸入/輸出 Token $3/$15），重度使用者回報的每月 API 費用為 $200–$2,000+ — 而訂閱方案在無限使用的情況下上限為 $100–$200/月。差距隨使用強度增長：輕度使用者兩種方式費用可能相近，但持續的 Vibe Coding 工作階段讓訂閱制成為明顯的勝者。參見：[AI Development Tools Pricing Analysis](https://vladimirsiedykh.com/blog/ai-development-tools-pricing-analysis-claude-copilot-cursor-comparison-2025) (2025); [Claude Code Token Limits Guide](https://www.faros.ai/blog/claude-code-token-limits), Faros AI (2025).

[^2]: AI 程式設計代理消耗的 Token 遠多於簡單的聊天互動，因為它們將整個檔案讀入情境、生成多檔案編輯、執行反覆的修復-測試循環，並在長工作階段中維護對話歷史。一個複雜功能的實作可能涉及幾十次工具呼叫，每次都消耗數千個 Token。情境視窗本身成為成本驅動因素 — 更大的視窗能實現更好的結果，但會成倍增加 Token 使用量。參見：[The Real Cost of Vibe Coding](https://smarterarticles.co.uk/the-real-cost-of-vibe-coding-when-ai-over-delivers-on-your-dime) (2025).

[^3]: 更廣泛的 SaaS 行業一直在朝向將固定訂閱與基於使用量的組件相結合的混合定價模式發展。到 2023 年，46% 的 SaaS 業務已採用基於使用量的定價，使用它的公司報告了 137% 的淨美元留存率。然而，對於每次查詢都消耗大量運算資源的 AI 驅動工具，純基於使用量的定價讓使用者面臨不可預測的成本 — 這就是為什麼固定費率訂閱對重度個人使用者仍然具有吸引力。參見：[The State of SaaS Pricing Strategy](https://www.invespcro.com/blog/saas-pricing/) (2025); [The Evolution of Pricing Models for SaaS Companies](https://medium.com/bcgontech/the-evolution-of-pricing-models-for-saas-companies-6d017101d733), BCG (2024).
