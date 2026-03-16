# 為什麼我們接受 Issues 而不是 Pull Request

VMark 不接受 Pull Request。我們歡迎 Issues — 越詳細越好。本頁說明原因。

## 簡短版本

VMark 是 Vibe Coding 的產物。整個程式碼庫都是由 AI 在一位維護者的監督下撰寫的。當有人提交 Pull Request 時，存在一個根本性的問題：**一個人無法有意義地審閱另一個人的 AI 生成程式碼**。審閱者不理解貢獻者的程式碼，因為他們兩人都沒有以傳統意義上「撰寫」它 — 他們的 AI 撰寫了它。

Issues 沒有這個問題。一個寫得好的 Issue 描述了*應該發生什麼*。維護者的 AI 隨後以對專案慣例、測試套件和架構的完整情境來修復程式碼庫。結果是一致的、經過測試的、可維護的程式碼。

## 「Vibe Coding」實際上是什麼意思

「Vibe Coding」這個詞由 Andrej Karpathy 於 2025 年初創造，用來描述一種程式設計風格：你用自然語言描述你想要什麼，讓 AI 撰寫程式碼。你引導方向，但你不是在撰寫 — 或者通常甚至不是在閱讀 — 每一行。[^1]

VMark 比大多數專案走得更遠。這個儲存庫包含：

- **`AGENTS.md`** — 每個 AI 工具啟動時讀取的專案規則
- **`.claude/rules/`** — 15 個以上的規則檔案，涵蓋 TDD、設計令牌、元件模式、無障礙功能等
- **斜線指令** — 用於稽核、修復和驗證程式碼的預建工作流程
- **跨模型驗證** — Claude 撰寫，Codex 稽核（參見[跨模型驗證](/zh-TW/guide/users-as-developers/cross-model-verification)）

AI 不只是生成隨機程式碼。它在一個密集的約束網絡中運作 — 慣例、測試和自動化檢查 — 讓程式碼庫保持一致。但這只有在**一個 AI 工作階段擁有這些約束的完整情境**時才有效。

## 理解差距

以下是 AI 生成的 Pull Request 的核心問題：沒有人真正完整地閱讀它們。

ACM 軟體工程基礎會議的研究發現，開發者 — 特別是那些沒有自己撰寫程式碼的人 — 難以理解 LLM 生成的程式碼。這項名為《"I Would Have Written My Code Differently"：初學者難以理解 LLM 生成的程式碼》的研究記錄了技術上有能力的開發者在 AI 撰寫的程式碼上的理解困難。[^2]

這不只是初學者的問題。CodeRabbit 對 50 多萬個 Pull Request 的 2025 年分析發現，AI 生成的 PR 包含**比人工撰寫 PR 多 1.7 倍的問題** — 包括多 75% 的邏輯和正確性錯誤。最令人擔憂的是，這些正是在審閱時看起來合理、除非逐步走過程式碼才能發現的錯誤。[^3]

當雙方都使用 AI 時，情況更糟：

| 情境 | 審閱者理解程式碼？ |
|------|-----------------|
| 人工撰寫，人工審閱 | 是 — 審閱者能推理意圖 |
| AI 撰寫，原作者審閱 | 部分 — 作者引導了 AI 並有情境 |
| AI 撰寫，不同人工審閱 | 差 — 審閱者既沒有作者情境也沒有 AI 工作階段情境 |
| 人 A 的 AI 撰寫，人 B 的 AI 審閱 | 兩個人都對程式碼缺乏深度理解 |

VMark 處於最後一行。當貢獻者開啟由他們的 AI 生成的 PR，而維護者的 AI 審閱它時，循環中的兩個人對任何情境都理解得最少。這不是高品質軟體的良方。

## 為什麼 AI 生成的 PR 與人工 PR 不同

傳統程式碼審閱之所以有效，是因為有一個共同基礎：作者和審閱者都理解程式語言、模式和慣用語。審閱者可以在腦海中模擬程式碼的執行並發現不一致之處。

使用 AI 生成的程式碼，這個共同基礎就侵蝕了。研究顯示了幾個具體的失敗模式：

**慣例漂移。** AI 有「強烈傾向於不理解儲存庫中現有慣例是什麼」，生成自己略有不同的問題解決版本。[^4] 每個貢獻者的 AI 工作階段都會生產獨立運作但與專案模式衝突的程式碼。在 VMark 中，我們強制執行特定的 Zustand Store 模式、CSS 令牌使用和插件結構，慣例漂移將是災難性的。

