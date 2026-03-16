# 영어 프롬프트가 더 나은 코드를 생성하는 이유

AI 코딩 도구는 영어 프롬프트를 줄 때 더 잘 작동합니다 — 영어가 모국어가 아니더라도. VMark는 자동으로 프롬프트를 번역하고 정제하는 훅을 제공합니다.

## AI 코딩에서 영어가 중요한 이유

### LLM은 영어로 사고합니다

대형 언어 모델은 내부적으로 영어와 강하게 정렬된 표현 공간을 통해 모든 언어를 처리합니다.[^1] 비영어 프롬프트를 모델에 보내기 전에 영어로 미리 번역하면 출력 품질이 측정 가능하게 향상됩니다.[^2]

실제로, "把这个函数改成异步的"와 같은 중국어 프롬프트는 작동하지만, 영어 동등어 "Convert this function to async"는 더 적은 반복으로 더 정확한 코드를 생성합니다.

### 도구 사용이 프롬프트 언어를 상속합니다

AI 코딩 도구가 웹을 검색하거나, 문서를 읽거나, API 참조를 조회할 때 해당 쿼리에 프롬프트 언어를 사용합니다. 영어 쿼리가 더 나은 결과를 찾는 이유:

- 공식 문서, Stack Overflow, GitHub 이슈가 주로 영어입니다
- 기술 검색 용어가 영어에서 더 정확합니다
- 코드 예시와 오류 메시지가 거의 항상 영어입니다

"状态管理"에 대한 중국어 프롬프트는 중국어 리소스를 검색하여 표준 영어 문서를 놓칠 수 있습니다. 다국어 벤치마크에서 영어와 다른 언어 사이에 최대 24%의 성능 격차를 일관되게 보여줍니다 — 프랑스어나 독일어 같이 잘 표현된 언어조차도.[^3]

## `::` 프롬프트 정제 훅

VMark의 `.claude/hooks/refine_prompt.mjs`는 Claude에 도달하기 전에 프롬프트를 가로채서 영어로 번역하고 최적화된 코딩 프롬프트로 정제하는 [UserPromptSubmit 훅](https://docs.anthropic.com/en/docs/claude-code/hooks)입니다.

### 사용 방법

프롬프트 앞에 `::` 또는 `>>`를 붙이세요:

```
:: 把这个函数改成异步的
```

훅이 하는 일:
1. 번역 및 정제를 위해 Claude Haiku (빠르고 저렴함)에게 텍스트를 보냅니다
2. 원래 프롬프트가 전송되는 것을 차단합니다
3. 정제된 영어 프롬프트를 클립보드에 복사합니다
4. 결과를 표시합니다

그런 다음 (`Cmd+V`)로 정제된 프롬프트를 붙여넣고 Enter를 눌러 전송합니다.

### 예시

**입력:**
```
:: 这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下
```

**정제된 출력 (클립보드에 복사됨):**
```
Optimize this component to prevent unnecessary re-renders when the parent component updates. Use React.memo, useMemo, or useCallback as appropriate.
```

### 기능

훅은 Haiku에게 다음을 제공하는 신중하게 구조화된 시스템 프롬프트를 사용합니다:

- **Claude Code 인식** — 대상 도구의 기능 파악 (파일 편집, Bash, Glob/Grep, MCP 도구, 계획 모드, 서브에이전트)
- **프로젝트 컨텍스트** — `.claude/hooks/project-context.txt`에서 로드하여 Haiku가 기술 스택, 규약, 주요 파일 경로를 알 수 있음
- **우선순위 규칙** — 의도 보존 우선, 번역, 범위 명확화, 불필요한 내용 제거
- **혼합 언어 처리** — 산문은 번역하지만 기술 용어는 번역 안 함 (`useEffect`, 파일 경로, CLI 명령어)
- **퓨샷 예시**[^4] — 중국어, 모호한 영어, 혼합 언어, 다단계 요청을 다루는 7쌍의 입출력
- **출력 길이 지침** — 간단한 요청에는 1–2문장, 복잡한 것에는 3–5문장

입력이 이미 명확한 영어 프롬프트라면 최소한의 변경으로 반환됩니다.

### 설정

훅은 VMark의 `.claude/settings.json`에 미리 구성되어 있습니다. Claude Code와 함께 자동으로 사용 가능한 [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk)가 필요합니다.

추가 설정이 필요 없습니다 — 그냥 `::` 또는 `>>` 접두사를 사용하세요.

::: tip 건너뛸 때
짧은 명령어 (`go ahead`, `yes`, `continue`, `option 2`)의 경우 접두사 없이 전송하세요. 훅은 불필요한 왕복을 피하기 위해 이것들을 무시합니다.
:::

## 영어 사용자에게도 작동합니다

영어로 쓰더라도 `>>` 접두사는 프롬프트 최적화에 유용합니다:

```
>> make the thing work better with the new API
```

다음이 됩니다:
```
Update the integration to use the new API. Fix any deprecated method calls and ensure error handling follows the updated response format.
```

정제가 구체성과 구조를 추가하여 AI가 첫 번째 시도에서 더 나은 코드를 생성하는 데 도움을 줍니다.[^5]

[^1]: 다국어 LLM은 입출력 언어에 관계없이 영어에 가장 가까운 표현 공간에서 핵심 결정을 내립니다. logit 렌즈를 사용하여 내부 표현을 탐색한 연구자들은 의미 있는 단어 ("water"나 "sun" 같은)가 대상 언어로 번역되기 전에 영어로 선택된다는 것을 발견했습니다. 참조: Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: 비영어 프롬프트를 추론 전에 체계적으로 영어로 미리 번역하면 여러 작업과 언어에 걸쳐 LLM 출력 품질이 향상됩니다. 참조: Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: MMLU-ProX 벤치마크 — 29개 언어로 11,829개의 동일한 질문 — 에서 영어와 저자원 언어 사이에 최대 24.3%의 성능 격차를 발견했습니다. 프랑스어와 독일어 같이 잘 표현된 언어조차 측정 가능한 저하를 보입니다. 참조: [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024).

[^4]: 퓨샷 프롬프팅 — 프롬프트 내에 입출력 예시 제공 — 은 LLM 작업 성능을 극적으로 향상시킵니다. 획기적인 GPT-3 논문에서 제로샷 성능은 모델 크기에 따라 꾸준히 향상되지만 퓨샷 성능은 *더 빠르게* 증가한다는 것을 보여주었습니다. 참조: Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: 구조화되고 잘 설계된 프롬프트는 코드 생성 작업에서 모호한 지시보다 일관되게 더 나은 성능을 보입니다. 연쇄 사고 추론, 역할 할당, 명시적 범위 제약 등의 기법이 모두 첫 번째 시도 정확도를 향상시킵니다. 참조: Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
