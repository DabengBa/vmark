# 為什麼昂貴的模型反而更便宜

::: info TL;DR
最強大的 AI 模型雖然每 Token 貴了 67%，但**每任務成本卻便宜了 60%** — 因為它使用更少的 Token、需要更少的迭代次數，而且產生的錯誤少了 50–75%。對於無法閱讀程式碼的 Vibe Coder 來說，模型品質不是效率問題 — 它是整個流水線中唯一的安全網。
:::

::: details 最後驗證：2026 年 2 月
本文中的基準測試分數、模型名稱和定價反映了截至 2026 年 2 月的市場狀況。核心論點 — 每任務成本比每 Token 價格更重要 — 即使具體數字改變，依然站得住腳。
:::

最昂貴的 AI 程式設計模型幾乎永遠是最便宜的選擇 — 當你衡量真正重要的事情時。每 Token 價格是個干擾。決定你實際成本的是**完成工作需要多少 Token**、你要經歷多少次迭代，以及你花多少時間審閱和修復輸出。

## 定價的幻覺

以下是 Claude 模型的 API 價格：

| 模型 | 輸入（每 100 萬 Token） | 輸出（每 100 萬 Token） |
|------|----------------------|----------------------|
| Claude Opus 4.5 | $5 | $25 |
| Claude Sonnet 4.5 | $3 | $15 |

Opus 看起來貴了 67%。大多數人就此打住，選擇 Sonnet。這是錯誤的算法。

### 實際發生了什麼

Anthropic 的基準測試講述了一個不同的故事。在中等努力程度下，Opus 4.5 以**少 76% 的輸出 Token** 達到了 Sonnet 4.5 的最佳 SWE-bench 分數。在最高努力程度下，Opus 以少 48% 的 Token **超越** Sonnet 4.3 個百分點。[^1]

讓我們來做正確的計算：

| | Sonnet 4.5 | Opus 4.5 |
|--|-----------|----------|
| 每任務輸出 Token | ~500 | ~120 |
| 每 100 萬輸出 Token 價格 | $15 | $25 |
| **每任務成本** | **$0.0075** | **$0.0030** |

Opus 的**每任務成本便宜了 60%** — 儘管每 Token 貴了 67%。[^2]

這不是特別挑選的例子。在長時間的程式設計任務上，Opus 以**高達 65% 更少的 Token** 和 **50% 更少的工具呼叫**達到更高的通過率。[^1]

## 迭代稅

Token 成本只是故事的一部分。更大的成本是**迭代次數** — 需要多少輪「生成-審閱-修復」才能得到正確的程式碼。

Opus 4.5 在 **4 次迭代**內達到峰值性能。競爭模型需要**多達 10 次嘗試**才能達到相似的品質。[^1] 每次失敗的迭代都要付出代價：

- **Token** — 模型重新讀取情境並再次生成
- **時間** — 你審閱輸出、找到問題、重新提示
- **注意力** — 在「這對嗎？」和「哪裡錯了？」之間切換情境

以每小時 75 美元的開發者費率，每次需要 15 分鐘來審閱和修正的失敗迭代，就消耗了 **18.75 美元**的人力時間。六次額外迭代（4 次和 10 次之間的差距）每個複雜任務就消耗了 **112.50 美元**的開發者時間。Token 成本差異？大約半美分。[^3]

**開發者時間節省的價值是 Token 成本差異的 22,500 倍。**

## 錯誤倍增器

較便宜的模型不只是需要更多迭代 — 它們還會產生更多逃到生產環境的錯誤。

Opus 4.5 與其他模型相比，工具呼叫錯誤和建置/Lint 錯誤都**減少了 50–75%**。[^1] 這很重要，因為逃出程式設計工作階段的錯誤在下游會變得非常昂貴：

- 在程式設計期間捕捉到的 Bug，花幾分鐘修復
- 在程式碼審閱時捕捉到的 Bug，花一小時（你加上審閱者的時間）
- 在生產環境中捕捉到的 Bug，花好幾天（除錯、緊急修復、溝通、事後分析）

