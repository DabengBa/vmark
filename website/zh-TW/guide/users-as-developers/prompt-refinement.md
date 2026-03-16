# 為什麼英文提示能產生更好的程式碼

AI 程式設計工具在你使用英文提示時效果更好 — 即使英文不是你的母語也一樣。VMark 內建一個 Hook，可以自動翻譯和精煉你的提示。

## 為什麼英文對 AI 程式設計更重要

### LLM 用英文思考

大型語言模型在內部透過一個與英文高度對齊的表示空間來處理所有語言。[^1] 在發送給模型之前，將非英文提示預先翻譯成英文，能明顯提升輸出品質。[^2]

在實際使用中，像「把這個函數改成異步的」這樣的中文提示也能運作 — 但英文版「Convert this function to async」能以更少的迭代次數產生更精確的程式碼。

### 工具使用繼承了提示語言

當 AI 程式設計工具搜尋網路、閱讀文件或查詢 API 參考資料時，它會使用你提示的語言來執行這些查詢。英文查詢找到更好的結果，原因如下：

- 官方文件、Stack Overflow 和 GitHub Issues 主要是英文的
- 英文的技術搜尋詞彙更精確
- 程式碼範例和錯誤訊息幾乎都是英文的

一個詢問「狀態管理」的中文提示可能會搜尋中文資源，錯過官方的英文文件。多語言基準測試一致顯示，英文和其他語言之間存在高達 24% 的性能差距 — 即使是像法文或德文這樣的廣泛使用語言也是如此。[^3]

## `::` 提示精煉 Hook

VMark 的 `.claude/hooks/refine_prompt.mjs` 是一個 [UserPromptSubmit Hook](https://docs.anthropic.com/en/docs/claude-code/hooks)，它在你的提示到達 Claude 之前攔截它，將其翻譯成英文，並精煉成最佳化的程式設計提示。

### 如何使用

在你的提示前加上 `::` 或 `>>`：

```
:: 把这个函数改成异步的
```

Hook 會：
1. 將你的文字發送給 Claude Haiku（快速、廉價）進行翻譯和精煉
2. 阻止原始提示被發送
3. 將精煉後的英文提示複製到你的剪貼簿
4. 向你顯示結果

然後你貼上（`Cmd+V`）精煉後的提示並按 Enter 傳送。

### 範例

**輸入：**
```
:: 这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下
```

**精煉後的輸出（已複製到剪貼簿）：**
```
Optimize this component to prevent unnecessary re-renders when the parent component updates. Use React.memo, useMemo, or useCallback as appropriate.
```

### 運作原理

這個 Hook 使用一個精心設計的系統提示，讓 Haiku 具備：

- **Claude Code 意識** — 了解目標工具的能力（檔案編輯、Bash、Glob/Grep、MCP 工具、計畫模式、子代理）
- **專案情境** — 從 `.claude/hooks/project-context.txt` 載入，讓 Haiku 了解技術棧、慣例和關鍵檔案路徑
- **優先排序的規則** — 首先保留意圖，然後翻譯，然後澄清範疇，然後去除填充詞
- **混合語言處理** — 翻譯散文，但保留技術術語不翻譯（`useEffect`、檔案路徑、CLI 指令）
- **少樣本範例**[^4] — 七個輸入/輸出對，涵蓋中文、模糊英文、混合語言和多步驟請求
- **輸出長度指引** — 簡單請求 1–2 句，複雜請求 3–5 句

如果你的輸入已經是清晰的英文提示，它會以最小的修改返回。

### 設定

這個 Hook 已在 VMark 的 `.claude/settings.json` 中預先設定。它需要 [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)，這在 Claude Code 中自動可用。

無需額外設定 — 只需使用 `::` 或 `>>` 前綴即可。

::: tip 何時跳過
對於短指令（`go ahead`、`yes`、`continue`、`option 2`），直接發送而不使用前綴。Hook 會忽略這些，以避免不必要的往返。
:::

## 對英文使用者同樣有用

即使你用英文寫作，`>>` 前綴也有助於優化提示：

```
>> make the thing work better with the new API
```

會變成：
```
Update the integration to use the new API. Fix any deprecated method calls and ensure error handling follows the updated response format.
```

精煉後增加了具體性和結構，幫助 AI 第一次就能產生更好的程式碼。[^5]

[^1]: 多語言 LLM 在一個與英文最接近的表示空間中做出關鍵決策，無論輸入/輸出語言是什麼。使用 logit lens 探測內部表示時，研究人員發現語義上重要的詞彙（如「水」或「太陽」）在被翻譯成目標語言之前，先以英文選出。啟動導向在用英文計算時也更有效。參見：Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: 在推理之前，系統性地將非英文提示預先翻譯成英文，能在多個任務和語言上提升 LLM 輸出品質。研究人員將提示分解為四個功能部分（指令、情境、範例、輸出），並顯示對特定組件的選擇性翻譯比翻譯所有內容更有效。參見：Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: MMLU-ProX 基準測試 — 29 種語言中的 11,829 個相同問題 — 發現英文和低資源語言之間存在高達 24.3% 的性能差距。即使是法文和德文等廣泛使用的語言也表現出可測量的下降。差距與每種語言在模型預訓練語料庫中的比例強烈相關，而且僅僅擴大模型規模並不能消除這種差距。參見：[MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: 少樣本提示 — 在提示中提供輸入/輸出範例 — 能大幅提升 LLM 任務性能。具有里程碑意義的 GPT-3 論文顯示，雖然零樣本性能隨模型規模穩定提升，但少樣本性能提升*更快*，有時能達到與微調模型競爭的水準。更大的模型更擅長從情境範例中學習。參見：Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: 結構化、精心設計的提示在程式碼生成任務上始終優於模糊的指示。思維鏈推理、角色分配和明確的範疇限制等技術都能提升第一次嘗試的準確率。參見：Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
