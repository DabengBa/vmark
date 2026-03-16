# Référence des outils MCP

Cette page documente tous les outils MCP disponibles lorsque Claude (ou d'autres assistants IA) se connecte à VMark.

VMark expose un ensemble d'**outils composites**, d'**outils de protocole** et de **ressources** — tous documentés ci-dessous. Les outils composites utilisent un paramètre `action` pour sélectionner l'opération — cela réduit les frais généraux de jetons tout en gardant toutes les capacités accessibles.

::: tip Flux de travail recommandé
Pour la plupart des tâches d'écriture, vous n'avez besoin que d'une poignée d'actions :

**Comprendre :** `structure` → `get_digest`, `document` → `search`
**Lire :** `structure` → `get_section`, `document` → `read_paragraph` / `get_content`
**Écrire :** `structure` → `update_section` / `insert_section`, `document` → `write_paragraph` / `smart_insert`
**Contrôler :** `editor` → `undo` / `redo`, `suggestions` → `accept` / `reject`
**Fichiers :** `workspace` → `save`, `tabs` → `switch` / `list`

Les actions restantes offrent un contrôle fin pour les scénarios d'automatisation avancés.
:::

::: tip Diagrammes Mermaid
Lors de l'utilisation de l'IA pour générer des diagrammes Mermaid via MCP, envisagez d'installer le [serveur MCP mermaid-validator](/fr/guide/mermaid#serveur-mcp-mermaid-validator-v%C3%A9rification-de-la-syntaxe) — il détecte les erreurs de syntaxe en utilisant les mêmes parseurs Mermaid v11 avant que les diagrammes n'atteignent votre document.
:::

---

## `document`

Lire, écrire, rechercher et transformer le contenu du document. 12 actions.

Toutes les actions acceptent un paramètre optionnel `windowId` (chaîne) pour cibler une fenêtre spécifique. Par défaut, la fenêtre mise au point.

### `get_content`

Obtenir le contenu complet du document sous forme de texte markdown.

### `set_content`

Remplacer l'intégralité du contenu du document.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `content` | string | Oui | Nouveau contenu du document (markdown pris en charge). |

::: warning Documents vides uniquement
Pour des raisons de sécurité, cette action n'est autorisée que lorsque le document cible est **vide**. Pour les documents non vides, utilisez plutôt `insert_at_cursor`, `apply_diff` ou `selection` → `replace` — ceux-ci créent des suggestions qui nécessitent l'approbation de l'utilisateur.
:::

### `insert_at_cursor`

Insérer du texte à la position actuelle du curseur.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `text` | string | Oui | Texte à insérer (markdown pris en charge). |

**Retourne :** `{ message, position, suggestionId?, applied }`

::: tip Système de suggestions
Par défaut, cette action crée une **suggestion** qui nécessite l'approbation de l'utilisateur. Le texte apparaît comme aperçu fantôme. Les utilisateurs peuvent accepter (Entrée) ou rejeter (Échap). Si **Approuver automatiquement les modifications** est activé dans Paramètres → Intégrations, les changements sont appliqués immédiatement.
:::

### `insert_at_position`

Insérer du texte à une position de caractère spécifique.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `text` | string | Oui | Texte à insérer (markdown pris en charge). |
| `position` | number | Oui | Position du caractère (indexé à partir de 0). |

**Retourne :** `{ message, position, suggestionId?, applied }`

### `search`

Rechercher du texte dans le document.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `query` | string | Oui | Texte à rechercher. |
| `caseSensitive` | boolean | Non | Recherche sensible à la casse. Par défaut : false. |

**Retourne :** Tableau de correspondances avec positions et numéros de ligne.

### `replace_in_source`

Remplacer du texte au niveau source markdown, en contournant les frontières de nœuds ProseMirror.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `search` | string | Oui | Texte à trouver dans la source markdown. |
| `replace` | string | Oui | Texte de remplacement (markdown pris en charge). |
| `all` | boolean | Non | Remplacer toutes les occurrences. Par défaut : false. |

**Retourne :** `{ count, message, suggestionIds?, applied }`

::: tip Quand l'utiliser
Utilisez d'abord `apply_diff` — c'est plus rapide et plus précis. Revenez à `replace_in_source` uniquement lorsque le texte recherché traverse des frontières de formatage (gras, italique, liens, etc.) et que `apply_diff` ne peut pas le trouver.
:::

### `batch_edit`

Appliquer plusieurs opérations de manière atomique.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `operations` | array | Oui | Tableau d'opérations (max 100). |
| `baseRevision` | string | Oui | Révision attendue pour la détection des conflits. |
| `requestId` | string | Non | Clé d'idempotence. |
| `mode` | string | Non | `dryRun` pour prévisualiser sans appliquer. L'application vs suggestion est contrôlée par le paramètre utilisateur. |

Chaque opération nécessite `type` (`update`, `insert`, `delete`, `format` ou `move`), `nodeId` et optionnellement `text`/`content`.

**Retourne :** `{ success, changedNodeIds[], suggestionIds[] }`

### `apply_diff`

Trouver et remplacer du texte avec contrôle de la politique de correspondance.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `original` | string | Oui | Texte à trouver. |
| `replacement` | string | Oui | Texte de remplacement. |
| `baseRevision` | string | Oui | Révision attendue pour la détection des conflits. |
| `matchPolicy` | string | Non | `first`, `all`, `nth` ou `error_if_multiple`. Par défaut : `first`. |
| `nth` | number | Non | Quelle correspondance remplacer (indexé à partir de 0, pour la politique `nth`). |
| `scopeQuery` | object | Non | Filtre de portée pour restreindre la recherche. |
| `mode` | string | Non | `dryRun` pour prévisualiser sans appliquer. L'application vs suggestion est contrôlée par le paramètre utilisateur. |

**Retourne :** `{ matchCount, appliedCount, matches[], suggestionIds[] }`

### `replace_anchored`

Remplacer du texte en utilisant l'ancrage de contexte pour un ciblage précis.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `anchor` | object | Oui | `{ text, beforeContext, afterContext }` |
| `replacement` | string | Oui | Texte de remplacement. |
| `baseRevision` | string | Oui | Révision attendue pour la détection des conflits. |
| `mode` | string | Non | `dryRun` pour prévisualiser sans appliquer. L'application vs suggestion est contrôlée par le paramètre utilisateur. |

### `read_paragraph`

Lire un paragraphe du document par index ou correspondance de contenu.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `target` | object | Oui | `{ index: 0 }` ou `{ containing: "texte" }` |
| `includeContext` | boolean | Non | Inclure les paragraphes environnants. Par défaut : false. |

**Retourne :** `{ index, content, wordCount, charCount, position, context? }`

### `write_paragraph`

Modifier un paragraphe dans le document.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `baseRevision` | string | Oui | Révision du document pour la détection des conflits. |
| `target` | object | Oui | `{ index: 0 }` ou `{ containing: "texte" }` |
| `operation` | string | Oui | `replace`, `append`, `prepend` ou `delete`. |
| `content` | string | Conditionnel | Nouveau contenu (requis sauf pour `delete`). |
| `mode` | string | Non | `dryRun` pour prévisualiser sans appliquer. L'application vs suggestion est contrôlée par le paramètre utilisateur. |

**Retourne :** `{ success, message, suggestionId?, applied, newRevision? }`

### `smart_insert`

Insérer du contenu à des emplacements communs dans le document.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `baseRevision` | string | Oui | Révision du document pour la détection des conflits. |
| `destination` | varies | Oui | Où insérer (voir ci-dessous). |
| `content` | string | Oui | Contenu markdown à insérer. |
| `mode` | string | Non | `dryRun` pour prévisualiser sans appliquer. L'application vs suggestion est contrôlée par le paramètre utilisateur. |

**Options de destination :**
- `"end_of_document"` — Insérer à la fin
- `"start_of_document"` — Insérer au début
- `{ after_paragraph: 2 }` — Insérer après le paragraphe à l'index 2
- `{ after_paragraph_containing: "conclusion" }` — Insérer après le paragraphe contenant ce texte
- `{ after_section: "Introduction" }` — Insérer après le titre de section

**Retourne :** `{ success, message, suggestionId?, applied, newRevision?, insertedAt? }`

::: tip Quand utiliser
- **Documents structurés** (avec titres) : Utilisez `structure` → `get_section`, `update_section`, `insert_section`
- **Documents plats** (sans titres) : Utilisez `document` → `read_paragraph`, `write_paragraph`, `smart_insert`
- **Fin de document** : Utilisez `document` → `smart_insert` avec `"end_of_document"`
:::

---

## `structure`

Requêtes sur la structure du document et opérations de section. 8 actions.

Toutes les actions acceptent un paramètre optionnel `windowId`.

### `get_ast`

Obtenir l'arbre syntaxique abstrait du document.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `projection` | string[] | Non | Champs à inclure : `id`, `type`, `text`, `attrs`, `marks`, `children`. |
| `filter` | object | Non | Filtrer par `type`, `level`, `contains`, `hasMarks`. |
| `limit` | number | Non | Résultats maximum. |
| `offset` | number | Non | Nombre à ignorer. |
| `afterCursor` | string | Non | ID de nœud pour la pagination par curseur. |

**Retourne :** AST complet avec types de nœuds, positions et contenu.

### `get_digest`

Obtenir un résumé compact de la structure du document.

**Retourne :** `{ revision, title, wordCount, charCount, outline[], sections[], blockCounts, hasImages, hasTables, hasCodeBlocks, languages[] }`

### `list_blocks`

Lister tous les blocs du document avec leurs ID de nœud.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `query` | object | Non | Filtrer par `type`, `level`, `contains`, `hasMarks`. |
| `projection` | string[] | Non | Champs à inclure. |
| `limit` | number | Non | Résultats maximum. |
| `afterCursor` | string | Non | ID de nœud pour la pagination par curseur. |

**Retourne :** `{ revision, blocks[], hasMore, nextCursor? }`

Les ID de nœuds utilisent des préfixes : `h-0` (titre), `p-0` (paragraphe), `code-0` (bloc de code), etc.

### `resolve_targets`

Vérification préalable pour les mutations — trouver des nœuds par requête.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `query` | object | Oui | Critères de requête : `type`, `level`, `contains`, `hasMarks`. |
| `maxResults` | number | Non | Candidats maximum. |

**Retourne :** Positions cibles résolues et types.

### `get_section`

Obtenir le contenu d'une section du document (titre et son contenu jusqu'au prochain titre de même niveau ou supérieur).

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `heading` | string \| object | Oui | Texte du titre (chaîne) ou `{ level, index }`. |
| `includeNested` | boolean | Non | Inclure les sous-sections. |

