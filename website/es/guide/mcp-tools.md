# Referencia de Herramientas MCP

Esta página documenta todas las herramientas MCP disponibles cuando Claude (u otros asistentes de IA) se conecta a VMark.

VMark expone un conjunto de **herramientas compuestas**, **herramientas de protocolo** y **recursos** — todos documentados a continuación. Las herramientas compuestas usan un parámetro `action` para seleccionar la operación, lo que reduce la sobrecarga de tokens mientras mantiene todas las capacidades accesibles.

::: tip Flujo de Trabajo Recomendado
Para la mayoría de las tareas de escritura, solo necesitas un puñado de acciones:

**Entender:** `structure` → `get_digest`, `document` → `search`
**Leer:** `structure` → `get_section`, `document` → `read_paragraph` / `get_content`
**Escribir:** `structure` → `update_section` / `insert_section`, `document` → `write_paragraph` / `smart_insert`
**Controlar:** `editor` → `undo` / `redo`, `suggestions` → `accept` / `reject`
**Archivos:** `workspace` → `save`, `tabs` → `switch` / `list`

Las acciones restantes proporcionan control detallado para escenarios de automatización avanzada.
:::

::: tip Diagramas Mermaid
Cuando uses IA para generar diagramas Mermaid a través de MCP, considera instalar el [servidor MCP mermaid-validator](/es/guide/mermaid#mermaid-validator-mcp-server-syntax-checking) — detecta errores de sintaxis usando los mismos analizadores de Mermaid v11 antes de que los diagramas lleguen a tu documento.
:::

---

## `document`

Lee, escribe, busca y transforma el contenido del documento. 12 acciones.

Todas las acciones aceptan un parámetro opcional `windowId` (string) para apuntar a una ventana específica. Por defecto, usa la ventana enfocada.

### `get_content`

Obtiene el contenido completo del documento como texto markdown.

### `set_content`

Reemplaza todo el contenido del documento.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `content` | string | Sí | Nuevo contenido del documento (markdown compatible). |

::: warning Solo Documentos Vacíos
Por seguridad, esta acción solo está permitida cuando el documento de destino está **vacío**. Para documentos no vacíos, usa `insert_at_cursor`, `apply_diff` o `selection` → `replace` en su lugar — estas crean sugerencias que requieren la aprobación del usuario.
:::

### `insert_at_cursor`

Inserta texto en la posición actual del cursor.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `text` | string | Sí | Texto a insertar (markdown compatible). |

**Devuelve:** `{ message, position, suggestionId?, applied }`

::: tip Sistema de Sugerencias
Por defecto, esta acción crea una **sugerencia** que requiere la aprobación del usuario. El texto aparece como vista previa de texto fantasma. Los usuarios pueden aceptar (Enter) o rechazar (Escape). Si **Auto-aprobar ediciones** está habilitado en Configuración → Integraciones, los cambios se aplican inmediatamente.
:::

### `insert_at_position`

Inserta texto en una posición de carácter específica.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `text` | string | Sí | Texto a insertar (markdown compatible). |
| `position` | number | Sí | Posición de carácter (índice desde 0). |

**Devuelve:** `{ message, position, suggestionId?, applied }`

### `search`

Busca texto en el documento.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `query` | string | Sí | Texto a buscar. |
| `caseSensitive` | boolean | No | Búsqueda con distinción entre mayúsculas y minúsculas. Por defecto: false. |

**Devuelve:** Array de coincidencias con posiciones y números de línea.

### `replace_in_source`

Reemplaza texto a nivel de fuente markdown, sin pasar por los límites de nodos de ProseMirror.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `search` | string | Sí | Texto a encontrar en la fuente markdown. |
| `replace` | string | Sí | Texto de reemplazo (markdown compatible). |
| `all` | boolean | No | Reemplazar todas las ocurrencias. Por defecto: false. |

**Devuelve:** `{ count, message, suggestionIds?, applied }`

::: tip Cuándo usar
Usa `apply_diff` primero — es más rápido y preciso. Recurre a `replace_in_source` solo cuando el texto de búsqueda cruza límites de formato (negrita, cursiva, enlaces, etc.) y `apply_diff` no puede encontrarlo.
:::

### `batch_edit`

Aplica múltiples operaciones de forma atómica.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `operations` | array | Sí | Array de operaciones (máx. 100). |
| `baseRevision` | string | Sí | Revisión esperada para detección de conflictos. |
| `requestId` | string | No | Clave de idempotencia. |
| `mode` | string | No | `dryRun` para previsualizar sin aplicar. Aplicar vs. sugerir está controlado por la configuración del usuario. |

Cada operación requiere `type` (`update`, `insert`, `delete`, `format`, o `move`), `nodeId`, y opcionalmente `text`/`content`.

**Devuelve:** `{ success, changedNodeIds[], suggestionIds[] }`

### `apply_diff`

Busca y reemplaza texto con control de política de coincidencia.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `original` | string | Sí | Texto a encontrar. |
| `replacement` | string | Sí | Texto con el que reemplazar. |
| `baseRevision` | string | Sí | Revisión esperada para detección de conflictos. |
| `matchPolicy` | string | No | `first`, `all`, `nth`, o `error_if_multiple`. Por defecto: `first`. |
| `nth` | number | No | Qué coincidencia reemplazar (índice desde 0, para la política `nth`). |
| `scopeQuery` | object | No | Filtro de alcance para reducir la búsqueda. |
| `mode` | string | No | `dryRun` para previsualizar sin aplicar. Aplicar vs. sugerir está controlado por la configuración del usuario. |

**Devuelve:** `{ matchCount, appliedCount, matches[], suggestionIds[] }`

### `replace_anchored`

Reemplaza texto usando anclaje de contexto para una selección precisa.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `anchor` | object | Sí | `{ text, beforeContext, afterContext }` |
| `replacement` | string | Sí | Texto de reemplazo. |
| `baseRevision` | string | Sí | Revisión esperada para detección de conflictos. |
| `mode` | string | No | `dryRun` para previsualizar sin aplicar. Aplicar vs. sugerir está controlado por la configuración del usuario. |

### `read_paragraph`

Lee un párrafo del documento por índice o coincidencia de contenido.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `target` | object | Sí | `{ index: 0 }` o `{ containing: "text" }` |
| `includeContext` | boolean | No | Incluye los párrafos circundantes. Por defecto: false. |

**Devuelve:** `{ index, content, wordCount, charCount, position, context? }`

### `write_paragraph`

Modifica un párrafo en el documento.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `baseRevision` | string | Sí | Revisión del documento para detección de conflictos. |
| `target` | object | Sí | `{ index: 0 }` o `{ containing: "text" }` |
| `operation` | string | Sí | `replace`, `append`, `prepend`, o `delete`. |
| `content` | string | Condicional | Nuevo contenido (requerido excepto para `delete`). |
| `mode` | string | No | `dryRun` para previsualizar sin aplicar. Aplicar vs. sugerir está controlado por la configuración del usuario. |

**Devuelve:** `{ success, message, suggestionId?, applied, newRevision? }`

### `smart_insert`

Inserta contenido en ubicaciones comunes del documento.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `baseRevision` | string | Sí | Revisión del documento para detección de conflictos. |
| `destination` | varía | Sí | Dónde insertar (ver más abajo). |
| `content` | string | Sí | Contenido markdown a insertar. |
| `mode` | string | No | `dryRun` para previsualizar sin aplicar. Aplicar vs. sugerir está controlado por la configuración del usuario. |

**Opciones de destino:**
- `"end_of_document"` — Insertar al final
- `"start_of_document"` — Insertar al principio
- `{ after_paragraph: 2 }` — Insertar después del párrafo en el índice 2
- `{ after_paragraph_containing: "conclusion" }` — Insertar después del párrafo que contiene el texto
- `{ after_section: "Introduction" }` — Insertar después del encabezado de sección

**Devuelve:** `{ success, message, suggestionId?, applied, newRevision?, insertedAt? }`

::: tip Cuándo Usar
- **Documentos estructurados** (con encabezados): Usa `structure` → `get_section`, `update_section`, `insert_section`
- **Documentos planos** (sin encabezados): Usa `document` → `read_paragraph`, `write_paragraph`, `smart_insert`
- **Final del documento**: Usa `document` → `smart_insert` con `"end_of_document"`
:::

---

## `structure`

Consultas de estructura del documento y operaciones de secciones. 8 acciones.

Todas las acciones aceptan un parámetro opcional `windowId`.

### `get_ast`

Obtiene el árbol de sintaxis abstracta del documento.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `projection` | string[] | No | Campos a incluir: `id`, `type`, `text`, `attrs`, `marks`, `children`. |
| `filter` | object | No | Filtrar por `type`, `level`, `contains`, `hasMarks`. |
| `limit` | number | No | Máximo de resultados. |
| `offset` | number | No | Número a saltar. |
| `afterCursor` | string | No | ID de nodo para paginación por cursor. |

**Devuelve:** AST completo con tipos de nodo, posiciones y contenido.

### `get_digest`

Obtiene un resumen compacto de la estructura del documento.

**Devuelve:** `{ revision, title, wordCount, charCount, outline[], sections[], blockCounts, hasImages, hasTables, hasCodeBlocks, languages[] }`

### `list_blocks`

Lista todos los bloques del documento con sus IDs de nodo.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `query` | object | No | Filtrar por `type`, `level`, `contains`, `hasMarks`. |
| `projection` | string[] | No | Campos a incluir. |
| `limit` | number | No | Máximo de resultados. |
| `afterCursor` | string | No | ID de nodo para paginación por cursor. |

**Devuelve:** `{ revision, blocks[], hasMore, nextCursor? }`

Los IDs de nodo usan prefijos: `h-0` (encabezado), `p-0` (párrafo), `code-0` (bloque de código), etc.

### `resolve_targets`

Verificación preliminar para mutaciones — encuentra nodos por consulta.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `query` | object | Sí | Criterios de consulta: `type`, `level`, `contains`, `hasMarks`. |
| `maxResults` | number | No | Máximo de candidatos. |

**Devuelve:** Posiciones y tipos de destino resueltos.

### `get_section`

Obtiene el contenido de una sección del documento (encabezado y su contenido hasta el siguiente encabezado del mismo nivel o superior).

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `heading` | string \| object | Sí | Texto del encabezado (string) o `{ level, index }`. |
| `includeNested` | boolean | No | Incluir subsecciones. |

**Devuelve:** Contenido de la sección con encabezado, cuerpo y posiciones.

### `update_section`

Actualiza el contenido de una sección.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `baseRevision` | string | Sí | Revisión del documento. |
| `target` | object | Sí | `{ heading, byIndex, o sectionId }` |
| `newContent` | string | Sí | Nuevo contenido de la sección (markdown). |
| `mode` | string | No | `dryRun` para previsualizar sin aplicar. Aplicar vs. sugerir está controlado por la configuración del usuario. |

### `insert_section`

Inserta una nueva sección.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `baseRevision` | string | Sí | Revisión del documento. |
| `after` | object | No | Sección de destino tras la que insertar. |
| `sectionHeading` | object | Sí | `{ level, text }` — nivel del encabezado (1-6) y texto. |
| `content` | string | No | Contenido del cuerpo de la sección. |
| `mode` | string | No | `dryRun` para previsualizar sin aplicar. Aplicar vs. sugerir está controlado por la configuración del usuario. |

### `move_section`

Mueve una sección a una nueva ubicación.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `baseRevision` | string | Sí | Revisión del documento. |
| `section` | object | Sí | Sección a mover: `{ heading, byIndex, o sectionId }`. |
| `after` | object | No | Sección de destino tras la que mover. |
| `mode` | string | No | `dryRun` para previsualizar sin aplicar. Aplicar vs. sugerir está controlado por la configuración del usuario. |

---

## `selection`

Lee y manipula la selección de texto y el cursor. 5 acciones.

Todas las acciones aceptan un parámetro opcional `windowId`.

### `get`

Obtiene la selección de texto actual.

**Devuelve:** `{ text, range: { from, to }, isEmpty }`

### `set`

Establece el rango de selección.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `from` | number | Sí | Posición de inicio (inclusiva). |
| `to` | number | Sí | Posición de fin (exclusiva). |

::: tip
Usa el mismo valor para `from` y `to` para posicionar el cursor sin seleccionar texto.
:::

### `replace`

Reemplaza el texto seleccionado con nuevo texto.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `text` | string | Sí | Texto de reemplazo (markdown compatible). |

**Devuelve:** `{ message, range, originalContent, suggestionId?, applied }`

::: tip Sistema de Sugerencias
Por defecto, esta acción crea una **sugerencia** que requiere la aprobación del usuario. El texto original aparece con tachado y el nuevo texto aparece como texto fantasma. Si **Auto-aprobar ediciones** está habilitado en Configuración → Integraciones, los cambios se aplican inmediatamente.
:::

### `get_context`

Obtiene el texto alrededor del cursor para comprender el contexto.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `linesBefore` | number | No | Líneas antes del cursor. Por defecto: 3. |
| `linesAfter` | number | No | Líneas después del cursor. Por defecto: 3. |

**Devuelve:** `{ before, after, currentLine, currentParagraph, block }`

El objeto `block` contiene:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `type` | string | Tipo de bloque: `paragraph`, `heading`, `codeBlock`, `blockquote`, etc. |
| `level` | number | Nivel de encabezado 1-6 (solo para encabezados) |
| `language` | string | Lenguaje del código (solo para bloques de código con lenguaje establecido) |
| `inList` | string | Tipo de lista si está dentro de una lista: `bullet`, `ordered`, o `task` |
| `inBlockquote` | boolean | `true` si está dentro de una cita |
| `inTable` | boolean | `true` si está dentro de una tabla |
| `position` | number | Posición en el documento donde comienza el bloque |

### `set_cursor`

Establece la posición del cursor (limpia la selección).

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `position` | number | Sí | Posición de carácter (índice desde 0). |

---

## `format`

Formato de texto, tipos de bloque, listas y operaciones en lote de listas. 10 acciones.

Todas las acciones aceptan un parámetro opcional `windowId`.

### `toggle`

Activa o desactiva una marca de formato en la selección actual.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `mark` | string | Sí | `bold`, `italic`, `code`, `strike`, `underline`, o `highlight` |

### `set_link`

Crea un hipervínculo en el texto seleccionado.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `href` | string | Sí | URL del enlace. |
| `title` | string | No | Título del enlace (tooltip). |

### `remove_link`

Elimina el hipervínculo de la selección. Sin parámetros adicionales.

### `clear`

Elimina todo el formato de la selección. Sin parámetros adicionales.

### `set_block_type`

Convierte el bloque actual a un tipo específico.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `blockType` | string | Sí | `paragraph`, `heading`, `codeBlock`, o `blockquote` |
| `level` | number | Condicional | Nivel de encabezado 1-6 (requerido para `heading`). |
| `language` | string | No | Lenguaje del código (para `codeBlock`). |

### `insert_hr`

Inserta una línea horizontal (`---`) en el cursor. Sin parámetros adicionales.

### `toggle_list`

Activa o desactiva el tipo de lista en el bloque actual.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `listType` | string | Sí | `bullet`, `ordered`, o `task` |

### `indent_list`

Aumenta la sangría del elemento de lista actual. Sin parámetros adicionales.

### `outdent_list`

Disminuye la sangría del elemento de lista actual. Sin parámetros adicionales.

### `list_modify`

Modifica en lote la estructura y el contenido de una lista.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `baseRevision` | string | Sí | Revisión del documento. |
| `target` | object | Sí | `{ listId }`, `{ selector }`, o `{ listIndex }` |
| `operations` | array | Sí | Array de operaciones de lista. |
| `mode` | string | No | `dryRun` para previsualizar sin aplicar. Aplicar vs. sugerir está controlado por la configuración del usuario. |

Operaciones: `add_item`, `delete_item`, `update_item`, `toggle_check`, `reorder`, `set_indent`

---

## `table`

Operaciones de tabla. 3 acciones.

Todas las acciones aceptan un parámetro opcional `windowId`.

### `insert`

Inserta una nueva tabla en el cursor.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `rows` | number | Sí | Número de filas (debe ser al menos 1). |
| `cols` | number | Sí | Número de columnas (debe ser al menos 1). |
| `withHeaderRow` | boolean | No | Si incluir una fila de encabezado. Por defecto: true. |

### `delete`

Elimina la tabla en la posición del cursor. Sin parámetros adicionales.

### `modify`

Modifica en lote la estructura y el contenido de una tabla.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `baseRevision` | string | Sí | Revisión del documento. |
| `target` | object | Sí | `{ tableId }`, `{ afterHeading }`, o `{ tableIndex }` |
| `operations` | array | Sí | Array de operaciones de tabla. |
| `mode` | string | No | `dryRun` para previsualizar sin aplicar. Aplicar vs. sugerir está controlado por la configuración del usuario. |

Operaciones: `add_row`, `delete_row`, `add_column`, `delete_column`, `update_cell`, `set_header`

---

## `editor`

Operaciones de estado del editor. 3 acciones.

Todas las acciones aceptan un parámetro opcional `windowId`.

### `undo`

Deshace la última acción de edición.

### `redo`

Rehace la última acción deshecha.

### `focus`

Enfoca el editor (lo trae al frente, listo para recibir entrada).

---

## `workspace`

Gestiona documentos, ventanas y el estado del espacio de trabajo. 12 acciones.

Las acciones que operan en una ventana específica aceptan un parámetro opcional `windowId`.

### `list_windows`

Lista todas las ventanas abiertas de VMark.

**Devuelve:** Array de `{ label, title, filePath, isFocused, isAiExposed }`

### `get_focused`

Obtiene la etiqueta de la ventana enfocada.

### `focus_window`

Enfoca una ventana específica.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `windowId` | string | Sí | Etiqueta de ventana a enfocar. |

### `new_document`

Crea un nuevo documento vacío.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `title` | string | No | Título opcional del documento. |

### `open_document`

Abre un documento desde el sistema de archivos.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `path` | string | Sí | Ruta del archivo a abrir. |

### `save`

Guarda el documento actual.

### `save_as`

Guarda el documento en una nueva ruta.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `path` | string | Sí | Nueva ruta del archivo. |

### `get_document_info`

Obtiene los metadatos del documento.

**Devuelve:** `{ filePath, isDirty, title, wordCount, charCount }`

### `close_window`

Cierra una ventana.

### `list_recent_files`

Lista los archivos abiertos recientemente.

**Devuelve:** Array de `{ path, name, timestamp }` (hasta 10 archivos, el más reciente primero).

### `get_info`

Obtiene información sobre el estado actual del espacio de trabajo.

**Devuelve:** `{ isWorkspaceMode, rootPath, workspaceName }`

### `reload_document`

Recarga el documento activo desde el disco.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `force` | boolean | No | Forzar recarga aunque el documento tenga cambios sin guardar. Por defecto: false. |

Falla si el documento no tiene título o tiene cambios sin guardar sin `force: true`.

---

## `tabs`

Gestiona las pestañas del editor dentro de las ventanas. 6 acciones.

Todas las acciones aceptan un parámetro opcional `windowId`.

### `list`

Lista todas las pestañas en una ventana.

**Devuelve:** Array de `{ id, title, filePath, isDirty, isActive }`

### `switch`

Cambia a una pestaña específica.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `tabId` | string | Sí | ID de pestaña al que cambiar. |

### `close`

Cierra una pestaña.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `tabId` | string | No | ID de pestaña a cerrar. Por defecto, la pestaña activa. |

### `create`

Crea una nueva pestaña vacía.

**Devuelve:** `{ tabId }`

### `get_info`

Obtiene información detallada de la pestaña.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `tabId` | string | No | ID de pestaña. Por defecto, la pestaña activa. |

**Devuelve:** `{ id, title, filePath, isDirty, isActive }`

### `reopen_closed`

Vuelve a abrir la pestaña cerrada más recientemente.

**Devuelve:** `{ tabId, filePath, title }` o un mensaje si no hay ninguna disponible.

VMark registra las últimas 10 pestañas cerradas por ventana.

---

## `media`

Inserta matemáticas, diagramas, medios, wiki links y formato CJK. 11 acciones.

Todas las acciones aceptan un parámetro opcional `windowId`.

### `math_inline`

Inserta matemáticas LaTeX en línea.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `latex` | string | Sí | Expresión LaTeX (por ejemplo, `E = mc^2`). |

### `math_block`

Inserta una ecuación matemática a nivel de bloque.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `latex` | string | Sí | Expresión LaTeX. |

### `mermaid`

Inserta un diagrama Mermaid.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `code` | string | Sí | Código del diagrama Mermaid. |

### `markmap`

Inserta un mapa mental Markmap. Usa encabezados Markdown estándar para definir el árbol.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `code` | string | Sí | Markdown con encabezados que definen el árbol del mapa mental. |

### `svg`

Inserta un gráfico SVG. El SVG se renderiza en línea con panorámica, zoom y exportación PNG.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `code` | string | Sí | Marcado SVG (XML válido con raíz `<svg>`). |

### `wiki_link`

Inserta un enlace estilo wiki.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `target` | string | Sí | Destino del enlace (nombre de página). |
| `displayText` | string | No | Texto de visualización (si es diferente del destino). |

**Resultado:** `[[target]]` o `[[target|displayText]]`

### `video`

Inserta un elemento de vídeo HTML5.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `src` | string | Sí | Ruta o URL del archivo de vídeo. |
| `baseRevision` | string | Sí | Revisión del documento. |
| `title` | string | No | Atributo de título. |
| `poster` | string | No | Ruta o URL de la imagen de portada. |

### `audio`

Inserta un elemento de audio HTML5.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `src` | string | Sí | Ruta o URL del archivo de audio. |
| `baseRevision` | string | Sí | Revisión del documento. |
| `title` | string | No | Atributo de título. |

### `video_embed`

Inserta un vídeo embebido (iframe). Compatible con YouTube (privacidad mejorada), Vimeo y Bilibili.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `videoId` | string | Sí | ID del vídeo (YouTube: 11 caracteres, Vimeo: numérico, Bilibili: ID BV). |
| `baseRevision` | string | Sí | Revisión del documento. |
| `provider` | string | No | `youtube` (predeterminado), `vimeo`, o `bilibili`. |

### `cjk_punctuation`

Convierte puntuación entre medio ancho y ancho completo.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `direction` | string | Sí | `to-fullwidth` o `to-halfwidth`. |

### `cjk_spacing`

Añade o elimina espaciado entre caracteres CJK y latinos.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `spacingAction` | string | Sí | `add` o `remove`. |

---

## `suggestions`

Gestiona las sugerencias de edición generadas por IA pendientes de aprobación del usuario. 5 acciones.

Cuando la IA usa `document` → `insert_at_cursor` / `insert_at_position` / `replace_in_source`, `selection` → `replace`, o `document` → `apply_diff` / `batch_edit`, los cambios se ponen en cola como sugerencias que requieren aprobación del usuario.

Todas las acciones aceptan un parámetro opcional `windowId`.

::: info Seguridad de Deshacer/Rehacer
Las sugerencias no modifican el documento hasta que son aceptadas. Esto preserva la funcionalidad completa de deshacer/rehacer — los usuarios pueden deshacer después de aceptar, y rechazar no deja rastro en el historial.
:::

::: tip Modo Auto-Aprobación
Si **Auto-aprobar ediciones** está habilitado en Configuración → Integraciones, los cambios se aplican directamente sin crear sugerencias. Las acciones siguientes solo son necesarias cuando la auto-aprobación está desactivada (el valor predeterminado).
:::

### `list`

Lista todas las sugerencias pendientes.

**Devuelve:** `{ suggestions: [...], count, focusedId }`

Cada sugerencia incluye `id`, `type` (`insert`, `replace`, `delete`), `from`, `to`, `newContent`, `originalContent` y `createdAt`.

### `accept`

Acepta una sugerencia específica, aplicando sus cambios al documento.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `suggestionId` | string | Sí | ID de la sugerencia a aceptar. |

### `reject`

Rechaza una sugerencia específica, descartándola sin cambios.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `suggestionId` | string | Sí | ID de la sugerencia a rechazar. |

### `accept_all`

Acepta todas las sugerencias pendientes en orden del documento.

### `reject_all`

Rechaza todas las sugerencias pendientes.

---

## Herramientas de Protocolo

Dos herramientas independientes para consultar las capacidades del servidor y el estado del documento. No usan el patrón compuesto `action`.

### `get_capabilities`

Obtiene las capacidades del servidor MCP y las herramientas disponibles.

**Devuelve:** `{ version, supportedNodeTypes[], supportedQueryOperators[], limits, features }`

### `get_document_revision`

Obtiene la revisión actual del documento para bloqueo optimista.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `windowId` | string | No | Identificador de ventana. |

**Devuelve:** `{ revision, lastUpdated }`

Usa la revisión en las acciones de mutación para detectar ediciones concurrentes.

---

## Recursos MCP

Además de las herramientas, VMark expone estos recursos de solo lectura:

| URI del Recurso | Descripción |
|-----------------|-------------|
| `vmark://document/outline` | Jerarquía de encabezados del documento |
| `vmark://document/metadata` | Metadatos del documento (ruta, recuento de palabras, etc.) |
| `vmark://windows/list` | Lista de ventanas abiertas |
| `vmark://windows/focused` | Etiqueta de la ventana enfocada actualmente |