Faros AI 的研究 — 涵蓋 1,255 個團隊和 10,000 多名開發者 — 發現高 AI 採用率與每位開發者的 **Bug 增加 9%** 和 **PR 審閱時間增加 91%** 相關。[^4] 當 AI 以較低準確率生成更多程式碼時，審閱瓶頸完全吸收了「生產力」的提升。

第一次就做對的模型可以避免這個連鎖效應。

## SWE-bench 的證據

SWE-bench Verified 是評估 AI 程式設計能力在真實軟體工程任務上的行業標準。2026 年 2 月的排行榜：[^5]

| 模型 | SWE-bench Verified |
|------|-------------------|
| Claude Opus 4.5 | **80.9%** |
| Claude Opus 4.6 | 80.8% |
| GPT-5.2 | 80.0% |
| Gemini 3 Flash | 78.0% |
| Claude Sonnet 4.5 | 77.2% |
| Gemini 3 Pro | 76.2% |

Opus 4.5 和 Sonnet 4.5 之間 3.7 個百分點的差距，意味著 Opus 能解決 Sonnet 失敗的**大約每 27 個任務中多 1 個**。當每次失敗都觸發一次手動除錯工作階段時，成本就會快速累積。

但這裡有個真正的關鍵 — 當研究人員衡量**每個已解決任務的成本**而不是每 Token 成本時，Opus 比 Sonnet 更便宜：

| 模型 | 每任務成本 | SWE-bench 分數 |
|------|----------|--------------|
| Claude Opus 4.5 | ~$0.44 | 80.9% |
| Claude Sonnet 4.5 | ~$0.50 | 77.2% |

Sonnet **每任務成本更高**，卻**解決更少的任務**。[^6]

## Codex CLI：相同模式，不同廠商

OpenAI 的 Codex CLI 在推理努力程度上展現了相同的動態：

- **中等推理**：速度和智慧的平衡 — 預設值
- **超高（xhigh）推理**：思考更長，給出更好的答案 — 適合困難任務

GPT-5.1-Codex-Max 在中等努力程度下的表現優於標準 GPT-5.1-Codex，同時使用**少 30% 的思考 Token**。[^7] 高階模型更省 Token 是因為它推理得更好 — 它不需要生成那麼多中間步驟就能得出正確答案。

跨廠商的模式是普遍的：**更聰明的模型浪費更少的運算資源。**

## METR 的警告

METR 的隨機對照試驗提供了一個關鍵的警示故事。16 位有經驗的開發者（每小時 150 美元）在 246 個任務中使用了 AI 工具。結果：開發者在有 AI 協助的情況下**慢了 19%**。更驚人的是 — 開發者*認為*自己快了 20%，感知差距接近 39 個百分點。[^8]

該研究使用的是 **Sonnet 等級的模型**（透過 Cursor Pro 使用 Claude 3.5/3.7 Sonnet），而不是 Opus。不到 44% 的 AI 生成程式碼被接受。

這表明品質門檻極為重要。一個讓你接受 44% 程式碼的模型會讓你變慢 — 你花在審閱和拒絕上的時間比節省的時間更多。一個減少 50–75% 錯誤且第一次就準確得多的模型，完全可以扭轉這個等式。

**METR 的研究並不是說 AI 程式設計工具很慢。它說的是平庸的 AI 程式設計工具很慢。**

## 技術債：你沒算進去的那 75%

編寫程式碼的前期成本只佔其生命週期總成本的 **15–25%**。剩餘的 **75–85%** 用於維護、運營和 Bug 修復。[^9]

GitClear 對 2020–2024 年產生的程式碼的分析發現，與 AI 工具採用相關的重複程式碼區塊**增加了 8 倍**，程式碼流失率**增加了 2 倍**。SonarSource 發現，與前代相比，Claude Sonnet 4 的輸出中 BLOCKER 級別的 Bug **增加了 93%**。[^10]

如果較便宜的模型生成嚴重 Bug 比例接近翻倍的程式碼，而維護消耗了生命週期成本的 75–85%，那麼在程式碼生成上「節省」的費用就被下游成本淹沒了。維護成本最低的程式碼，是第一次就寫對的程式碼。