**Retourne :** Contenu de la section avec titre, corps et positions.

### `update_section`

Mettre à jour le contenu d'une section.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `baseRevision` | string | Oui | Révision du document. |
| `target` | object | Oui | `{ heading, byIndex, ou sectionId }` |
| `newContent` | string | Oui | Nouveau contenu de la section (markdown). |
| `mode` | string | Non | `dryRun` pour prévisualiser sans appliquer. L'application vs suggestion est contrôlée par le paramètre utilisateur. |

### `insert_section`

Insérer une nouvelle section.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `baseRevision` | string | Oui | Révision du document. |
| `after` | object | Non | Cible de section après laquelle insérer. |
| `sectionHeading` | object | Oui | `{ level, text }` — niveau de titre (1-6) et texte. |
| `content` | string | Non | Contenu du corps de la section. |
| `mode` | string | Non | `dryRun` pour prévisualiser sans appliquer. L'application vs suggestion est contrôlée par le paramètre utilisateur. |

### `move_section`

Déplacer une section vers un nouvel emplacement.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `baseRevision` | string | Oui | Révision du document. |
| `section` | object | Oui | Section à déplacer : `{ heading, byIndex, ou sectionId }`. |
| `after` | object | Non | Cible de section après laquelle déplacer. |
| `mode` | string | Non | `dryRun` pour prévisualiser sans appliquer. L'application vs suggestion est contrôlée par le paramètre utilisateur. |

