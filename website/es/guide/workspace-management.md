# Gestión del Espacio de Trabajo

Un espacio de trabajo en VMark es una carpeta abierta como raíz de tu proyecto. Cuando abres un espacio de trabajo, la barra lateral muestra un árbol de archivos, Apertura Rápida indexa cada archivo markdown, el terminal se inicia en la raíz del proyecto y tus pestañas abiertas se recuerdan para la próxima vez.

Sin un espacio de trabajo, aún puedes abrir archivos individuales, pero pierdes el explorador de archivos, la búsqueda dentro del proyecto y la restauración de sesiones.

## Abrir un Espacio de Trabajo

| Método | Cómo |
|--------|------|
| Menú | **Archivo > Abrir Espacio de Trabajo** |
| Apertura Rápida | `Mod + O`, luego selecciona **Examinar...** al final |
| Arrastrar y soltar | Arrastra un archivo markdown desde el Finder a la ventana — VMark detecta su raíz de proyecto y abre el espacio de trabajo automáticamente |
| Espacios de Trabajo Recientes | **Archivo > Espacios de Trabajo Recientes** y elige un proyecto anterior |

Cuando abres un espacio de trabajo, VMark muestra la barra lateral con el explorador de archivos. Si el espacio de trabajo fue abierto anteriormente, las pestañas abiertas previamente se restauran.

::: tip
Si la ventana actual tiene cambios sin guardar, VMark ofrece abrir el espacio de trabajo en una nueva ventana en lugar de reemplazar tu trabajo.
:::

## Explorador de Archivos

El explorador de archivos aparece en la barra lateral siempre que hay un espacio de trabajo abierto. Muestra un árbol de archivos markdown con raíz en la carpeta del espacio de trabajo.

### Navegación

- **Un clic** en una carpeta para expandirla o contraerla
- **Doble clic** o **Enter** en un archivo para abrirlo en una pestaña
- Los archivos que no son markdown se abren con la aplicación predeterminada del sistema

### Operaciones de Archivos

Haz clic derecho en cualquier archivo o carpeta para acceder al menú contextual:

| Acción | Descripción |
|--------|-------------|
| Abrir | Abre el archivo en una nueva pestaña |
| Renombrar | Edita el nombre del archivo o carpeta en línea (también `F2`) |
| Duplicar | Crea una copia del archivo |
| Mover a... | Mueve el archivo a una carpeta diferente mediante un cuadro de diálogo |
| Eliminar | Mueve el archivo o carpeta a la papelera del sistema |
| Copiar Ruta | Copia la ruta absoluta del archivo al portapapeles |
| Revelar en el Finder | Muestra el archivo en el Finder (macOS) |
| Nuevo Archivo | Crea un nuevo archivo markdown en esta ubicación |
| Nueva Carpeta | Crea una nueva carpeta en esta ubicación |

También puedes **arrastrar y soltar** archivos entre carpetas directamente en el árbol.

### Alternadores de Visibilidad

De forma predeterminada, el explorador muestra solo archivos markdown y oculta los archivos de puntos. Dos alternadores cambian esto:

| Alternador | Atajo | Qué hace |
|-----------|-------|---------|
| Mostrar Archivos Ocultos | `Mod + Shift + .` (macOS) / `Ctrl + H` (Win/Linux) | Muestra archivos de puntos y carpetas ocultas |
| Mostrar Todos los Archivos | *(Configuración o menú contextual)* | Muestra archivos que no son markdown junto con tus documentos |

Ambas configuraciones se guardan por espacio de trabajo y persisten entre sesiones.

### Carpetas Excluidas

Ciertas carpetas se excluyen del árbol de forma predeterminada:

- `.git`
- `node_modules`

Estos valores predeterminados se aplican cuando se abre un espacio de trabajo por primera vez.

## Apertura Rápida

Presiona `Mod + O` para abrir la superposición de Apertura Rápida. Proporciona búsqueda difusa en tres fuentes:

1. **Archivos recientes** que has abierto antes
2. **Pestañas abiertas** en la ventana actual (marcadas con un indicador de punto)
3. **Todos los archivos markdown** en el espacio de trabajo

Escribe algunos caracteres para filtrar — la coincidencia es difusa, así que `rme` encuentra `README.md`. Usa las teclas de flecha para navegar y **Enter** para abrir. Una fila **Examinar...** fijada al final abre un cuadro de diálogo de archivos.

| Acción | Atajo |
|--------|-------|
| Abrir Apertura Rápida | `Mod + O` |
| Navegar resultados | `Arriba / Abajo` |
| Abrir archivo seleccionado | `Enter` |
| Cerrar | `Escape` |

::: tip
Sin un espacio de trabajo, la Apertura Rápida sigue funcionando — muestra los archivos recientes y las pestañas abiertas, pero no puede buscar en el árbol de archivos.
:::

## Espacios de Trabajo Recientes

VMark recuerda hasta 10 espacios de trabajo abiertos recientemente. Accede a ellos desde **Archivo > Espacios de Trabajo Recientes** en la barra de menú.

- Los espacios de trabajo están ordenados por la hora de la última apertura (el más reciente primero)
- La lista se sincroniza con el menú nativo en cada cambio
- Elige **Limpiar Espacios de Trabajo Recientes** para restablecer la lista

## Configuración del Espacio de Trabajo

Cada espacio de trabajo tiene su propia configuración que persiste entre sesiones. La configuración se almacena en el directorio de datos de la aplicación VMark — no dentro de la carpeta del proyecto — para mantener tu espacio de trabajo limpio.

Las siguientes configuraciones se guardan por espacio de trabajo:

| Configuración | Descripción |
|---------------|-------------|
| Carpetas excluidas | Carpetas ocultas del explorador de archivos |
| Mostrar archivos ocultos | Si los archivos de puntos son visibles |
| Mostrar todos los archivos | Si los archivos que no son markdown son visibles |
| Últimas pestañas abiertas | Rutas de archivos para la restauración de sesión en la próxima apertura |

::: tip
La configuración del espacio de trabajo está vinculada a la ruta de la carpeta. Abrir la misma carpeta en la misma máquina siempre restaura tu configuración, incluso desde una ventana diferente.
:::

## Restauración de Sesión

Cuando cierras una ventana que tiene un espacio de trabajo abierto, VMark guarda la lista de pestañas abiertas en la configuración del espacio de trabajo. La próxima vez que abras el mismo espacio de trabajo, esas pestañas se restauran automáticamente.

- Solo se restauran las pestañas con una ruta de archivo guardada (las pestañas sin título no se persisten)
- Si un archivo fue movido o eliminado desde la última sesión, se omite silenciosamente
- Los datos de sesión se guardan al cerrar la ventana y al cerrar el espacio de trabajo (**Archivo > Cerrar Espacio de Trabajo**)

## Múltiples Ventanas

Cada ventana de VMark puede tener su propio espacio de trabajo independiente. Esto te permite trabajar en múltiples proyectos simultáneamente.

- **Archivo > Nueva Ventana** abre una ventana nueva
- Abrir un espacio de trabajo en una nueva ventana no afecta a otras ventanas
- El tamaño y la posición de la ventana se recuerdan por ventana

Cuando arrastras un archivo markdown desde el Finder y la ventana actual ya tiene trabajo sin guardar, VMark abre el proyecto del archivo en una nueva ventana automáticamente.

## Integración con el Terminal

El terminal integrado usa automáticamente la raíz del espacio de trabajo como su directorio de trabajo. Cuando abres o cambias de espacio de trabajo, todas las sesiones del terminal ejecutan `cd` a la nueva raíz.

La variable de entorno `VMARK_WORKSPACE` se establece con la ruta del espacio de trabajo en cada sesión del terminal, para que tus scripts puedan referenciar la raíz del proyecto.

[Más información sobre el terminal →](/es/guide/terminal)
