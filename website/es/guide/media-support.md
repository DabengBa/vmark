# Soporte de Medios

VMark soporta vídeo, audio e incrustaciones de YouTube en tus documentos Markdown usando etiquetas HTML5 estándar.

## Formatos Admitidos

### Vídeo

| Formato | Extensión |
|---------|-----------|
| MP4 | `.mp4` |
| WebM | `.webm` |
| MOV | `.mov` |
| AVI | `.avi` |
| MKV | `.mkv` |
| M4V | `.m4v` |
| OGV | `.ogv` |

### Audio

| Formato | Extensión |
|---------|-----------|
| MP3 | `.mp3` |
| M4A | `.m4a` |
| OGG | `.ogg` |
| WAV | `.wav` |
| FLAC | `.flac` |
| AAC | `.aac` |
| Opus | `.opus` |

## Sintaxis

### Vídeo

Usa las etiquetas de vídeo HTML5 estándar:

```html
<video src="path/to/video.mp4" controls></video>
```

Con atributos opcionales:

```html
<video src="video.mp4" title="Demo" poster="thumbnail.jpg" controls></video>
```

### Audio

Usa las etiquetas de audio HTML5 estándar:

```html
<audio src="path/to/audio.mp3" controls></audio>
```

### Incrustaciones de YouTube

Usa iframes de YouTube con privacidad mejorada:

```html
<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" width="560" height="315" frameborder="0" allowfullscreen></iframe>
```

### Alternativa con Sintaxis de Imagen

También puedes usar la sintaxis de imagen con extensiones de archivos multimedia — VMark los promociona automáticamente al tipo de medio correcto:

```markdown
![](video.mp4)
![](audio.mp3)
```

## Insertar Medios

### Barra de Herramientas

Usa el menú Insertar en la barra de herramientas:

- **Vídeo** — abre un selector de archivos para vídeos, copia a `.assets/`, inserta una etiqueta `<video>`
- **Audio** — abre un selector de archivos para audio, copia a `.assets/`, inserta una etiqueta `<audio>`
- **YouTube** — lee una URL de YouTube del portapapeles e inserta una incrustación con privacidad mejorada

### Arrastrar y Soltar

Arrastra archivos de vídeo o audio desde tu sistema de archivos directamente al editor. VMark:

1. Copiará el archivo a la carpeta `.assets/` del documento
2. Insertará el nodo multimedia apropiado con una ruta relativa

### Modo Fuente

En el modo Fuente, escribe las etiquetas HTML directamente. Las etiquetas multimedia se resaltan con bordes izquierdos de colores:

- **Vídeo** — borde verde azulado
- **Audio** — borde índigo
- **YouTube** — borde rojo

## Editar Medios

Haz doble clic en cualquier elemento multimedia en el modo WYSIWYG para abrir el popup de medios:

- **Ruta de origen** — edita la ruta del archivo o URL
- **Título** — atributo de título opcional
- **Portada** (solo vídeo) — ruta de la imagen en miniatura
- **Eliminar** — elimina el elemento multimedia

Presiona `Escape` para cerrar el popup y volver al editor.

## Resolución de Rutas

VMark admite tres tipos de rutas de medios:

| Tipo de Ruta | Ejemplo | Comportamiento |
|--------------|---------|----------------|
| Relativa | `./assets/video.mp4` | Resuelta relativa al directorio del documento |
| Absoluta | `/Users/me/video.mp4` | Usada directamente a través del protocolo de recursos de Tauri |
| URL externa | `https://example.com/video.mp4` | Cargada directamente desde la web |

Se recomiendan las rutas relativas — mantienen tus documentos portátiles entre máquinas.

## Seguridad

- Las rutas relativas se validan contra ataques de traversal de directorios
- Los iframes de YouTube están restringidos a los dominios `youtube.com` y `youtube-nocookie.com`
- Otras fuentes de iframe son eliminadas por el saneador