---

## `selection`

Lire et manipuler la sélection de texte et le curseur. 5 actions.

Toutes les actions acceptent un paramètre optionnel `windowId`.

### `get`

Obtenir la sélection de texte actuelle.

**Retourne :** `{ text, range: { from, to }, isEmpty }`

### `set`

Définir la plage de sélection.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `from` | number | Oui | Position de début (inclusive). |
| `to` | number | Oui | Position de fin (exclusive). |

::: tip
Utilisez la même valeur pour `from` et `to` pour positionner le curseur sans sélectionner de texte.
:::

### `replace`

Remplacer le texte sélectionné par un nouveau texte.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `text` | string | Oui | Texte de remplacement (markdown pris en charge). |

**Retourne :** `{ message, range, originalContent, suggestionId?, applied }`

::: tip Système de suggestions
Par défaut, cette action crée une **suggestion** qui nécessite l'approbation de l'utilisateur. Le texte original apparaît avec un barré, et le nouveau texte apparaît comme texte fantôme. Si **Approuver automatiquement les modifications** est activé dans Paramètres → Intégrations, les changements sont appliqués immédiatement.
:::

### `get_context`

Obtenir le texte entourant le curseur pour comprendre le contexte.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `linesBefore` | number | Non | Lignes avant le curseur. Par défaut : 3. |
| `linesAfter` | number | Non | Lignes après le curseur. Par défaut : 3. |

