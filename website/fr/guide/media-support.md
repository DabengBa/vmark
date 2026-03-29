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

### Embeds Vimeo

Utilisez des iframes du lecteur Vimeo :

```html
<iframe src="https://player.vimeo.com/video/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

Vous pouvez également coller directement une URL Vimeo (par ex. `https://vimeo.com/123456789`) et VMark la convertira automatiquement en embed.

### Embeds Bilibili

Utilisez l'iframe du lecteur Bilibili avec un identifiant BV :

```html
<iframe src="https://player.bilibili.com/player.html?bvid=BV1xxxxxxxxx" width="560" height="350" frameborder="0" allowfullscreen></iframe>
```

Collez une URL de vidéo Bilibili (par ex. `https://bilibili.com/video/BV1xxxxxxxxx`) et VMark la convertira automatiquement en embed. Notez que les URL courtes (`b23.tv`) ne sont pas prises en charge car elles nécessitent une résolution de redirection.

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
- **Vimeo** et **Bilibili** — collez une URL de vidéo directement dans l'éditeur et VMark détecte automatiquement le fournisseur

### Glisser-déposer

Glissez des fichiers vidéo ou audio depuis votre système de fichiers directement dans l'éditeur. VMark va :

1. Copier le fichier dans le dossier `.assets/` du document
2. Insérer le nœud de média approprié avec un chemin relatif

### Mode Source

En mode Source, tapez les balises HTML directement. Les balises médias sont mises en évidence avec des bordures gauches colorées :

- **Vidéo** — bordure sarcelle
- **Audio** — bordure indigo
- **YouTube** — bordure rouge
- **Vimeo** — bordure bleue
- **Bilibili** — bordure rose

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
- Les iframes d'embeds vidéo sont restreints aux domaines autorisés : `youtube.com`, `youtube-nocookie.com`, `player.vimeo.com` et `player.bilibili.com`
- Les autres sources iframe sont supprimées par le désinfectant
