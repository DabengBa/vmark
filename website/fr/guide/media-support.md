# Prise en charge des médias

VMark prend en charge la vidéo, l'audio et les embeds YouTube dans vos documents Markdown en utilisant des balises HTML5 standard.

## Formats pris en charge

### Vidéo

| Format | Extension |
|--------|-----------|
| MP4 | `.mp4` |
| WebM | `.webm` |
| MOV | `.mov` |
| AVI | `.avi` |
| MKV | `.mkv` |
| M4V | `.m4v` |
| OGV | `.ogv` |

### Audio

| Format | Extension |
|--------|-----------|
| MP3 | `.mp3` |
| M4A | `.m4a` |
| OGG | `.ogg` |
| WAV | `.wav` |
| FLAC | `.flac` |
| AAC | `.aac` |
| Opus | `.opus` |

## Syntaxe

### Vidéo

Utilisez des balises HTML5 vidéo standard :

```html
<video src="chemin/vers/video.mp4" controls></video>
```

Avec des attributs optionnels :

```html
<video src="video.mp4" title="Démo" poster="miniature.jpg" controls></video>
```

### Audio

Utilisez des balises HTML5 audio standard :

```html
<audio src="chemin/vers/audio.mp3" controls></audio>
```

### Embeds YouTube

Utilisez des iframes YouTube respectueuses de la vie privée :

```html
<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

### Syntaxe d'image de secours

Vous pouvez également utiliser la syntaxe d'image avec des extensions de fichiers médias — VMark les promeut automatiquement vers le type de média correct :

```markdown
![](video.mp4)
![](audio.mp3)
```

## Insérer des médias

### Barre d'outils

Utilisez le menu Insérer dans la barre d'outils :

- **Vidéo** — ouvre un sélecteur de fichiers pour les fichiers vidéo, copie dans `.assets/`, insère une balise `<video>`
- **Audio** — ouvre un sélecteur de fichiers pour les fichiers audio, copie dans `.assets/`, insère une balise `<audio>`
- **YouTube** — lit une URL YouTube depuis le presse-papiers et insère un embed respectueux de la vie privée

### Glisser-déposer

Glissez des fichiers vidéo ou audio depuis votre système de fichiers directement dans l'éditeur. VMark va :

1. Copier le fichier dans le dossier `.assets/` du document
2. Insérer le nœud de média approprié avec un chemin relatif

### Mode Source

En mode Source, tapez les balises HTML directement. Les balises médias sont mises en évidence avec des bordures gauches colorées :

- **Vidéo** — bordure sarcelle
- **Audio** — bordure indigo
- **YouTube** — bordure rouge

## Modifier les médias

Double-cliquez sur n'importe quel élément multimédia en mode WYSIWYG pour ouvrir la fenêtre contextuelle multimédia :

- **Chemin source** — modifier le chemin du fichier ou l'URL
- **Titre** — attribut titre optionnel
- **Couverture** (vidéo uniquement) — chemin de l'image miniature
- **Supprimer** — supprimer l'élément multimédia

Appuyez sur `Échap` pour fermer la fenêtre contextuelle et revenir à l'éditeur.

## Résolution des chemins

VMark prend en charge trois types de chemins médias :

| Type de chemin | Exemple | Comportement |
|----------------|---------|-------------|
| Relatif | `./assets/video.mp4` | Résolu par rapport au répertoire du document |
| Absolu | `/Users/moi/video.mp4` | Utilisé directement via le protocole d'assets Tauri |
| URL externe | `https://example.com/video.mp4` | Chargé directement depuis le web |

Les chemins relatifs sont recommandés — ils gardent vos documents portables entre les machines.

## Sécurité

- Les chemins relatifs sont validés contre les attaques de traversée de répertoire
- Les iframes YouTube sont restreints aux domaines `youtube.com` et `youtube-nocookie.com`
- Les autres sources iframe sont supprimées par le désinfectant