**情境隔離。** Vibe Coding 的功能通常是「在隔離中生成的，AI 為每個提示建立合理的實作，但對之前工作階段的架構決策沒有記憶」。[^5] 貢獻者的 AI 不了解 VMark 的 15 個規則檔案、它的跨模型稽核流水線或特定的 ProseMirror 插件慣例 — 除非貢獻者已辛苦地設定了所有這些。

**審閱瓶頸。** 使用 AI 的開發者完成了 21% 更多的任務並合併了 98% 更多的 PR，但 PR 審閱時間增加了 91%。[^6] AI 程式碼生成的速度創造了一股壓倒人工審閱能力的程式碼洪流。對於單獨的維護者，這是站不住腳的。

## SQLite 先例

VMark 不是第一個限制貢獻的專案。SQLite — 世界上部署最廣泛的軟體庫之一 — 在其整個歷史中一直是「開源，但非開放貢獻」。該專案不接受網路上隨機人員的補丁。貢獻者可以建議變更並包含概念驗證程式碼，但核心開發者通常從頭重寫補丁。[^7]

SQLite 的理由不同（他們需要維護公共領域狀態），但結果是相同的：**通過讓一個擁有完整情境的單一團隊撰寫所有程式碼來維護品質**。外部貢獻透過 Bug 報告和功能建議而不是直接的程式碼變更來引導。

其他著名的專案採用了類似的立場。仁慈獨裁者（BDFL）模式 — 歷史上被 Python（Guido van Rossum）、Linux（Linus Torvalds）等使用 — 將最終權威集中於一個確保架構一致性的人身上。[^8] VMark 只是讓這一點明確化：「獨裁者」是 AI，由維護者監督。

## 為什麼 Issues 效果更好

Issue 是**規格說明**，而不是實作。它描述了什麼是錯的或什麼是需要的，而不承諾特定的解決方案。這是貢獻者與 AI 維護的程式碼庫之間更好的介面：

| 貢獻類型 | 提供什麼 | 風險 |
|---------|---------|------|
| Pull Request | 你必須理解、審閱、測試和維護的程式碼 | 慣例漂移、情境丟失、審閱負擔 |
| Issue | 對期望行為的描述 | 無 — 維護者決定是否以及如何行動 |

### 什麼是好的 Issue

最好的 Issues 讀起來像需求文件：

1. **當前行為** — 現在發生了什麼（Bug 附上重現步驟）
2. **預期行為** — 應該發生什麼
3. **情境** — 為什麼這很重要，你在嘗試做什麼
4. **環境** — 作業系統、VMark 版本、相關設定
5. **截圖或錄影** — 涉及視覺行為時

歡迎使用 AI 撰寫 Issues。事實上，我們鼓勵這樣做。AI 助理可以在幾分鐘內幫你整理成一個詳細、組織良好的 Issue。這個諷刺是有意為之的：**AI 擅長清楚地描述問題，AI 也擅長修復清楚描述的問題。** 而 Issues 巧妙地繞過了瓶頸 — 理解別人的 AI 生成解決方案的模糊中間地帶。

### 提交 Issue 後會發生什麼

1. 維護者閱讀並分類 Issue
2. AI 獲得 Issue 作為情境，以及對程式碼庫的完整了解
3. AI 遵循 TDD 撰寫修復（先測試，再實作）
4. 第二個 AI 模型（Codex）獨立稽核修復
5. 自動化關卡執行（`pnpm check:all` — Lint、測試、覆蓋率、建置）
6. 維護者在情境中審閱變更並合併

這個流水線產生的程式碼是：
- **符合慣例的** — AI 在每個工作階段讀取規則檔案
- **經過測試的** — TDD 是強制要求；覆蓋率閾值被強制執行
- **跨模型驗證的** — 第二個模型稽核邏輯錯誤、安全性和死程式碼
- **架構一致的** — 一個擁有完整情境的 AI 工作階段，而不是許多片段的集合

## 更大的圖景

AI 時代正在迫使重新思考開源貢獻如何運作。傳統模式 — 複製、分支、程式設計、PR、審閱、合併 — 假設人類撰寫程式碼，其他人類能閱讀它。當 AI 生成程式碼時，兩個假設都弱化了。

2025 年對專業開發者的一項調查發現，他們「不進行 Vibe Coding；相反，他們透過規劃和監督謹慎地控制代理。」[^9] 重點在於**控制和情境** — 而當一個 PR 從外部貢獻者的無關 AI 工作階段到來時，這正是失去的東西。

我們相信 AI 時代開源的未來看起來是不同的：

