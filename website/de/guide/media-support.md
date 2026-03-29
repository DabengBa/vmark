# Medienunterstützung

VMark unterstützt Video-, Audio- und YouTube-Einbettungen in Ihren Markdown-Dokumenten mit Standard-HTML5-Tags.

## Unterstützte Formate

### Video

| Format | Erweiterung |
|--------|-------------|
| MP4 | `.mp4` |
| WebM | `.webm` |
| MOV | `.mov` |
| AVI | `.avi` |
| MKV | `.mkv` |
| M4V | `.m4v` |
| OGV | `.ogv` |

### Audio

| Format | Erweiterung |
|--------|-------------|
| MP3 | `.mp3` |
| M4A | `.m4a` |
| OGG | `.ogg` |
| WAV | `.wav` |
| FLAC | `.flac` |
| AAC | `.aac` |
| Opus | `.opus` |

## Syntax

### Video

Standard-HTML5-Video-Tags verwenden:

```html
<video src="path/to/video.mp4" controls></video>
```

Mit optionalen Attributen:

```html
<video src="video.mp4" title="Demo" poster="thumbnail.jpg" controls></video>
```

### Audio

Standard-HTML5-Audio-Tags verwenden:

```html
<audio src="path/to/audio.mp3" controls></audio>
```

### YouTube-Einbettungen

Datenschutzverbesserte YouTube-iFrames verwenden:

```html
<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

### Vimeo-Einbettungen

Vimeo-Player-iFrames verwenden:

```html
<iframe src="https://player.vimeo.com/video/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

Sie können auch eine Vimeo-URL direkt einfügen (z.B. `https://vimeo.com/123456789`) und VMark konvertiert sie automatisch in eine Einbettung.

### Bilibili-Einbettungen

Den Bilibili-Player-iFrame mit einer BV-ID verwenden:

```html
<iframe src="https://player.bilibili.com/player.html?bvid=BV1xxxxxxxxx" width="560" height="350" frameborder="0" allowfullscreen></iframe>
```

Fügen Sie eine Bilibili-Video-URL ein (z.B. `https://bilibili.com/video/BV1xxxxxxxxx`) und VMark konvertiert sie automatisch in eine Einbettung. Beachten Sie, dass Kurz-URLs (`b23.tv`) nicht unterstützt werden, da sie eine Weiterleitungsauflösung erfordern.

### Bildsyntax-Fallback

Sie können auch Bildsyntax mit Mediendateiendungen verwenden — VMark befördert diese automatisch zum korrekten Medientyp:

```markdown
![](video.mp4)
![](audio.mp3)
```

## Medien einfügen

### Symbolleiste

Das Einfügen-Menü in der Symbolleiste verwenden:

- **Video** — öffnet eine Dateiauswahl für Videodateien, kopiert in `.assets/`, fügt einen `<video>`-Tag ein
- **Audio** — öffnet eine Dateiauswahl für Audiodateien, kopiert in `.assets/`, fügt einen `<audio>`-Tag ein
- **YouTube** — liest eine YouTube-URL aus der Zwischenablage und fügt eine datenschutzverbesserte Einbettung ein
- **Vimeo** und **Bilibili** — fügen Sie eine Video-URL direkt in den Editor ein und VMark erkennt den Anbieter automatisch

### Drag & Drop

Video- oder Audiodateien aus Ihrem Dateisystem direkt in den Editor ziehen. VMark wird:

1. Die Datei in den `.assets/`-Ordner des Dokuments kopieren
2. Den entsprechenden Medienknoten mit einem relativen Pfad einfügen

### Quellmodus

Im Quellmodus HTML-Tags direkt eingeben. Medien-Tags werden mit farbigen linken Rändern hervorgehoben:

- **Video** — Blaugrüner Rand
- **Audio** — Indigoblauer Rand
- **YouTube** — Roter Rand
- **Vimeo** — Blauer Rand
- **Bilibili** — Rosa Rand

## Medien bearbeiten

Doppelklicken Sie auf ein beliebiges Medienelement im WYSIWYG-Modus, um das Medien-Popup zu öffnen:

- **Quellpfad** — den Dateipfad oder die URL bearbeiten
- **Titel** — optionales Titelattribut
- **Poster** (nur Video) — Pfad zum Vorschaubild
- **Entfernen** — das Medienelement löschen

`Escape` drücken, um das Popup zu schließen und zum Editor zurückzukehren.

## Pfadauflösung

VMark unterstützt drei Arten von Medienpfaden:

| Pfadtyp | Beispiel | Verhalten |
|---------|---------|-----------|
| Relativ | `./assets/video.mp4` | Relativ zum Verzeichnis des Dokuments aufgelöst |
| Absolut | `/Users/ich/video.mp4` | Direkt über das Tauri-Asset-Protokoll verwendet |
| Externe URL | `https://example.com/video.mp4` | Direkt aus dem Web geladen |

Relative Pfade werden empfohlen — sie halten Ihre Dokumente über Rechner hinweg portabel.

## Sicherheit

- Relative Pfade werden gegen Directory-Traversal-Angriffe validiert
- Video-Einbettungs-iFrames sind auf erlaubte Domains beschränkt: `youtube.com`, `youtube-nocookie.com`, `player.vimeo.com` und `player.bilibili.com`
- Andere iFrame-Quellen werden vom Bereiniger entfernt