## 訂閱制的算術

對於重度使用者，訂閱制 vs API 的選擇進一步放大了模型品質的論點。

| 方案 | 每月費用 | 你得到什麼 |
|------|---------|----------|
| Claude Max（$100） | $100 | 高量 Opus 使用 |
| Claude Max（$200） | $200 | 無限 Opus |
| 等效 API 使用量 | $3,650+ | 同樣的 Opus Token |

訂閱制大約**便宜 18 倍**，效果相同。[^11] 以訂閱價格，使用最佳模型的邊際成本為零 — 「昂貴」的模型在每次額外查詢時實際上是免費的。

訂閱制下 Claude Code 的平均費用：**每位開發者每天 6 美元**，90% 的使用者低於每天 12 美元。[^12] 以每小時 75 美元的開發者薪資，**每天節省 5 分鐘**就已足夠支付訂閱費。超出的一切都是純粹的回報。

## 複合論點

以下是為什麼隨著時間推移，這個算術差距會越來越大：

### 1. 更少的迭代 = 更少的情境污染

每次失敗的嘗試都會被加入對話歷史。長對話會降低模型性能 — 訊噪比下降。一個在 4 次迭代就成功的模型擁有比折騰了 10 次的模型更乾淨的情境，這意味著它之後的回應也更好。

### 2. 更少的錯誤 = 更少的審閱疲勞

GitHub Copilot 的生產力研究發現，隨著任務難度增加，收益也在增加。[^13] 困難任務是便宜模型最常失敗的地方 — 也是昂貴模型大放異彩的地方。ZoomInfo 的案例研究顯示了 AI 帶來的 **40–50% 的生產力提升**，差距隨複雜度增加而擴大。

### 3. 更好的程式碼 = 更好的學習

如果你是一個正在提升技能的開發者（每個開發者都應該如此），你讀到的程式碼會塑造你的直覺。持續閱讀正確、結構良好的 AI 輸出，能培養良好的習慣。閱讀充滿 Bug 的冗長輸出，則會養成不好的習慣。

### 4. 正確的程式碼交付得更快

你不需要的每一次迭代，都是一個更早交付的功能。在競爭激烈的市場中，開發速度 — 以交付的功能衡量，而不是生成的 Token — 才是重要的。

## 對 Vibe Coder 來說，這不是成本問題 — 而是生存問題

以上所有內容都適用於能夠閱讀差異、發現 Bug 和修復損壞程式碼的專業開發者。但有一個快速成長的群體，對他們來說，模型品質論點不是效率問題 — 而是軟體是否能運作的問題。這些是 **100% 的 Vibe Coder**：完全透過自然語言提示構建真實應用程式的非程式設計師，他們沒有能力閱讀、稽核或理解生成的任何一行程式碼。

### 無形的風險

對於專業開發者來說，生成有 Bug 程式碼的便宜模型是**令人惱火的** — 他們在審閱時發現 Bug，修復它，繼續前進。對於非程式設計師，同樣的 Bug 是**不可見的**。它直接進入生產環境而不被察覺。

這個問題的規模是驚人的：

- **Veracode** 測試了 100 多個 LLM，發現 AI 生成的程式碼在 **45% 的任務**中引入了安全漏洞。Java 最糟糕，超過 70%。關鍵是，更新和更大的模型在安全性上沒有顯著改善 — 這個問題是結構性的，不是代際的。[^14]
- **CodeRabbit** 分析了 470 個開源 PR，發現 AI 撰寫的程式碼的主要問題是人工程式碼的 **1.7 倍**，嚴重問題是 **1.4 倍**。邏輯錯誤高出 75%。性能問題（過多 I/O）是 **8 倍**。安全漏洞是 **1.5–2 倍**。[^15]
- **BaxBench** 和 NYU 的研究證實，**40–62% 的 AI 生成程式碼**包含安全漏洞 — 跨站腳本攻擊、SQL 注入、缺少輸入驗證 — 這些漏洞不會讓應用崩潰，但會悄悄暴露每個使用者的資料。[^16]

