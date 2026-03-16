# 구독 vs API 가격 책정

AI 코딩 도구는 두 가지 인증 방법을 제공합니다: **구독 플랜**과 **API 키**. 지속적인 코딩 세션 (바이브 코딩)에서 구독이 극적으로 저렴합니다 — 동일한 작업에 API 청구보다 종종 10–30배 저렴합니다.[^1]

## 비용 차이

일반적인 활성 코딩 세션은 시간당 수십만 토큰을 사용합니다. 비용 비교:

### Claude Code

| 방법 | 비용 | 제공 내용 |
|------|------|----------|
| **Claude Max** (구독) | 월 $100–200 | 코딩 세션 중 무제한 사용 |
| **API 키** (`ANTHROPIC_API_KEY`) | 월 $600–2,000+ | 토큰당 요금; 헤비 사용 시 빠르게 누적 |

**인증 명령어:**
```bash
claude          # Claude Max 구독으로 자동 로그인 (권장)
```

### Codex CLI (OpenAI)

| 방법 | 비용 | 제공 내용 |
|------|------|----------|
| **ChatGPT Plus** (구독) | 월 $20 | 보통 사용 |
| **ChatGPT Pro** (구독) | 월 $200 | 헤비 사용 |
| **API 키** (`OPENAI_API_KEY`) | 월 $200–1,000+ | 토큰당 요금 |

**인증 명령어:**
```bash
codex login     # ChatGPT 구독으로 로그인 (권장)
```

### Gemini CLI (Google)

| 방법 | 비용 | 제공 내용 |
|------|------|----------|
| **무료 티어** | $0 | 넉넉한 무료 할당량 |
| **Google One AI Premium** | ~월 $20 | 더 높은 한도 |
| **API 키** (`GEMINI_API_KEY`) | 변동 | 토큰당 요금 |

**인증 명령어:**
```bash
gemini          # Google 계정으로 로그인 (권장)
```

## 경험 법칙

> **구독 = 지속적인 코딩 세션에서 10–30배 저렴.**

수학은 간단합니다: 구독은 정액 월정요금을 제공하고, API 청구는 토큰당 요금입니다. AI 코딩 도구는 극도로 토큰을 많이 소비합니다 — 전체 파일을 읽고, 긴 코드 블록을 생성하고, 여러 라운드의 편집을 반복합니다. 단일 복잡한 기능이 수백만 토큰을 소비할 수 있습니다.[^2]

## API 키가 여전히 의미 있는 경우

API 키가 올바른 선택인 경우:

| 사용 사례 | 이유 |
|----------|------|
| **CI/CD 파이프라인** | 간헐적으로 짧게 실행되는 자동화 작업 |
| **가벼운 또는 가끔 사용** | 주당 몇 가지 쿼리 |
| **프로그래밍 방식 접근** | API를 직접 호출하는 스크립트 및 통합 |
| **팀/조직 청구** | API 사용 대시보드를 통한 중앙 청구 |

AI와 몇 시간 동안 주고받으며 대화하는 인터랙티브 코딩 세션에서 — 구독이 항상 비용 면에서 이깁니다.[^3]

## VMark에서 설정

VMark의 `AGENTS.md`는 프로젝트 규약으로 구독 우선 인증을 강제합니다. 저장소를 클론하고 AI 코딩 도구를 열면 구독 인증을 사용하도록 상기시켜 줍니다:

```
Prefer subscription auth over API keys for all AI coding tools.
```

인증 후 세 가지 도구 모두 즉시 작동합니다:

```bash
# 권장: 구독 인증
claude              # Claude Max로 Claude Code
codex login         # ChatGPT Plus/Pro로 Codex CLI
gemini              # Google 계정으로 Gemini CLI

# 대체: API 키
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AI...
```

::: tip macOS GUI 앱을 위한 PATH
macOS GUI 앱 (Spotlight에서 실행된 터미널 등)은 최소한의 PATH를 가집니다. 도구가 터미널에서는 작동하지만 Claude Code가 찾을 수 없다면 바이너리 위치가 셸 프로필 (`~/.zshrc` 또는 `~/.bashrc`)에 있는지 확인하세요.
:::

[^1]: 일반적인 집중 AI 코딩 세션은 상호 작용당 50,000–100,000+ 토큰을 소비합니다. 현재 API 요금 (예: 백만 입력/출력 토큰당 $3/$15인 Claude Sonnet)에서 헤비 사용자는 월 API 비용으로 $200–$2,000+를 보고합니다 — 구독 플랜은 무제한 사용에 월 $100–$200으로 상한이 있습니다. 차이는 사용 강도에 따라 커집니다. 참조: [AI Development Tools Pricing Analysis](https://vladimirsiedykh.com/blog/ai-development-tools-pricing-analysis-claude-copilot-cursor-comparison-2025) (2025); [Claude Code Token Limits Guide](https://www.faros.ai/blog/claude-code-token-limits), Faros AI (2025).

[^2]: AI 코딩 에이전트는 간단한 채팅 상호 작용보다 훨씬 더 많은 토큰을 소비합니다. 전체 파일을 컨텍스트에 읽고, 다중 파일 편집을 생성하고, 반복 수정-테스트 루프를 실행하고, 긴 세션 동안 대화 기록을 유지하기 때문입니다. 참조: [The Real Cost of Vibe Coding](https://smarterarticles.co.uk/the-real-cost-of-vibe-coding-when-ai-over-delivers-on-your-dime) (2025).

[^3]: 더 넓은 SaaS 업계는 정액 구독과 사용량 기반 구성 요소를 결합한 하이브리드 가격 책정 모델로 이동하고 있습니다. 2023년까지 SaaS 기업의 46%가 사용량 기반 가격 책정을 채택했습니다. 그러나 모든 쿼리가 눈에 띄는 컴퓨팅을 소비하는 AI 기반 도구의 경우, 순수 사용량 기반 가격 책정은 사용자를 예측할 수 없는 비용에 노출시킵니다 — 헤비 개인 사용자에게 정액 구독이 매력적인 이유입니다. 참조: [The State of SaaS Pricing Strategy](https://www.invespcro.com/blog/saas-pricing/) (2025).
