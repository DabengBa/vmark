# MCP 도구 참조

이 페이지는 Claude (또는 다른 AI 어시스턴트)가 VMark에 연결할 때 사용할 수 있는 모든 MCP 도구를 문서화합니다.

VMark는 **복합 도구**, **프로토콜 도구**, **리소스** 세트를 노출합니다 — 모두 아래에 문서화되어 있습니다. 복합 도구는 `action` 매개변수를 사용하여 작업을 선택합니다 — 이는 모든 기능을 접근 가능하게 유지하면서 토큰 오버헤드를 줄입니다.

::: tip 권장 워크플로우
대부분의 글쓰기 작업에는 몇 가지 액션만 필요합니다:

**이해:** `structure` → `get_digest`, `document` → `search`
**읽기:** `structure` → `get_section`, `document` → `read_paragraph` / `get_content`
**쓰기:** `structure` → `update_section` / `insert_section`, `document` → `write_paragraph` / `smart_insert`
**제어:** `editor` → `undo` / `redo`, `suggestions` → `accept` / `reject`
**파일:** `workspace` → `save`, `tabs` → `switch` / `list`

나머지 액션들은 고급 자동화 시나리오를 위한 세밀한 제어를 제공합니다.
:::

::: tip Mermaid 다이어그램
MCP를 통해 AI로 Mermaid 다이어그램을 생성할 때 [mermaid-validator MCP 서버](/ko/guide/mermaid#mermaid-validator-mcp-server-syntax-checking) 설치를 고려하세요 — 다이어그램이 문서에 도달하기 전에 동일한 Mermaid v11 파서를 사용하여 구문 오류를 잡아냅니다.
:::

---

## `document`

문서 내용 읽기, 쓰기, 검색, 변환. 12가지 액션.

모든 액션은 특정 창을 대상으로 하는 선택적 `windowId` (문자열) 매개변수를 허용합니다. 기본값은 포커스된 창입니다.

### `get_content`

전체 문서 내용을 마크다운 텍스트로 가져옵니다.

### `set_content`

전체 문서 내용을 교체합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `content` | string | 예 | 새 문서 내용 (마크다운 지원). |

::: warning 빈 문서만
안전을 위해 이 액션은 대상 문서가 **비어 있을 때**만 허용됩니다. 비어 있지 않은 문서의 경우 `insert_at_cursor`, `apply_diff`, 또는 `selection` → `replace`를 사용하세요 — 이들은 사용자 승인이 필요한 제안을 생성합니다.
:::

### `insert_at_cursor`

현재 커서 위치에 텍스트를 삽입합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `text` | string | 예 | 삽입할 텍스트 (마크다운 지원). |

**반환:** `{ message, position, suggestionId?, applied }`

::: tip 제안 시스템
기본적으로 이 액션은 사용자 승인이 필요한 **제안**을 생성합니다. 텍스트가 고스트 텍스트 미리보기로 나타납니다. 사용자는 수락 (Enter) 또는 거부 (Escape)할 수 있습니다. 설정 → 통합에서 **편집 자동 승인**이 활성화된 경우 변경 사항이 즉시 적용됩니다.
:::

### `insert_at_position`

특정 문자 위치에 텍스트를 삽입합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `text` | string | 예 | 삽입할 텍스트 (마크다운 지원). |
| `position` | number | 예 | 문자 위치 (0부터 시작). |

**반환:** `{ message, position, suggestionId?, applied }`

### `search`

문서에서 텍스트를 검색합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `query` | string | 예 | 검색할 텍스트. |
| `caseSensitive` | boolean | 아니오 | 대소문자 구분 검색. 기본값: false. |

**반환:** 위치와 줄 번호가 포함된 일치 항목 배열.

### `replace_in_source`

ProseMirror 노드 경계를 우회하여 마크다운 소스 수준에서 텍스트를 교체합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `search` | string | 예 | 마크다운 소스에서 찾을 텍스트. |
| `replace` | string | 예 | 대체 텍스트 (마크다운 지원). |
| `all` | boolean | 아니오 | 모든 항목 교체. 기본값: false. |

**반환:** `{ count, message, suggestionIds?, applied }`

::: tip 사용 시기
먼저 `apply_diff`를 사용하세요 — 더 빠르고 정확합니다. 검색 텍스트가 서식 경계 (굵게, 기울임꼴, 링크 등)를 넘고 `apply_diff`가 찾지 못할 때만 `replace_in_source`로 대체하세요.
:::

### `batch_edit`

여러 작업을 원자적으로 적용합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `operations` | array | 예 | 작업 배열 (최대 100개). |
| `baseRevision` | string | 예 | 충돌 감지를 위한 예상 리비전. |
| `requestId` | string | 아니오 | 멱등성 키. |
| `mode` | string | 아니오 | 적용 없이 미리보기를 위한 `dryRun`. 적용 vs 제안은 사용자 설정에 의해 제어됩니다. |

각 작업에는 `type` (`update`, `insert`, `delete`, `format`, 또는 `move`), `nodeId`, 그리고 선택적으로 `text`/`content`가 필요합니다.

**반환:** `{ success, changedNodeIds[], suggestionIds[] }`

### `apply_diff`

일치 정책 제어로 텍스트를 찾아 교체합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `original` | string | 예 | 찾을 텍스트. |
| `replacement` | string | 예 | 교체할 텍스트. |
| `baseRevision` | string | 예 | 충돌 감지를 위한 예상 리비전. |
| `matchPolicy` | string | 아니오 | `first`, `all`, `nth`, 또는 `error_if_multiple`. 기본값: `first`. |
| `nth` | number | 아니오 | 교체할 일치 항목 (`nth` 정책을 위해 0부터 시작). |
| `scopeQuery` | object | 아니오 | 검색 범위를 좁히는 스코프 필터. |
| `mode` | string | 아니오 | 적용 없이 미리보기를 위한 `dryRun`. 적용 vs 제안은 사용자 설정에 의해 제어됩니다. |

**반환:** `{ matchCount, appliedCount, matches[], suggestionIds[] }`

### `replace_anchored`

정확한 타겟팅을 위해 컨텍스트 앵커링을 사용하여 텍스트를 교체합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `anchor` | object | 예 | `{ text, beforeContext, afterContext }` |
| `replacement` | string | 예 | 대체 텍스트. |
| `baseRevision` | string | 예 | 충돌 감지를 위한 예상 리비전. |
| `mode` | string | 아니오 | 적용 없이 미리보기를 위한 `dryRun`. 적용 vs 제안은 사용자 설정에 의해 제어됩니다. |

### `read_paragraph`

인덱스 또는 내용 일치로 문서에서 단락을 읽습니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `target` | object | 예 | `{ index: 0 }` 또는 `{ containing: "text" }` |
| `includeContext` | boolean | 아니오 | 주변 단락 포함. 기본값: false. |

**반환:** `{ index, content, wordCount, charCount, position, context? }`

### `write_paragraph`

문서의 단락을 수정합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `baseRevision` | string | 예 | 충돌 감지를 위한 문서 리비전. |
| `target` | object | 예 | `{ index: 0 }` 또는 `{ containing: "text" }` |
| `operation` | string | 예 | `replace`, `append`, `prepend`, 또는 `delete`. |
| `content` | string | 조건부 | 새 내용 (`delete`를 제외하고 필수). |
| `mode` | string | 아니오 | 적용 없이 미리보기를 위한 `dryRun`. 적용 vs 제안은 사용자 설정에 의해 제어됩니다. |

**반환:** `{ success, message, suggestionId?, applied, newRevision? }`

### `smart_insert`

일반적인 문서 위치에 내용을 삽입합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `baseRevision` | string | 예 | 충돌 감지를 위한 문서 리비전. |
| `destination` | varies | 예 | 삽입 위치 (아래 참조). |
| `content` | string | 예 | 삽입할 마크다운 내용. |
| `mode` | string | 아니오 | 적용 없이 미리보기를 위한 `dryRun`. 적용 vs 제안은 사용자 설정에 의해 제어됩니다. |

**대상 옵션:**
- `"end_of_document"` — 끝에 삽입
- `"start_of_document"` — 시작에 삽입
- `{ after_paragraph: 2 }` — 인덱스 2의 단락 뒤에 삽입
- `{ after_paragraph_containing: "conclusion" }` — 텍스트를 포함하는 단락 뒤에 삽입
- `{ after_section: "Introduction" }` — 섹션 제목 뒤에 삽입

**반환:** `{ success, message, suggestionId?, applied, newRevision?, insertedAt? }`

::: tip 사용 시기
- **구조화된 문서** (제목 포함): `structure` → `get_section`, `update_section`, `insert_section` 사용
- **플랫 문서** (제목 없음): `document` → `read_paragraph`, `write_paragraph`, `smart_insert` 사용
- **문서 끝**: `"end_of_document"`와 함께 `document` → `smart_insert` 사용
:::

---

## `structure`

문서 구조 쿼리 및 섹션 작업. 8가지 액션.

모든 액션은 선택적 `windowId` 매개변수를 허용합니다.

### `get_ast`

문서의 추상 구문 트리를 가져옵니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `projection` | string[] | 아니오 | 포함할 필드: `id`, `type`, `text`, `attrs`, `marks`, `children`. |
| `filter` | object | 아니오 | `type`, `level`, `contains`, `hasMarks`로 필터링. |
| `limit` | number | 아니오 | 최대 결과 수. |
| `offset` | number | 아니오 | 건너뛸 수. |
| `afterCursor` | string | 아니오 | 커서 페이지네이션을 위한 노드 ID. |

**반환:** 노드 타입, 위치, 내용이 포함된 전체 AST.

### `get_digest`

문서 구조의 컴팩트한 다이제스트를 가져옵니다.

**반환:** `{ revision, title, wordCount, charCount, outline[], sections[], blockCounts, hasImages, hasTables, hasCodeBlocks, languages[] }`

### `list_blocks`

노드 ID와 함께 문서의 모든 블록을 나열합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `query` | object | 아니오 | `type`, `level`, `contains`, `hasMarks`로 필터링. |
| `projection` | string[] | 아니오 | 포함할 필드. |
| `limit` | number | 아니오 | 최대 결과 수. |
| `afterCursor` | string | 아니오 | 커서 페이지네이션을 위한 노드 ID. |

**반환:** `{ revision, blocks[], hasMore, nextCursor? }`

노드 ID는 접두사를 사용합니다: `h-0` (제목), `p-0` (단락), `code-0` (코드 블록) 등.

### `resolve_targets`

변형을 위한 사전 확인 — 쿼리로 노드를 찾습니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `query` | object | 예 | 쿼리 기준: `type`, `level`, `contains`, `hasMarks`. |
| `maxResults` | number | 아니오 | 최대 후보 수. |

**반환:** 해결된 대상 위치 및 타입.

### `get_section`

문서 섹션의 내용을 가져옵니다 (같은 수준 이상의 다음 제목까지의 제목 및 내용).

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `heading` | string \| object | 예 | 제목 텍스트 (문자열) 또는 `{ level, index }`. |
| `includeNested` | boolean | 아니오 | 하위 섹션 포함. |

**반환:** 제목, 본문, 위치가 포함된 섹션 내용.

### `update_section`

섹션 내용을 업데이트합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `baseRevision` | string | 예 | 문서 리비전. |
| `target` | object | 예 | `{ heading, byIndex, 또는 sectionId }` |
| `newContent` | string | 예 | 새 섹션 내용 (마크다운). |
| `mode` | string | 아니오 | 적용 없이 미리보기를 위한 `dryRun`. 적용 vs 제안은 사용자 설정에 의해 제어됩니다. |

### `insert_section`

새 섹션을 삽입합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `baseRevision` | string | 예 | 문서 리비전. |
| `after` | object | 아니오 | 삽입할 이후의 섹션 대상. |
| `sectionHeading` | object | 예 | `{ level, text }` — 제목 수준 (1-6)과 텍스트. |
| `content` | string | 아니오 | 섹션 본문 내용. |
| `mode` | string | 아니오 | 적용 없이 미리보기를 위한 `dryRun`. 적용 vs 제안은 사용자 설정에 의해 제어됩니다. |

### `move_section`

섹션을 새 위치로 이동합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `baseRevision` | string | 예 | 문서 리비전. |
| `section` | object | 예 | 이동할 섹션: `{ heading, byIndex, 또는 sectionId }`. |
| `after` | object | 아니오 | 이동할 이후의 섹션 대상. |
| `mode` | string | 아니오 | 적용 없이 미리보기를 위한 `dryRun`. 적용 vs 제안은 사용자 설정에 의해 제어됩니다. |

---

## `selection`

텍스트 선택 및 커서 읽기와 조작. 5가지 액션.

모든 액션은 선택적 `windowId` 매개변수를 허용합니다.

### `get`

현재 텍스트 선택을 가져옵니다.

**반환:** `{ text, range: { from, to }, isEmpty }`

### `set`

선택 범위를 설정합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `from` | number | 예 | 시작 위치 (포함). |
| `to` | number | 예 | 끝 위치 (미포함). |

::: tip
텍스트를 선택하지 않고 커서를 위치시키려면 `from`과 `to`에 같은 값을 사용하세요.
:::

### `replace`

선택한 텍스트를 새 텍스트로 교체합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `text` | string | 예 | 대체 텍스트 (마크다운 지원). |

**반환:** `{ message, range, originalContent, suggestionId?, applied }`

::: tip 제안 시스템
기본적으로 이 액션은 사용자 승인이 필요한 **제안**을 생성합니다. 원래 텍스트에 취소선이 표시되고 새 텍스트가 고스트 텍스트로 나타납니다. 설정 → 통합에서 **편집 자동 승인**이 활성화된 경우 변경 사항이 즉시 적용됩니다.
:::

### `get_context`

컨텍스트 이해를 위해 커서 주변 텍스트를 가져옵니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `linesBefore` | number | 아니오 | 커서 앞의 줄 수. 기본값: 3. |
| `linesAfter` | number | 아니오 | 커서 뒤의 줄 수. 기본값: 3. |

**반환:** `{ before, after, currentLine, currentParagraph, block }`

`block` 객체에는 다음이 포함됩니다:

| 필드 | 타입 | 설명 |
|------|------|------|
| `type` | string | 블록 타입: `paragraph`, `heading`, `codeBlock`, `blockquote` 등. |
| `level` | number | 제목 수준 1-6 (제목에만) |
| `language` | string | 코드 언어 (언어가 설정된 코드 블록에만) |
| `inList` | string | 목록 안에 있을 경우 목록 타입: `bullet`, `ordered`, 또는 `task` |
| `inBlockquote` | boolean | 인용문 안에 있으면 `true` |
| `inTable` | boolean | 테이블 안에 있으면 `true` |
| `position` | number | 블록이 시작하는 문서 위치 |

### `set_cursor`

커서 위치를 설정합니다 (선택 해제).

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `position` | number | 예 | 문자 위치 (0부터 시작). |

---

## `format`

텍스트 서식, 블록 타입, 목록, 목록 배치 작업. 10가지 액션.

모든 액션은 선택적 `windowId` 매개변수를 허용합니다.

### `toggle`

현재 선택에서 서식 마크를 토글합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `mark` | string | 예 | `bold`, `italic`, `code`, `strike`, `underline`, 또는 `highlight` |

### `set_link`

선택한 텍스트에 하이퍼링크를 만듭니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `href` | string | 예 | 링크 URL. |
| `title` | string | 아니오 | 링크 제목 (툴팁). |

### `remove_link`

선택에서 하이퍼링크를 제거합니다. 추가 매개변수 없음.

### `clear`

선택에서 모든 서식을 제거합니다. 추가 매개변수 없음.

### `set_block_type`

현재 블록을 특정 타입으로 변환합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `blockType` | string | 예 | `paragraph`, `heading`, `codeBlock`, 또는 `blockquote` |
| `level` | number | 조건부 | 제목 수준 1-6 (`heading`에 필수). |
| `language` | string | 아니오 | 코드 언어 (`codeBlock`용). |

### `insert_hr`

커서에 수평선 (`---`)을 삽입합니다. 추가 매개변수 없음.

### `toggle_list`

현재 블록에서 목록 타입을 토글합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `listType` | string | 예 | `bullet`, `ordered`, 또는 `task` |

### `indent_list`

현재 목록 항목의 들여쓰기를 증가시킵니다. 추가 매개변수 없음.

### `outdent_list`

현재 목록 항목의 들여쓰기를 감소시킵니다. 추가 매개변수 없음.

### `list_modify`

목록의 구조와 내용을 배치로 수정합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `baseRevision` | string | 예 | 문서 리비전. |
| `target` | object | 예 | `{ listId }`, `{ selector }`, 또는 `{ listIndex }` |
| `operations` | array | 예 | 목록 작업 배열. |
| `mode` | string | 아니오 | 적용 없이 미리보기를 위한 `dryRun`. 적용 vs 제안은 사용자 설정에 의해 제어됩니다. |

작업: `add_item`, `delete_item`, `update_item`, `toggle_check`, `reorder`, `set_indent`

---

## `table`

테이블 작업. 3가지 액션.

모든 액션은 선택적 `windowId` 매개변수를 허용합니다.

### `insert`

커서에 새 테이블을 삽입합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `rows` | number | 예 | 행 수 (최소 1). |
| `cols` | number | 예 | 열 수 (최소 1). |
| `withHeaderRow` | boolean | 아니오 | 헤더 행 포함 여부. 기본값: true. |

### `delete`

커서 위치의 테이블을 삭제합니다. 추가 매개변수 없음.

### `modify`

테이블의 구조와 내용을 배치로 수정합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `baseRevision` | string | 예 | 문서 리비전. |
| `target` | object | 예 | `{ tableId }`, `{ afterHeading }`, 또는 `{ tableIndex }` |
| `operations` | array | 예 | 테이블 작업 배열. |
| `mode` | string | 아니오 | 적용 없이 미리보기를 위한 `dryRun`. 적용 vs 제안은 사용자 설정에 의해 제어됩니다. |

작업: `add_row`, `delete_row`, `add_column`, `delete_column`, `update_cell`, `set_header`

---

## `editor`

에디터 상태 작업. 3가지 액션.

모든 액션은 선택적 `windowId` 매개변수를 허용합니다.

### `undo`

마지막 편집 액션을 취소합니다.

### `redo`

마지막으로 취소된 액션을 다시 실행합니다.

### `focus`

에디터에 포커스를 줍니다 (앞으로 가져오고 입력 준비).

---

## `workspace`

문서, 창, 워크스페이스 상태를 관리합니다. 12가지 액션.

특정 창에서 작동하는 액션은 선택적 `windowId` 매개변수를 허용합니다.

### `list_windows`

열려 있는 모든 VMark 창을 나열합니다.

**반환:** `{ label, title, filePath, isFocused, isAiExposed }` 배열

### `get_focused`

포커스된 창의 레이블을 가져옵니다.

### `focus_window`

특정 창에 포커스를 줍니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `windowId` | string | 예 | 포커스할 창 레이블. |

### `new_document`

새 빈 문서를 만듭니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `title` | string | 아니오 | 선택적 문서 제목. |

### `open_document`

파일시스템에서 문서를 엽니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `path` | string | 예 | 열 파일 경로. |

### `save`

현재 문서를 저장합니다.

### `save_as`

문서를 새 경로에 저장합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `path` | string | 예 | 새 파일 경로. |

### `get_document_info`

문서 메타데이터를 가져옵니다.

**반환:** `{ filePath, isDirty, title, wordCount, charCount }`

### `close_window`

창을 닫습니다.

### `list_recent_files`

최근에 열린 파일을 나열합니다.

**반환:** `{ path, name, timestamp }` 배열 (최대 10개 파일, 최신 것부터).

### `get_info`

현재 워크스페이스 상태에 대한 정보를 가져옵니다.

**반환:** `{ isWorkspaceMode, rootPath, workspaceName }`

### `reload_document`

디스크에서 활성 문서를 다시 로드합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `force` | boolean | 아니오 | 저장되지 않은 변경 사항이 있어도 강제로 다시 로드. 기본값: false. |

문서가 제목이 없거나 `force: true` 없이 저장되지 않은 변경 사항이 있으면 실패합니다.

---

## `tabs`

창 내에서 에디터 탭을 관리합니다. 6가지 액션.

모든 액션은 선택적 `windowId` 매개변수를 허용합니다.

### `list`

창의 모든 탭을 나열합니다.

**반환:** `{ id, title, filePath, isDirty, isActive }` 배열

### `switch`

특정 탭으로 전환합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `tabId` | string | 예 | 전환할 탭 ID. |

### `close`

탭을 닫습니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `tabId` | string | 아니오 | 닫을 탭 ID. 기본값은 활성 탭. |

### `create`

새 빈 탭을 만듭니다.

**반환:** `{ tabId }`

### `get_info`

자세한 탭 정보를 가져옵니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `tabId` | string | 아니오 | 탭 ID. 기본값은 활성 탭. |

**반환:** `{ id, title, filePath, isDirty, isActive }`

### `reopen_closed`

가장 최근에 닫힌 탭을 다시 엽니다.

**반환:** `{ tabId, filePath, title }` 또는 사용할 수 없는 경우 메시지.

VMark는 창당 마지막 10개의 닫힌 탭을 추적합니다.

---

## `media`

수학, 다이어그램, 미디어, 위키 링크, CJK 서식 삽입. 11가지 액션.

모든 액션은 선택적 `windowId` 매개변수를 허용합니다.

### `math_inline`

인라인 LaTeX 수학을 삽입합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `latex` | string | 예 | LaTeX 식 (예: `E = mc^2`). |

### `math_block`

블록 수준 수식을 삽입합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `latex` | string | 예 | LaTeX 식. |

### `mermaid`

Mermaid 다이어그램을 삽입합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `code` | string | 예 | Mermaid 다이어그램 코드. |

### `markmap`

Markmap 마인드맵을 삽입합니다. 표준 마크다운 제목을 사용하여 트리를 정의합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `code` | string | 예 | 마인드맵 트리를 정의하는 제목이 있는 마크다운. |

### `svg`

SVG 그래픽을 삽입합니다. SVG는 패닝, 줌, PNG 내보내기와 함께 인라인으로 렌더링됩니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `code` | string | 예 | SVG 마크업 (`<svg>` 루트가 있는 유효한 XML). |

### `wiki_link`

위키 스타일 링크를 삽입합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `target` | string | 예 | 링크 대상 (페이지 이름). |
| `displayText` | string | 아니오 | 표시 텍스트 (대상과 다른 경우). |

**결과:** `[[target]]` 또는 `[[target|displayText]]`

### `video`

HTML5 비디오 요소를 삽입합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `src` | string | 예 | 비디오 파일 경로 또는 URL. |
| `baseRevision` | string | 예 | 문서 리비전. |
| `title` | string | 아니오 | 제목 속성. |
| `poster` | string | 아니오 | 포스터 이미지 경로 또는 URL. |

### `audio`

HTML5 오디오 요소를 삽입합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `src` | string | 예 | 오디오 파일 경로 또는 URL. |
| `baseRevision` | string | 예 | 문서 리비전. |
| `title` | string | 아니오 | 제목 속성. |

### `video_embed`

비디오 임베드 (iframe)를 삽입합니다. YouTube (프라이버시 강화), Vimeo, Bilibili를 지원합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `videoId` | string | 예 | 비디오 ID (YouTube: 11자, Vimeo: 숫자, Bilibili: BV ID). |
| `baseRevision` | string | 예 | 문서 리비전. |
| `provider` | string | 아니오 | `youtube` (기본값), `vimeo`, 또는 `bilibili`. |

### `cjk_punctuation`

반각과 전각 구두점 사이를 변환합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `direction` | string | 예 | `to-fullwidth` 또는 `to-halfwidth`. |

### `cjk_spacing`

CJK와 라틴 문자 사이에 간격을 추가하거나 제거합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `spacingAction` | string | 예 | `add` 또는 `remove`. |

---

## `suggestions`

사용자 승인이 보류 중인 AI 생성 편집 제안을 관리합니다. 5가지 액션.

AI가 `document` → `insert_at_cursor` / `insert_at_position` / `replace_in_source`, `selection` → `replace`, 또는 `document` → `apply_diff` / `batch_edit`를 사용하면 변경 사항이 사용자 승인이 필요한 제안으로 스테이징됩니다.

모든 액션은 선택적 `windowId` 매개변수를 허용합니다.

::: info 실행 취소/다시 실행 안전성
제안은 수락될 때까지 문서를 수정하지 않습니다. 이는 완전한 실행 취소/다시 실행 기능을 보존합니다 — 사용자는 수락 후 취소할 수 있고, 거부하면 기록에 흔적이 남지 않습니다.
:::

::: tip 자동 승인 모드
설정 → 통합에서 **편집 자동 승인**이 활성화된 경우 변경 사항이 제안을 생성하지 않고 직접 적용됩니다. 아래 액션은 자동 승인이 비활성화된 경우 (기본값)에만 필요합니다.
:::

### `list`

보류 중인 모든 제안을 나열합니다.

**반환:** `{ suggestions: [...], count, focusedId }`

각 제안에는 `id`, `type` (`insert`, `replace`, `delete`), `from`, `to`, `newContent`, `originalContent`, `createdAt`가 포함됩니다.

### `accept`

특정 제안을 수락하여 문서에 변경 사항을 적용합니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `suggestionId` | string | 예 | 수락할 제안의 ID. |

### `reject`

특정 제안을 거부하여 변경 없이 버립니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `suggestionId` | string | 예 | 거부할 제안의 ID. |

### `accept_all`

문서 순서대로 보류 중인 모든 제안을 수락합니다.

### `reject_all`

보류 중인 모든 제안을 거부합니다.

---

## 프로토콜 도구

서버 기능과 문서 상태를 쿼리하는 두 가지 독립 실행형 도구. 복합 `action` 패턴을 사용하지 않습니다.

### `get_capabilities`

MCP 서버의 기능과 사용 가능한 도구를 가져옵니다.

**반환:** `{ version, supportedNodeTypes[], supportedQueryOperators[], limits, features }`

### `get_document_revision`

낙관적 잠금을 위한 현재 문서 리비전을 가져옵니다.

| 매개변수 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `windowId` | string | 아니오 | 창 식별자. |

**반환:** `{ revision, lastUpdated }`

변형 액션에서 리비전을 사용하여 동시 편집을 감지합니다.

---

## MCP 리소스

도구 외에도 VMark는 다음 읽기 전용 리소스를 노출합니다:

| 리소스 URI | 설명 |
|------------|------|
| `vmark://document/outline` | 문서 제목 계층 구조 |
| `vmark://document/metadata` | 문서 메타데이터 (경로, 단어 수 등) |
| `vmark://windows/list` | 열려 있는 창 목록 |
| `vmark://windows/focused` | 현재 포커스된 창 레이블 |