專業開發者能認出這些模式。Vibe Coder 不知道它們的存在。

### 真實世界的災難

這不是理論上的。2025 年，安全研究員 Matt Palmer 發現，使用 Lovable — 一個流行的 Vibe Coding 平台 — 建置的 **1,645 個應用程式中有 170 個**有致命的資料庫安全設定錯誤。網際網路上的任何人都可以讀取和寫入他們的資料庫。暴露的資料包括全名、電子郵件地址、電話號碼、家庭地址、個人債務金額和 API 金鑰。[^17]

Escape.tech 進行了更深入的調查，掃描了在 Lovable、Base44、Create.xyz 和 Bolt.new 等平台上**公開部署的 5,600 多個 Vibe Coding 應用程式**。他們發現了超過 **2,000 個漏洞**、**400 多個暴露的秘密**和 **175 個暴露的個人身份資訊實例**，包括醫療記錄、國際銀行帳號和電話號碼。[^18]

這些不是開發者的錯誤。開發者 — 如果我們可以這樣稱呼他們的話 — 根本不知道這些漏洞的存在。他們請 AI 建置一個應用程式，應用程式看起來能運作，就部署了。安全漏洞對任何不會閱讀程式碼的人來說都是不可見的。

### 供應鏈陷阱

非程式設計師面臨一個即使是有經驗的開發者也難以察覺的威脅：**Slopsquatting**（套件名稱幻覺攻擊）。AI 模型會幻覺出套件名稱 — 大約 20% 的程式碼樣本引用了不存在的套件。攻擊者註冊這些幻覺出來的套件名稱並注入惡意軟體。當 Vibe Coder 的 AI 建議安裝該套件時，惡意軟體就自動進入了他們的應用程式。[^19]

開發者可能會注意到一個不熟悉的套件名稱並去查證它。Vibe Coder 則會安裝 AI 告訴他們安裝的任何東西。他們沒有判斷什麼是合法、什麼是幻覺的參考框架。

### 為什麼模型品質是唯一的安全網

Palo Alto Networks 的 Unit 42 研究團隊直白地說：公民開發者 — 沒有開發背景的人 — 「缺乏如何編寫安全程式碼的訓練，可能對應用程式生命週期中所需的安全要求沒有充分的了解。」他們的調查發現了真實世界的**資料洩露、認證繞過和任意程式碼執行**，直接追溯到 Vibe Coding 的應用程式。[^20]

對於專業開發者，程式碼審閱、測試和安全稽核作為安全網，能捕捉到模型遺漏的問題。Vibe Coder **沒有這些安全網**。他們無法審閱他們讀不懂的程式碼。他們無法為他們不理解的行為撰寫測試。他們無法稽核他們從未聽說過的安全屬性。

這意味著 AI 模型本身是整個流水線中**唯一**的品質管制。模型引入的每個缺陷都會直接送達使用者。沒有第二次機會，沒有人工檢查點，沒有安全網。

這正是模型品質最重要的地方：

- **Opus 產生 50–75% 更少的錯誤**，比便宜的模型。[^1] 對於完全無法捕捉錯誤的 Vibe Coder，這是能運作的應用程式和悄悄洩露使用者資料的應用程式之間的差距。
- **Opus 在 4 次迭代內達到峰值性能**，而不是 10 次。[^1] 每次額外迭代意味著 Vibe Coder 必須用自然語言描述問題（他們無法指出哪一行是錯的），希望 AI 能理解，並希望修復不會引入他們同樣看不見的新 Bug。
- **Opus 在前沿模型中對提示注入的抵抗力最高** — 當 Vibe Coder 正在建置需要處理他們無法自己消毒的使用者輸入的應用程式時，這一點至關重要。
- **Opus 每任務使用更少的 Token**，意味著它生成更少的程式碼來完成同樣的目標 — 更少的程式碼意味著更少的攻擊面，更少的地方讓 Bug 藏身在永遠不會有人讀到的程式碼中。

