# 미디어 지원

VMark는 표준 HTML5 태그를 사용하여 마크다운 문서에서 동영상, 오디오, YouTube 임베드를 지원합니다.

## 지원되는 형식

### 동영상

| 형식 | 확장자 |
|------|--------|
| MP4 | `.mp4` |
| WebM | `.webm` |
| MOV | `.mov` |
| AVI | `.avi` |
| MKV | `.mkv` |
| M4V | `.m4v` |
| OGV | `.ogv` |

### 오디오

| 형식 | 확장자 |
|------|--------|
| MP3 | `.mp3` |
| M4A | `.m4a` |
| OGG | `.ogg` |
| WAV | `.wav` |
| FLAC | `.flac` |
| AAC | `.aac` |
| Opus | `.opus` |

## 구문

### 동영상

표준 HTML5 동영상 태그를 사용합니다:

```html
<video src="path/to/video.mp4" controls></video>
```

선택적 속성 포함:

```html
<video src="video.mp4" title="Demo" poster="thumbnail.jpg" controls></video>
```

### 오디오

표준 HTML5 오디오 태그를 사용합니다:

```html
<audio src="path/to/audio.mp3" controls></audio>
```

### YouTube 임베드

프라이버시 강화 YouTube iframe을 사용합니다:

```html
<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

### Vimeo 임베드

Vimeo 플레이어 iframe을 사용합니다:

```html
<iframe src="https://player.vimeo.com/video/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

Vimeo URL을 직접 붙여넣기(예: `https://vimeo.com/123456789`)하면 VMark가 자동으로 임베드로 변환합니다.

### Bilibili 임베드

BV ID로 Bilibili 플레이어 iframe을 사용합니다:

```html
<iframe src="https://player.bilibili.com/player.html?bvid=BV1xxxxxxxxx" width="560" height="350" frameborder="0" allowfullscreen></iframe>
```

Bilibili 동영상 URL(예: `https://bilibili.com/video/BV1xxxxxxxxx`)을 붙여넣으면 VMark가 자동으로 임베드로 변환합니다. 단축 URL(`b23.tv`)은 리디렉션 해결이 필요하므로 지원되지 않습니다.

### 이미지 구문 대체

미디어 파일 확장자와 함께 이미지 구문을 사용할 수도 있습니다 — VMark가 자동으로 올바른 미디어 타입으로 변환합니다:

```markdown
![](video.mp4)
![](audio.mp3)
```

## 미디어 삽입

### 툴바

툴바의 삽입 메뉴를 사용합니다:

- **동영상** — 동영상 파일 선택기를 열고, `.assets/`에 복사하고, `<video>` 태그를 삽입합니다
- **오디오** — 오디오 파일 선택기를 열고, `.assets/`에 복사하고, `<audio>` 태그를 삽입합니다
- **YouTube** — 클립보드에서 YouTube URL을 읽고 프라이버시 강화 임베드를 삽입합니다
- **Vimeo** 및 **Bilibili** — 에디터에 동영상 URL을 직접 붙여넣으면 VMark가 자동으로 제공자를 감지합니다

### 드래그 앤 드롭

파일 시스템에서 동영상 또는 오디오 파일을 에디터로 직접 드래그합니다. VMark는:

1. 파일을 문서의 `.assets/` 폴더에 복사합니다
2. 상대 경로와 함께 적절한 미디어 노드를 삽입합니다

### 소스 모드

소스 모드에서 HTML 태그를 직접 입력합니다. 미디어 태그는 색상 왼쪽 테두리로 강조 표시됩니다:

- **동영상** — 청록색 테두리
- **오디오** — 인디고 테두리
- **YouTube** — 빨간색 테두리
- **Vimeo** — 파란색 테두리
- **Bilibili** — 분홍색 테두리

## 미디어 편집

WYSIWYG 모드에서 미디어 요소를 더블클릭하면 미디어 팝업이 열립니다:

- **소스 경로** — 파일 경로 또는 URL 편집
- **제목** — 선택적 제목 속성
- **포스터** (동영상만) — 썸네일 이미지 경로
- **제거** — 미디어 요소 삭제

`Escape`를 눌러 팝업을 닫고 에디터로 돌아갑니다.

## 경로 해결

VMark는 세 가지 유형의 미디어 경로를 지원합니다:

| 경로 타입 | 예시 | 동작 |
|----------|------|------|
| 상대 경로 | `./assets/video.mp4` | 문서 디렉터리를 기준으로 해결 |
| 절대 경로 | `/Users/me/video.mp4` | Tauri 에셋 프로토콜을 통해 직접 사용 |
| 외부 URL | `https://example.com/video.mp4` | 웹에서 직접 로드 |

상대 경로가 권장됩니다 — 여러 기기에서 문서를 이식 가능하게 유지합니다.

## 보안

- 상대 경로는 디렉터리 순회 공격에 대해 검증됩니다
- 동영상 임베드 iframe은 허용된 도메인으로 제한됩니다: `youtube.com`, `youtube-nocookie.com`, `player.vimeo.com`, `player.bilibili.com`
- 다른 iframe 소스는 새니타이저에 의해 제거됩니다
