# Fonctionnalités

VMark est un éditeur Markdown riche en fonctionnalités conçu pour les flux de travail d'écriture modernes. Voici ce qui est inclus.

## Modes d'édition

### Mode texte enrichi (WYSIWYG)

Le mode d'édition par défaut offre une véritable expérience « ce que vous voyez est ce que vous obtenez » :

- Aperçu de la mise en forme en direct pendant la frappe
- Révélation de la syntaxe en ligne au survol du curseur
- Barre d'outils intuitive et menus contextuels
- Saisie transparente de la syntaxe Markdown

### Mode Source

Passez à l'édition Markdown brute avec une coloration syntaxique complète :

- Éditeur propulsé par CodeMirror 6
- Coloration syntaxique complète
- Expérience d'éditeur de texte familière
- Idéal pour les utilisateurs avancés

Basculez entre les modes avec `F6`.

### Aperçu source

Modifiez le Markdown brut d'un seul bloc sans quitter le mode WYSIWYG. Appuyez sur `F5` pour ouvrir l'Aperçu source pour le bloc au niveau du curseur.

**Disposition :**
- Barre d'en-tête avec l'étiquette du type de bloc et les boutons d'action
- Éditeur CodeMirror affichant la source Markdown du bloc
- Bloc original affiché en aperçu atténué (quand l'aperçu en direct est ACTIVÉ)

**Contrôles :**
| Action | Raccourci |
|--------|----------|
| Enregistrer les modifications | `Cmd/Ctrl + Entrée` |
| Annuler (rétablir) | `Échap` |
| Basculer l'aperçu en direct | Cliquer sur l'icône œil |

**Aperçu en direct :**
- **DÉSACTIVÉ (par défaut) :** Modifiez librement, les modifications sont appliquées uniquement lors de l'enregistrement
- **ACTIVÉ :** Les modifications sont appliquées immédiatement pendant la frappe, l'aperçu est affiché en dessous

**Blocs exclus :**
Certains blocs ont leurs propres mécanismes d'édition et ignorent l'Aperçu source :
- Blocs de code (y compris Mermaid, LaTeX) — utilisez le double-clic pour modifier
- Images en bloc — utilisez le popup d'image
- En-têtes, blocs HTML, règles horizontales

L'Aperçu source est utile pour l'édition précise de Markdown (correction de la syntaxe des tableaux, ajustement de l'indentation des listes) tout en restant dans l'éditeur visuel.

## Édition multi-curseur

Modifiez plusieurs emplacements simultanément — VMark prend en charge le multi-curseur complet en mode WYSIWYG et Source.

| Action | Raccourci |
|--------|----------|
| Ajouter un curseur à la prochaine occurrence | `Mod + D` |
| Ignorer l'occurrence, passer à la suivante | `Mod + Shift + D` |
| Sélectionner toutes les occurrences | `Mod + Shift + L` |
| Ajouter un curseur au-dessus/en-dessous | `Mod + Alt + Haut/Bas` |
| Ajouter un curseur au clic | `Alt + Clic` |
| Annuler le dernier curseur | `Alt + Mod + Z` |
| Réduire à un seul curseur | `Échap` |

Toutes les éditions standard (frappe, suppression, presse-papiers, navigation) fonctionnent à chaque curseur indépendamment. Limité par défaut aux blocs pour éviter les modifications non intentionnelles entre les sections.

[En savoir plus →](/fr/guide/multi-cursor)

## Auto-paire et échappement par Tab

Quand vous tapez un crochet ouvrant, une guillemet ou un accent grave, VMark insère automatiquement le caractère fermant correspondant. Appuyez sur **Tab** pour sauter après le caractère fermant au lieu d'utiliser la touche flèche.

- Crochets : `()` `[]` `{}`
- Guillemets : `""` `''` `` ` ` ``
- CJK : `「」` `『』` `（）` `【】` `《》` `〈〉`
- Guillemets courbés : `""` `''`
- Marques de mise en forme en WYSIWYG : **gras**, *italique*, `code`, ~~barré~~, liens

La touche Retour arrière supprime les deux caractères quand la paire est vide. L'auto-paire et le saut de crochet par Tab sont tous deux **désactivés à l'intérieur des blocs de code et du code en ligne** — les crochets dans le code restent littéraux. Configurable dans **Paramètres → Éditeur**.

[En savoir plus →](/fr/guide/tab-navigation)

## Mise en forme du texte

### Styles de base

- **Gras**, *Italique*, <u>Souligné</u>, ~~Barré~~
- `Code en ligne`, ==Surligné==
- Exposant et indice
- Liens, liens Wiki et liens de favoris avec popups d'aperçu
- Notes de bas de page avec édition en ligne
- Basculement de commentaire HTML (`Mod + /`)
- Commande de suppression de la mise en forme

### Transformations de texte

Changez rapidement la casse via Format → Transformer :

| Transformation | Raccourci |
|---------------|----------|
| MAJUSCULES | `Ctrl + Shift + U` (macOS) / `Alt + Shift + U` (Win/Linux) |
| minuscules | `Ctrl + Shift + L` (macOS) / `Alt + Shift + L` (Win/Linux) |
| Titre | `Ctrl + Shift + T` (macOS) / `Alt + Shift + T` (Win/Linux) |
| Basculer la casse | — |

### Éléments de bloc

- Titres 1-6 avec des raccourcis faciles (augmenter/diminuer le niveau avec `Mod + Alt + ]`/`[`)
- Citations (imbrication prise en charge)
- Blocs de code avec coloration syntaxique
- Listes ordonnées, non ordonnées et de tâches
- Règles horizontales
- Tableaux avec prise en charge d'édition complète

### Sauts de ligne forcés

Appuyez sur `Shift + Entrée` pour insérer un saut de ligne forcé dans un paragraphe.
VMark utilise le style deux espaces par défaut pour une compatibilité maximale.
Configurez dans **Paramètres > Éditeur > Espaces**.

### Opérations sur les lignes

Manipulation puissante des lignes via Édition → Lignes :

| Action | Raccourci |
|--------|----------|
| Monter la ligne | `Alt + Haut` |
| Descendre la ligne | `Alt + Bas` |
| Dupliquer la ligne | `Shift + Alt + Bas` |
| Supprimer la ligne | `Mod + Shift + K` |
| Joindre les lignes | `Mod + J` |
| Supprimer les lignes vides | — |
| Trier les lignes croissant | `F4` |
| Trier les lignes décroissant | `Shift + F4` |

## Tableaux

Édition complète des tableaux :

- Insérez des tableaux via le menu ou le raccourci
- Ajoutez/supprimez des lignes et des colonnes
- Alignement des cellules (gauche, centre, droite)
- Redimensionnez les colonnes par glisser-déposer
- Barre d'outils contextuelle pour les actions rapides
- Navigation au clavier (Tab, flèches, Entrée)

## Images

Prise en charge complète des images :

- Insertion via boîte de dialogue de fichier
- Glisser-déposer depuis le système de fichiers
- Coller depuis le presse-papiers
- Copie automatique dans le dossier des ressources du projet
- Redimensionnement via le menu contextuel
- Double-clic pour modifier le chemin source, le texte alternatif et les dimensions
- Basculer entre l'affichage en ligne et en bloc

## Vidéo et audio

Prise en charge complète des médias avec les balises HTML5 :

- Insérez des vidéos et des audios via le sélecteur de fichiers de la barre d'outils
- Glissez-déposez des fichiers multimédias dans l'éditeur
- Copie automatique vers le dossier `.assets/` du projet
- Cliquez pour modifier le chemin source, le titre et l'affiche (vidéo)
- Prise en charge des intégrations YouTube avec des iframes renforcées en confidentialité
- Repli syntaxique des images : `![](fichier.mp4)` est automatiquement promu en vidéo
- Décoration en mode Source avec des bordures colorées par type
- [En savoir plus →](/fr/guide/media-support)

## Contenu spécial

### Boîtes d'information

Alertes Markdown au style GitHub :

- NOTE - Informations générales
- TIP - Suggestions utiles
- IMPORTANT - Informations clés
- WARNING - Problèmes potentiels
- CAUTION - Actions dangereuses

### Sections réductibles

Créez des blocs de contenu extensibles en utilisant l'élément HTML `<details>`.

### Équations mathématiques

Rendu LaTeX propulsé par KaTeX :

- Mathématiques en ligne : `$E = mc^2$`
- Mathématiques en bloc : blocs `$$...$$`
- Prise en charge complète de la syntaxe LaTeX
- Messages d'erreur utiles avec des indications de syntaxe

### Diagrammes

Prise en charge des diagrammes Mermaid avec aperçu en direct :

- Organigrammes, diagrammes de séquence, diagrammes de Gantt
- Diagrammes de classes, diagrammes d'état, diagrammes ER
- Panneau d'aperçu en direct en mode Source (glisser, redimensionner, zoomer)
- [En savoir plus →](/fr/guide/mermaid)

### Graphiques SVG

Rendez du SVG brut en ligne via des blocs de code ` ```svg ` :

- Rendu instantané avec panoramique, zoom et export PNG
- Aperçu en direct en mode WYSIWYG et Source
- Idéal pour les graphiques générés par IA et les illustrations personnalisées
- [En savoir plus →](/fr/guide/svg)

## Génies IA

Assistance à l'écriture par IA intégrée propulsée par votre fournisseur préféré :

- 13 génies répartis en quatre catégories — édition, créativité, structure et outils
- Sélecteur de style Spotlight avec recherche et invites libres (`Mod + Y`)
- Rendu de suggestion en ligne — acceptez ou refusez avec des raccourcis clavier
- Prend en charge les fournisseurs CLI (Claude, Codex, Gemini, Ollama) et les API REST

[En savoir plus →](/fr/guide/ai-genies) | [Configurer les fournisseurs →](/fr/guide/ai-providers)

## Rechercher et remplacer

Ouvrez la barre de recherche avec `Mod + F`. Elle apparaît en ligne en haut de la zone d'édition et fonctionne en mode WYSIWYG et Source.

**Navigation :**

| Action | Raccourci |
|--------|----------|
| Trouver la prochaine occurrence | `Entrée` ou `Mod + G` |
| Trouver l'occurrence précédente | `Shift + Entrée` ou `Mod + Shift + G` |
| Utiliser la sélection pour la recherche | `Mod + E` |
| Fermer la barre de recherche | `Échap` |

**Options de recherche** — basculez via les boutons dans la barre de recherche :

- **Sensible à la casse** — correspondre à la casse exacte des lettres
- **Mot entier** — ne faire correspondre que les mots complets, pas les sous-chaînes
- **Expression régulière** — utiliser des motifs regex (activez d'abord dans les Paramètres)

**Remplacer :**

Cliquez sur le chevron d'expansion de la barre de recherche pour révéler la ligne de remplacement. Saisissez le texte de remplacement, puis utilisez **Remplacer** (une seule occurrence) ou **Tout remplacer** (chaque occurrence en même temps). Le compteur d'occurrences affiche la position actuelle et le total (par ex. « 3 sur 12 ») pour que vous sachiez toujours où vous en êtes.

## Options d'exportation

VMark offre des options d'exportation flexibles pour partager vos documents.

### Export HTML

Exportez vers du HTML autonome avec deux modes d'empaquetage :

- **Mode dossier** (par défaut) : Crée `Document/index.html` avec les ressources dans un sous-dossier
- **Mode fichier unique** : Crée un fichier `.html` autonome avec des images intégrées

L'HTML exporté inclut le [**Lecteur VMark**](/fr/guide/export#vmark-reader) — des contrôles interactifs pour les paramètres, la table des matières, la visionneuse d'images et plus encore.

[En savoir plus sur l'exportation →](/fr/guide/export)

### Export PDF

Imprimez en PDF avec la boîte de dialogue système native (`Cmd/Ctrl + P`).

### Copier en HTML

Copiez le contenu mis en forme pour le coller dans d'autres applications (`Cmd/Ctrl + Shift + C`).

### Format de copie

Par défaut, la copie depuis WYSIWYG place du texte brut (sans mise en forme) dans le presse-papiers. Activez le format de copie **Markdown** dans **Paramètres > Markdown > Coller et saisie** pour placer la syntaxe Markdown dans `text/plain` à la place — les titres gardent leur `#`, les liens gardent leurs URL, etc. Utile lors du collage dans des terminaux, des éditeurs de code ou des applications de messagerie.

## Mise en forme CJK

Outils de mise en forme de texte chinois/japonais/coréen intégrés :

- Plus de 20 règles de mise en forme configurables
- Espacement CJK-anglais
- Conversion de caractères pleine largeur
- Normalisation de la ponctuation
- Association intelligente des guillemets avec détection des apostrophes/primes
- Protection des constructions techniques (URL, versions, heures, décimales)
- Conversion contextuelle des guillemets (courbés pour le CJK, droits pour le latin)
- Basculement du style de guillemets au curseur (`Shift + Mod + '`)
- [En savoir plus →](/fr/guide/cjk-formatting)

## Historique du document

- Sauvegarde automatique avec intervalle configurable
- Visualisez et restaurez les versions précédentes
- Format de stockage JSONL
- Historique par document

## Affichage et focus

### Mode focus (`F8`)

Le mode focus atténue tous les blocs sauf celui que vous modifiez actuellement, réduisant le bruit visuel pour que vous puissiez vous concentrer sur un seul paragraphe. Le bloc actif est mis en évidence à pleine opacité tandis que le contenu environnant s'estompe vers une couleur atténuée. Basculez-le avec `F8` — il fonctionne en mode WYSIWYG et Source et persiste jusqu'à ce que vous le désactiviez.

### Mode machine à écrire (`F9`)

Le mode machine à écrire garde la ligne active centrée verticalement dans la fenêtre, afin que vos yeux restent à une position fixe pendant que le document défile en dessous — comme si vous tapiez sur une vraie machine à écrire. Basculez-le avec `F9`. Il fonctionne dans les deux modes d'édition et utilise un défilement fluide avec un petit seuil pour éviter les ajustements saccadés lors des déplacements mineurs du curseur.

### Combiner focus + machine à écrire

Le mode focus et le mode machine à écrire peuvent être activés simultanément. Ensemble, ils offrent un environnement d'écriture sans distraction complète : les blocs environnants sont atténués *et* la ligne actuelle reste centrée à l'écran.

### Retour à la ligne (`Alt + Z`)

Basculez le retour à la ligne automatique avec `Alt + Z`. Quand il est activé, les longues lignes se replient à la largeur de l'éditeur au lieu de défiler horizontalement. Le paramètre persiste entre les sessions.

## Utilitaires de texte

VMark inclut des utilitaires pour le nettoyage et la mise en forme du texte, disponibles dans le menu Format :

### Nettoyage du texte (Format → Nettoyage du texte)

- **Supprimer les espaces de fin** : Enlever les espaces en fin de ligne
- **Réduire les lignes vides** : Réduire plusieurs lignes vides consécutives à une seule

### Mise en forme CJK (Format → CJK)

Outils de mise en forme de texte chinois/japonais/coréen intégrés. [En savoir plus →](/fr/guide/cjk-formatting)

### Nettoyage des images (Fichier → Nettoyer les images inutilisées)

Trouvez et supprimez les images orphelines de votre dossier de ressources.

## Terminal intégré

Panneau terminal intégré avec plusieurs sessions, copier/coller, recherche, chemins de fichiers et URL cliquables, menu contextuel, synchronisation des thèmes et paramètres de police configurables. Basculez avec `` Ctrl + ` ``. [En savoir plus →](/fr/guide/terminal)

## Mise à jour automatique

VMark vérifie automatiquement les mises à jour et peut les télécharger et les installer dans l'application :

- Vérification automatique des mises à jour au lancement
- Installation des mises à jour en un clic
- Aperçu des notes de version avant la mise à jour

## Support des espaces de travail

- Ouvrez des dossiers comme espaces de travail
- Navigation dans l'arborescence des fichiers dans la barre latérale
- Changement rapide de fichier
- Suivi des fichiers récents
- Taille et position de la fenêtre mémorisées entre les sessions

[En savoir plus →](/fr/guide/workspace-management)

## Personnalisation

### Thèmes

Cinq thèmes de couleurs intégrés :

- Blanc (propre, minimal)
- Papier (blanc cassé chaud)
- Menthe (teinte verte douce)
- Sépia (look vintage)
- Nuit (mode sombre)

### Polices

Configurez des polices séparées pour :

- Texte latin
- Texte CJK (chinois/japonais/coréen)
- Monospace (code)

### Disposition

Ajustez :

- Taille de police
- Interligne
- Espacement des blocs (écart entre les paragraphes et les blocs)
- Espacement des lettres CJK (espacement subtil pour la lisibilité CJK)
- Largeur de l'éditeur
- Taille de police des éléments de bloc (listes, citations, tableaux, alertes)
- Alignement des titres (gauche ou centre)
- Alignement des images et tableaux (gauche ou centre)

### Raccourcis clavier

Tous les raccourcis sont personnalisables dans Paramètres → Raccourcis.

## Détails techniques

VMark est construit avec des technologies modernes :

| Composant | Technologie |
|-----------|------------|
| Framework de bureau | Tauri v2 (Rust) |
| Frontend | React 19, TypeScript |
| Gestion d'état | Zustand v5 |
| Éditeur de texte enrichi | Tiptap (ProseMirror) |
| Éditeur source | CodeMirror 6 |
| Style | Tailwind CSS v4 |

Tout le traitement se fait localement sur votre machine — pas de services cloud, pas de compte requis.
