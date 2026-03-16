# Terminal Integrado

VMark incluye un panel de terminal integrado para que puedas ejecutar comandos sin salir del editor.

Presiona `` Ctrl + ` `` para alternar el panel del terminal.

## Sesiones

El terminal admite hasta 5 sesiones concurrentes, cada una con su propio proceso de shell. Una barra de pestañas vertical en el lado derecho muestra las pestañas de sesión numeradas.

| Acción | Cómo |
|--------|------|
| Nueva sesión | Haz clic en el botón **+** |
| Cambiar sesión | Haz clic en un número de pestaña |
| Cerrar sesión | Haz clic en el icono de papelera |
| Reiniciar shell | Haz clic en el icono de reinicio |

Cuando cierras la última sesión, el panel se oculta pero la sesión sigue activa — vuelve a abrirlo con `` Ctrl + ` `` y estarás donde lo dejaste. Si un proceso de shell termina, presiona cualquier tecla para reiniciarlo.

## Atajos de Teclado

Estos atajos funcionan cuando el panel del terminal está enfocado:

| Acción | Atajo |
|--------|-------|
| Copiar | `Mod + C` (con selección) |
| Pegar | `Mod + V` |
| Limpiar | `Mod + K` |
| Buscar | `Mod + F` |
| Alternar Terminal | `` Ctrl + ` `` |

::: tip
`Mod + C` sin una selección de texto envía SIGINT al proceso en ejecución — igual que presionar Ctrl+C en un terminal normal.
:::

## Búsqueda

Presiona `Mod + F` para abrir la barra de búsqueda. Escribe para buscar de forma incremental en el buffer del terminal.

| Acción | Atajo |
|--------|-------|
| Siguiente coincidencia | `Enter` |
| Coincidencia anterior | `Shift + Enter` |
| Cerrar búsqueda | `Escape` |

## Menú Contextual

Haz clic derecho dentro del terminal para acceder a:

- **Copiar** — copiar el texto seleccionado (deshabilitado cuando no hay nada seleccionado)
- **Pegar** — pegar desde el portapapeles al shell
- **Seleccionar Todo** — seleccionar todo el buffer del terminal
- **Limpiar** — limpiar la salida visible

## Enlaces Clicables

El terminal detecta dos tipos de enlaces en la salida de comandos:

- **URLs web** — haz clic para abrir en tu navegador predeterminado
- **Rutas de archivo** — haz clic para abrir el archivo en el editor (admite sufijos `:línea:columna` y rutas relativas resueltas respecto a la raíz del espacio de trabajo)

## Entorno de Shell

VMark establece estas variables de entorno en cada sesión del terminal:

| Variable | Valor |
|----------|-------|
| `TERM_PROGRAM` | `vmark` |
| `EDITOR` | `vmark` |
| `VMARK_WORKSPACE` | Ruta raíz del espacio de trabajo (cuando hay una carpeta abierta) |
| `PATH` | PATH completo del shell de inicio de sesión (igual que en tu terminal del sistema) |

El terminal integrado hereda el `PATH` de tu shell de inicio de sesión, por lo que las herramientas CLI como `node`, `claude` y otros binarios instalados por el usuario son detectables — igual que en una ventana de terminal normal.

El shell se lee desde `$SHELL` (recurre a `/bin/sh`). El directorio de trabajo comienza en la raíz del espacio de trabajo, o el directorio principal del archivo activo, o `$HOME`.

Los atajos de shell estándar como `Ctrl+R` (búsqueda inversa del historial en zsh/bash) funcionan cuando el terminal está enfocado — el editor no los intercepta.

Cuando abres un espacio de trabajo o archivo después de que el terminal ya está en ejecución, todas las sesiones cambian automáticamente su directorio a la nueva raíz del espacio de trabajo mediante `cd`.

## Configuración

Abre **Configuración → Terminal** para configurar:

| Configuración | Rango | Predeterminado |
|---------------|-------|----------------|
| Tamaño de Fuente | 10 – 24 px | 13 px |
| Altura de Línea | 1.0 – 2.0 | 1.2 |
| Copiar al Seleccionar | Activado / Desactivado | Desactivado |

Los cambios se aplican inmediatamente a todas las sesiones abiertas.

## Persistencia

La visibilidad y la altura del panel del terminal se guardan y restauran en los reinicios con salida en caliente. Los procesos de shell en sí no pueden preservarse — se genera un nuevo shell para cada sesión al reiniciar.