對於開發者來說，便宜的模型是生產力稅。對於 Vibe Coder 來說，便宜的模型是**一種責任**。模型不是他們的助手 — 它是他們的**整個工程團隊**。當你沒有能力檢查工作成果時，雇用最便宜的「工程師」不是節儉。而是魯莽。

### 非程式設計師的真正選擇

如果你不會閱讀程式碼，你不是在選擇便宜工具還是昂貴工具。你是在選擇：

1. **一個 55% 的時間能正確處理安全性的模型**（你永遠不會知道另外 45% 的情況）
2. **一個 80% 以上的時間能正確處理安全性的模型**（並且產生少得多的那些悄無聲息摧毀業務的隱藏 Bug）

每 Token 多 67% 的溢價，相對於你沒意識到可能發生的資料洩露成本、寫在你讀不懂的程式碼中、部署給真實使用者的應用程式，完全微不足道。

**對於 Vibe Coder，昂貴的模型不是更便宜的選擇。它是唯一負責任的選擇。**

## 決策框架

| 如果你… | 使用… | 原因 |
|---------|------|------|
| 每天大量程式設計 | Opus + 訂閱制 | 零邊際成本，最高品質 |
| 處理複雜任務 | Extra-high / Opus | 更少迭代，更少 Bug |
| 維護長期程式碼 | 現有最佳模型 | 技術債才是真正的成本 |
| Vibe Coding 而不閱讀程式碼 | **Opus — 不可妥協** | 模型是你唯一的安全網 |
| 預算有限 | 仍然是訂閱制的 Opus | $200/月 < 除錯便宜輸出的成本 |
| 執行快速的一次性查詢 | Sonnet / 中等努力 | 簡單任務的品質門檻影響較小 |

便宜模型唯一勝出的場景，是**任何模型第一次嘗試都能成功的瑣碎任務**。其他所有情況 — 也就是大部分真實的軟體工程 — 昂貴的模型才是便宜的選擇。

## 結論

每 Token 定價是虛榮指標。每任務成本才是真正的指標。而在每任務成本上，最強大的模型始終勝出 — 不是差一點點，而是數倍之差：

- 每任務**便宜 60%**（Token 更少）
- 達到峰值性能所需迭代**少 60%**
- 錯誤**少 50–75%**
- 開發者時間節省價值是 Token 成本差異的 **22,500 倍**

最昂貴的模型不是奢侈品。它是任何重視自己時間的人的最低可行選擇。