**Retourne :** `{ before, after, currentLine, currentParagraph, block }`

L'objet `block` contient :

| Champ | Type | Description |
|-------|------|-------------|
| `type` | string | Type de bloc : `paragraph`, `heading`, `codeBlock`, `blockquote`, etc. |
| `level` | number | Niveau de titre 1-6 (uniquement pour les titres) |
| `language` | string | Langage du code (uniquement pour les blocs de code avec un langage défini) |
| `inList` | string | Type de liste si à l'intérieur d'une liste : `bullet`, `ordered` ou `task` |
| `inBlockquote` | boolean | `true` si à l'intérieur d'une citation |
| `inTable` | boolean | `true` si à l'intérieur d'un tableau |
| `position` | number | Position dans le document où commence le bloc |

### `set_cursor`

Définir la position du curseur (efface la sélection).

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `position` | number | Oui | Position du caractère (indexé à partir de 0). |

---

## `format`

Formatage du texte, types de blocs, listes et opérations par lots sur les listes. 10 actions.

Toutes les actions acceptent un paramètre optionnel `windowId`.

### `toggle`

Basculer une marque de formatage sur la sélection actuelle.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `mark` | string | Oui | `bold`, `italic`, `code`, `strike`, `underline` ou `highlight` |

### `set_link`

Créer un lien hypertexte sur le texte sélectionné.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `href` | string | Oui | URL du lien. |
| `title` | string | Non | Titre du lien (infobulle). |

### `remove_link`

Supprimer le lien hypertexte de la sélection. Aucun paramètre supplémentaire.

### `clear`

Supprimer tout le formatage de la sélection. Aucun paramètre supplémentaire.

### `set_block_type`

Convertir le bloc actuel en un type spécifique.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `blockType` | string | Oui | `paragraph`, `heading`, `codeBlock` ou `blockquote` |
| `level` | number | Conditionnel | Niveau de titre 1-6 (requis pour `heading`). |
| `language` | string | Non | Langage du code (pour `codeBlock`). |

### `insert_hr`

Insérer une règle horizontale (`---`) au curseur. Aucun paramètre supplémentaire.

### `toggle_list`

Basculer le type de liste sur le bloc actuel.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `listType` | string | Oui | `bullet`, `ordered` ou `task` |

### `indent_list`

Augmenter l'indentation de l'élément de liste actuel. Aucun paramètre supplémentaire.

### `outdent_list`

Diminuer l'indentation de l'élément de liste actuel. Aucun paramètre supplémentaire.

### `list_modify`

Modifier par lots la structure et le contenu d'une liste.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `baseRevision` | string | Oui | Révision du document. |
| `target` | object | Oui | `{ listId }`, `{ selector }` ou `{ listIndex }` |
| `operations` | array | Oui | Tableau d'opérations sur la liste. |
| `mode` | string | Non | `dryRun` pour prévisualiser sans appliquer. L'application vs suggestion est contrôlée par le paramètre utilisateur. |

Opérations : `add_item`, `delete_item`, `update_item`, `toggle_check`, `reorder`, `set_indent`

---

## `table`

Opérations sur les tableaux. 3 actions.

Toutes les actions acceptent un paramètre optionnel `windowId`.

### `insert`

Insérer un nouveau tableau au curseur.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `rows` | number | Oui | Nombre de lignes (au moins 1). |
| `cols` | number | Oui | Nombre de colonnes (au moins 1). |
| `withHeaderRow` | boolean | Non | Inclure une ligne d'en-tête. Par défaut : true. |

### `delete`

Supprimer le tableau à la position du curseur. Aucun paramètre supplémentaire.

### `modify`

Modifier par lots la structure et le contenu d'un tableau.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `baseRevision` | string | Oui | Révision du document. |
| `target` | object | Oui | `{ tableId }`, `{ afterHeading }` ou `{ tableIndex }` |
| `operations` | array | Oui | Tableau d'opérations sur le tableau. |
| `mode` | string | Non | `dryRun` pour prévisualiser sans appliquer. L'application vs suggestion est contrôlée par le paramètre utilisateur. |

Opérations : `add_row`, `delete_row`, `add_column`, `delete_column`, `update_cell`, `set_header`