- **Issues 成為主要貢獻** — 描述問題是一種普遍技能
- **維護者控制 AI** — 擁有完整情境的一個團隊產出一致的程式碼
- **跨模型驗證取代人工審閱** — 對抗性 AI 稽核捕捉人類遺漏的問題
- **測試取代信任** — 自動化關卡，而非審閱者判斷，決定程式碼是否正確

VMark 正在公開地實驗這個模式。它可能不是每個專案的正確方法。但對於一個由一個人使用 AI 工具維護的 Vibe Coding 程式碼庫，它是產出最好軟體的方法。

## 如何貢獻

**提交一個 Issue。** 就這樣。你提供越多細節，修復就越好。

- **[Bug 回報](https://github.com/xiaolai/vmark/issues/new?template=bug_report.yml)**
- **[功能請求](https://github.com/xiaolai/vmark/issues/new?template=feature_request.yml)**

你的 Issue 成為 AI 的規格說明。清晰的 Issue 帶來正確的修復。模糊的 Issue 帶來來回溝通。在描述上投入心力 — 這直接決定了結果的品質。

---

[^1]: Karpathy, A. (2025). [Vibe coding](https://en.wikipedia.org/wiki/Vibe_coding). 最初在社群媒體帖子中描述，這個詞迅速進入主流開發者詞彙。維基百科指出 Vibe Coding「依賴 AI 工具從自然語言提示生成程式碼，減少或消除開發者手動撰寫程式碼的需求。」

[^2]: Jury, J. et al. (2025). ["I Would Have Written My Code Differently": Beginners Struggle to Understand LLM-Generated Code](https://dl.acm.org/doi/pdf/10.1145/3696630.3731663). *FSE Companion '25*, 第 33 屆 ACM 軟體工程基礎國際會議。研究發現，沒有撰寫 AI 提示的開發者在理解和推理生成的程式碼方面有顯著困難。

[^3]: CodeRabbit. (2025). [AI-Assisted Pull Requests Report](https://www.helpnetsecurity.com/2025/12/23/coderabbit-ai-assisted-pull-requests-report/). 對 50 萬多個 PR 的分析發現，AI 生成的 PR 每個有 10.83 個問題，vs 人工 PR 的 6.45 個（多 1.7 倍），邏輯和正確性錯誤多 75%，嚴重問題多 1.4 倍。

[^4]: Osmani, A. (2025). [Code Review in the Age of AI](https://addyo.substack.com/p/code-review-in-the-age-of-ai). 分析了 AI 生成程式碼如何與現有程式碼庫互動，指出 AI 傾向於建立偏離已建立專案慣例的不一致模式。

[^5]: Weavy. (2025). [You Can't Vibe Code Your Way Out of a Vibe Coding Mess](https://www.weavy.com/blog/you-cant-vibe-code-your-way-out-of-a-vibe-coding-mess). 記錄了在隔離的 AI 工作階段中生成的 Vibe Coded 功能在組合時如何產生架構衝突，因為每個工作階段都缺乏其他工作階段中做出的決策的意識。

[^6]: SoftwareSeni. (2025). [Why AI Coding Speed Gains Disappear in Code Reviews](https://www.softwareseni.com/why-ai-coding-speed-gains-disappear-in-code-reviews/). 回報稱雖然 AI 輔助的開發者完成了 21% 更多的任務並合併了 98% 更多的 PR，PR 審閱時間增加了 91% — 揭示 AI 將瓶頸從撰寫轉移到審閱。

[^7]: SQLite. [SQLite Copyright](https://sqlite.org/copyright.html). SQLite 從一開始就是「開源，但非開放貢獻」。為了維護公共領域狀態和程式碼品質，該專案不接受外部貢獻者的補丁。貢獻者可以建議變更，但核心團隊從頭重寫實作。

[^8]: Wikipedia. [Benevolent Dictator for Life](https://en.wikipedia.org/wiki/Benevolent_dictator_for_life). 仁慈獨裁者（BDFL）治理模式，被 Python、Linux 和許多其他專案歷史性地使用，將架構權威集中於一人以維護一致性。著名的 BDFL 包括 Guido van Rossum（Python）、Linus Torvalds（Linux）和 Larry Wall（Perl）。

[^9]: Dang, H.T. et al. (2025). [Professional Software Developers Don't Vibe, They Control: AI Agent Use for Coding in 2025](https://arxiv.org/html/2512.14012). 對專業開發者的調查發現，他們透過規劃和監督對 AI 代理保持嚴格的控制，而不是採用放手的「Vibe Coding」方法。