[^1]: Anthropic (2025). [Introducing Claude Opus 4.5](https://www.anthropic.com/news/claude-opus-4-5). 主要發現：在中等努力程度下，Opus 4.5 以少 76% 的輸出 Token 達到了 Sonnet 4.5 的最佳 SWE-bench 分數；在最高努力程度下，Opus 以少 48% 的 Token 超越 Sonnet 4.3 個百分點；工具呼叫和建置/Lint 錯誤減少了 50–75%；4 次迭代就達到峰值性能，競爭對手最多需要 10 次。

[^2]: claudefa.st (2025). [Claude Opus 4.5: 67% Cheaper, 76% Fewer Tokens](https://claudefa.st/blog/models/claude-opus-4-5). 分析顯示每 Token 的價格溢價被每任務大幅降低的 Token 消耗量完全抵消，使 Opus 成為大多數工作負載的更具成本效益的選擇。

[^3]: 開發者薪資數據來自 Glassdoor（2025）：美國軟體開發者平均薪資 $121,264–$172,049/年。以每小時 $75，每次失敗迭代需要 15 分鐘審閱/修正 = 18.75 美元人力時間。六次額外迭代（4 次和 10 次之間的差距）= 每個複雜任務 $112.50。參見：[Glassdoor Software Developer Salary](https://www.glassdoor.com/Salaries/software-developer-salary-SRCH_KO0,18.htm).

[^4]: Faros AI (2025). [The AI Productivity Paradox](https://www.faros.ai/blog/ai-software-engineering). 對 1,255 個團隊和 10,000 多名開發者的研究發現：高 AI 使用率的個別開發者完成了 21% 更多的任務並合併了 98% 更多的 PR，但 PR 審閱時間增加了 91%，每位開發者的 Bug 增加了 9%，PR 大小增加了 154%。AI 採用率與公司層面的績效改善之間沒有顯著相關性。

[^5]: SWE-bench Verified 排行榜，2026 年 2 月。彙整自 [marc0.dev](https://www.marc0.dev/en/leaderboard)、[llm-stats.com](https://llm-stats.com/benchmarks/swe-bench-verified) 和 [The Unwind AI](https://www.theunwindai.com/p/claude-opus-4-5-scores-80-9-on-swe-bench)。Claude Opus 4.5 是第一個在 SWE-bench Verified 上突破 80% 的模型。

[^6]: JetBrains AI Blog (2026). [The Best AI Models for Coding: Accuracy, Integration, and Developer Fit](https://blog.jetbrains.com/ai/2026/02/the-best-ai-models-for-coding-accuracy-integration-and-developer-fit/). 跨多個模型的每任務成本分析，納入了 Token 消耗和成功率。另見：[AI Coding Benchmarks](https://failingfast.io/ai-coding-guide/benchmarks/) at Failing Fast.

[^7]: OpenAI (2025). [GPT-5.1-Codex-Max](https://openai.com/index/gpt-5-1-codex-max/); [Codex Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide/). Codex-Max 在中等推理努力程度下的表現優於同等努力程度的標準 Codex，同時少用 30% 的思考 Token — 高階模型天生就更省 Token。

[^8]: METR (2025). [Measuring the Impact of Early 2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/). 隨機對照試驗：16 位有經驗的開發者，246 個任務，每小時 $150 薪酬。AI 輔助的開發者慢了 19%。開發者預期快 24% 並事後認為自己快了 20% — 感知差距約 39 個百分點。不到 44% 的 AI 生成程式碼被接受。另見：[arXiv:2507.09089](https://arxiv.org/abs/2507.09089).

[^9]: 軟體生命週期成本的行業數據一致將維護置於總成本的 60–80%。參見：Sommerville, I. (2015). *Software Engineering*, 第 10 版，第 9 章：「發布後更改軟體的成本通常遠超過初始開發成本。」另見：[MIT Sloan: The Hidden Costs of Coding with Generative AI](https://sloanreview.mit.edu/article/the-hidden-costs-of-coding-with-generative-ai/).

[^10]: GitClear (2024). [AI Code Quality Analysis](https://leaddev.com/technical-direction/how-ai-generated-code-accelerates-technical-debt): 重複程式碼區塊增加了 8 倍，程式碼流失率增加了 2 倍（2020–2024）。SonarSource (2025): 對 AI 生成程式碼的分析發現，在每個測試模型中都缺乏安全意識，Claude Sonnet 4 產生的 BLOCKER 級別 Bug 比例接近翻倍 — 嚴重 Bug 引入率增加了 93%。參見：[DevOps.com: AI in Software Development](https://devops.com/ai-in-software-development-productivity-at-the-cost-of-code-quality-2/).

[^11]: Level Up Coding (2025). [Claude API vs Subscription Cost Analysis](https://levelup.gitconnected.com/why-i-stopped-paying-api-bills-and-saved-36x-on-claude-the-math-will-shock-you-46454323346c). 訂閱制 vs API 計費的比較，顯示持續程式設計工作階段的訂閱制大約便宜 18 倍。

[^12]: The CAIO (2025). [Claude Code Pricing Guide](https://www.thecaio.ai/blog/claude-code-pricing-guide). Claude Code 的平均費用：訂閱方案下每位開發者每天 $6，90% 的使用者低於每天 $12。

[^13]: Peng, S. et al. (2023). [The Impact of AI on Developer Productivity: Evidence from GitHub Copilot](https://arxiv.org/abs/2302.06590). 實驗室研究：使用 Copilot 的開發者完成任務速度快了 55.8%。另見：ZoomInfo 案例研究顯示 AI 帶來的 40–50% 生產力提升，差距隨任務難度增加而擴大（[arXiv:2501.13282](https://arxiv.org/html/2501.13282v1)）。

[^14]: Veracode (2025). [2025 GenAI Code Security Report](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/). 對 100 多個 LLM 的 80 個程式設計任務的分析：AI 生成的程式碼在 45% 的情況下引入安全漏洞。Java 最糟，超過 70%，Python/C#/JavaScript 在 38–45% 之間。更新和更大的模型在安全性上沒有顯著改善。另見：[BusinessWire 公告](https://www.businesswire.com/news/home/20250730694951/en/).

[^15]: CodeRabbit (2025). [State of AI vs Human Code Generation Report](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report). 對 470 個開源 GitHub PR（320 個 AI 共同撰寫，150 個純人工）的分析：AI 程式碼有 1.7 倍的主要問題、1.4 倍的嚴重問題、75% 更多的邏輯錯誤、1.5–2 倍的安全漏洞、3 倍的可讀性問題和近 8 倍的性能問題（過多 I/O）。另見：[The Register 報導](https://www.theregister.com/2025/12/17/ai_code_bugs/).

[^16]: BaxBench 和 NYU 的 AI 程式碼安全研究。參見：Tihanyi, N. et al. (2025). [Is Vibe Coding Safe? Benchmarking Vulnerability of Agent-Generated Code in Real-World Tasks](https://arxiv.org/abs/2512.03262). BaxBench 將後端程式設計場景與專家設計的安全漏洞利用結合起來，發現 40–62% 的 AI 生成程式碼包含安全漏洞，包括 XSS、SQL 注入和缺少輸入驗證。

[^17]: Palmer, M. (2025). [Statement on CVE-2025-48757](https://mattpalmer.io/posts/statement-on-CVE-2025-48757/). 對 1,645 個 Lovable 建置應用程式的分析：170 個有致命的行級安全設定錯誤，允許未經認證的存取讀取和寫入使用者資料庫。暴露的個人身份資訊包括姓名、電子郵件、電話號碼、家庭地址、個人債務金額和 API 金鑰。另見：[Superblocks: Lovable Vulnerability Explained](https://www.superblocks.com/blog/lovable-vulnerabilities).

[^18]: Escape.tech (2025). [The State of Security of Vibe Coded Apps](https://escape.tech/state-of-security-of-vibe-coded-apps). 掃描了在 Lovable、Base44、Create.xyz、Bolt.new 等平台上公開部署的 5,600 多個 Vibe Coding 應用程式。發現 2,000 多個漏洞、400 多個暴露的秘密和 175 個暴露的個人身份資訊實例，包括醫療記錄、國際銀行帳號和電話號碼。另見：[Methodology detail](https://escape.tech/blog/methodology-how-we-discovered-vulnerabilities-apps-built-with-vibe-coding/).

[^19]: Lanyado, B. et al. (2025). [AI-hallucinated code dependencies become new supply chain risk](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/). 對 16 個程式碼生成 AI 模型的研究：~20% 的 756,000 個程式碼樣本推薦了不存在的套件。43% 的幻覺套件在不同查詢中被一致重複推薦，使其可被利用。開源模型的幻覺率為 21.7%；商業模型為 5.2%。另見：[HackerOne: Slopsquatting](https://www.hackerone.com/blog/ai-slopsquatting-supply-chain-security).

[^20]: Palo Alto Networks Unit 42 (2025). [Securing Vibe Coding Tools: Scaling Productivity Without Scaling Risk](https://unit42.paloaltonetworks.com/securing-vibe-coding-tools/). 對真實世界 Vibe Coding 安全事件的調查：資料洩露、認證繞過和任意程式碼執行。指出公民開發者「缺乏如何編寫安全程式碼的訓練，可能對應用程式生命週期中所需的安全要求沒有充分的了解。」引入了 SHIELD 治理框架。另見：[Infosecurity Magazine 報導](https://www.infosecurity-magazine.com/news/palo-alto-networks-vibe-coding).