---

## `editor`

Opérations d'état de l'éditeur. 3 actions.

Toutes les actions acceptent un paramètre optionnel `windowId`.

### `undo`

Annuler la dernière action d'édition.

### `redo`

Rétablir la dernière action annulée.

### `focus`

Mettre au point l'éditeur (le mettre au premier plan, prêt pour la saisie).

---

## `workspace`

Gérer les documents, fenêtres et état de l'espace de travail. 12 actions.

Les actions qui opèrent sur une fenêtre spécifique acceptent un paramètre optionnel `windowId`.

### `list_windows`

Lister toutes les fenêtres VMark ouvertes.

**Retourne :** Tableau de `{ label, title, filePath, isFocused, isAiExposed }`

### `get_focused`

Obtenir le label de la fenêtre mise au point.

### `focus_window`

Mettre au point une fenêtre spécifique.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `windowId` | string | Oui | Label de la fenêtre à mettre au point. |

### `new_document`

Créer un nouveau document vide.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `title` | string | Non | Titre optionnel du document. |

### `open_document`

Ouvrir un document depuis le système de fichiers.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `path` | string | Oui | Chemin de fichier à ouvrir. |

### `save`

Enregistrer le document actuel.

### `save_as`

Enregistrer le document vers un nouveau chemin.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `path` | string | Oui | Nouveau chemin de fichier. |

### `get_document_info`

Obtenir les métadonnées du document.

**Retourne :** `{ filePath, isDirty, title, wordCount, charCount }`

### `close_window`

Fermer une fenêtre.

### `list_recent_files`

Lister les fichiers ouverts récemment.

**Retourne :** Tableau de `{ path, name, timestamp }` (jusqu'à 10 fichiers, les plus récents en premier).

### `get_info`

Obtenir des informations sur l'état actuel de l'espace de travail.

**Retourne :** `{ isWorkspaceMode, rootPath, workspaceName }`

### `reload_document`

Recharger le document actif depuis le disque.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `force` | boolean | Non | Forcer le rechargement même si le document a des modifications non enregistrées. Par défaut : false. |

Échoue si le document est sans titre ou a des modifications non enregistrées sans `force: true`.

---

## `tabs`

Gérer les onglets de l'éditeur dans les fenêtres. 6 actions.

Toutes les actions acceptent un paramètre optionnel `windowId`.

### `list`

Lister tous les onglets dans une fenêtre.

**Retourne :** Tableau de `{ id, title, filePath, isDirty, isActive }`

### `switch`

Basculer vers un onglet spécifique.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `tabId` | string | Oui | ID de l'onglet vers lequel basculer. |

### `close`

Fermer un onglet.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `tabId` | string | Non | ID de l'onglet à fermer. Par défaut, l'onglet actif. |

### `create`

Créer un nouvel onglet vide.

**Retourne :** `{ tabId }`

### `get_info`

Obtenir des informations détaillées sur un onglet.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `tabId` | string | Non | ID de l'onglet. Par défaut, l'onglet actif. |

**Retourne :** `{ id, title, filePath, isDirty, isActive }`

### `reopen_closed`

Rouvrir l'onglet fermé le plus récemment.

**Retourne :** `{ tabId, filePath, title }` ou message si aucun n'est disponible.

VMark garde la trace des 10 derniers onglets fermés par fenêtre.

---

## `media`

Insérer des maths, diagrammes, médias, liens wiki et mise en forme CJK. 11 actions.

Toutes les actions acceptent un paramètre optionnel `windowId`.

### `math_inline`

Insérer des maths LaTeX en ligne.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `latex` | string | Oui | Expression LaTeX (ex. `E = mc^2`). |

### `math_block`

Insérer une équation mathématique au niveau bloc.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `latex` | string | Oui | Expression LaTeX. |

### `mermaid`

Insérer un diagramme Mermaid.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `code` | string | Oui | Code du diagramme Mermaid. |

### `markmap`

Insérer une carte mentale Markmap. Utilise des titres Markdown standard pour définir l'arbre.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `code` | string | Oui | Markdown avec des titres définissant l'arbre de la carte mentale. |

### `svg`

Insérer un graphique SVG. Le SVG s'affiche en ligne avec panoramique, zoom et export PNG.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `code` | string | Oui | Balisage SVG (XML valide avec racine `<svg>`). |

### `wiki_link`

Insérer un lien de style wiki.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `target` | string | Oui | Cible du lien (nom de page). |
| `displayText` | string | Non | Texte d'affichage (si différent de la cible). |

**Résultat :** `[[target]]` ou `[[target|displayText]]`

### `video`

Insérer un élément vidéo HTML5.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `src` | string | Oui | Chemin ou URL du fichier vidéo. |
| `baseRevision` | string | Oui | Révision du document. |
| `title` | string | Non | Attribut titre. |
| `poster` | string | Non | Chemin ou URL de l'image de couverture. |

### `audio`

Insérer un élément audio HTML5.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `src` | string | Oui | Chemin ou URL du fichier audio. |
| `baseRevision` | string | Oui | Révision du document. |
| `title` | string | Non | Attribut titre. |

### `video_embed`

Insérer un embed vidéo (iframe). Prend en charge YouTube (sans publicité), Vimeo et Bilibili.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `videoId` | string | Oui | ID vidéo (YouTube : 11 caractères, Vimeo : numérique, Bilibili : BV ID). |
| `baseRevision` | string | Oui | Révision du document. |
| `provider` | string | Non | `youtube` (par défaut), `vimeo` ou `bilibili`. |

### `cjk_punctuation`

Convertir la ponctuation entre demi-largeur et pleine largeur.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `direction` | string | Oui | `to-fullwidth` ou `to-halfwidth`. |

### `cjk_spacing`

Ajouter ou supprimer l'espacement entre les caractères CJK et latins.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `spacingAction` | string | Oui | `add` ou `remove`. |

---

## `suggestions`

Gérer les suggestions de modification générées par l'IA en attente d'approbation de l'utilisateur. 5 actions.

Lorsque l'IA utilise `document` → `insert_at_cursor` / `insert_at_position` / `replace_in_source`, `selection` → `replace` ou `document` → `apply_diff` / `batch_edit`, les changements sont mis en file d'attente comme suggestions qui nécessitent l'approbation de l'utilisateur.

Toutes les actions acceptent un paramètre optionnel `windowId`.

::: info Sécurité annulation/rétablissement
Les suggestions ne modifient pas le document jusqu'à leur acceptation. Cela préserve la fonctionnalité complète d'annulation/rétablissement — les utilisateurs peuvent annuler après acceptation, et le rejet ne laisse aucune trace dans l'historique.
:::

::: tip Mode d'approbation automatique
Si **Approuver automatiquement les modifications** est activé dans Paramètres → Intégrations, les changements s'appliquent directement sans créer de suggestions. Les actions ci-dessous ne sont nécessaires que lorsque l'approbation automatique est désactivée (par défaut).
:::

### `list`

Lister toutes les suggestions en attente.

**Retourne :** `{ suggestions: [...], count, focusedId }`

Chaque suggestion inclut `id`, `type` (`insert`, `replace`, `delete`), `from`, `to`, `newContent`, `originalContent` et `createdAt`.

### `accept`

Accepter une suggestion spécifique, en appliquant ses changements au document.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `suggestionId` | string | Oui | ID de la suggestion à accepter. |

### `reject`

Rejeter une suggestion spécifique, en la supprimant sans changements.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `suggestionId` | string | Oui | ID de la suggestion à rejeter. |

### `accept_all`

Accepter toutes les suggestions en attente dans l'ordre du document.

### `reject_all`

Rejeter toutes les suggestions en attente.

---

## Outils de protocole

Deux outils autonomes pour interroger les capacités du serveur et l'état du document. Ceux-ci n'utilisent pas le modèle composite `action`.

### `get_capabilities`

Obtenir les capacités du serveur MCP et les outils disponibles.

**Retourne :** `{ version, supportedNodeTypes[], supportedQueryOperators[], limits, features }`

### `get_document_revision`

Obtenir la révision actuelle du document pour le verrouillage optimiste.

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `windowId` | string | Non | Identifiant de fenêtre. |

**Retourne :** `{ revision, lastUpdated }`

Utilisez la révision dans les actions de mutation pour détecter les modifications concurrentes.

---

## Ressources MCP

En plus des outils, VMark expose ces ressources en lecture seule :

| URI de ressource | Description |
|-----------------|-------------|
| `vmark://document/outline` | Hiérarchie des titres du document |
| `vmark://document/metadata` | Métadonnées du document (chemin, nombre de mots, etc.) |
| `vmark://windows/list` | Liste des fenêtres ouvertes |
| `vmark://windows/focused` | Label de la fenêtre actuellement mise au point |
