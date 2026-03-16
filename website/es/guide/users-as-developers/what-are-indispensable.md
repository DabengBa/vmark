# Cinco Habilidades Humanas Básicas que Potencian la IA

No necesitas un título en ciencias de la computación para construir software con herramientas de codificación con IA. Pero sí necesitas un pequeño conjunto de habilidades que ninguna IA puede reemplazar. Estas son las bases indispensables — las cosas que hacen posible todo lo demás.

## La Lista Corta

| Habilidad | Por Qué Es Indispensable |
|-------|----------------------|
| **Git** | Tu red de seguridad — deshaz cualquier cosa, crea ramas sin miedo, nunca pierdas trabajo |
| **TDD** | La metodología que mantiene honesto al código generado por IA |
| **Terminal** | Las herramientas de IA viven en el terminal; necesitas leer su salida |
| **Inglés** | La documentación, los errores y los prompts de IA funcionan mejor en inglés |
| **Criterio** | La IA genera opciones; tú decides cuál es la correcta |

Eso es todo. Cinco cosas. Todo lo demás — sintaxis de lenguajes, APIs de frameworks, patrones de diseño — la IA lo maneja por ti.[^1]

## Git — Tu Red de Seguridad

Git es la herramienta más importante en tu arsenal. No porque necesites dominar el rebase o el cherry-picking — la IA maneja eso — sino porque Git te da **experimentación sin miedo**.[^2]

### Lo que Realmente Necesitas Saber

| Comando | Qué Hace | Cuándo lo Usas |
|---------|-------------|----------------|
| `git status` | Muestra qué ha cambiado | Antes y después de cada sesión de IA |
| `git diff` | Muestra los cambios exactos | Revisar lo que escribió la IA antes de hacer commit |
| `git add` + `git commit` | Guardar un punto de control | Después de cada estado funcional |
| `git log` | Historial de cambios | Cuando necesitas entender qué sucedió |
| `git stash` | Guardar temporalmente los cambios | Cuando quieres probar un enfoque diferente |
| `git checkout -- file` | Deshacer cambios en un archivo | Cuando la IA empeoró algo |
| `git worktree` | Trabajar en múltiples ramas simultáneamente | Cuando quieres explorar ideas en paralelo |

### El Modelo Mental

Piensa en Git como **deshacer infinito**. Cada commit es un punto de guardado al que puedes volver. Esto significa:

- **Prueba cambios arriesgados libremente** — siempre puedes volver atrás
- **Deja que la IA experimente** — si rompe algo, regresa
- **Trabaja en múltiples ideas** — las ramas te permiten explorar en paralelo
- **Revisa antes de aceptar** — `git diff` te muestra exactamente lo que cambió la IA

La IA creará commits, ramas y pull requests por ti. Pero debes entender qué son estos, porque eres tú quien decide cuándo guardar, cuándo crear una rama y cuándo fusionar.

### Git Worktrees — Universos Paralelos

Una función de Git que vale la pena aprender temprano son los **worktrees**. Un worktree te permite extraer una rama diferente en un directorio separado — sin cambiar tu trabajo actual:

```bash
# Crear un worktree para una nueva función
git worktree add ../my-feature -b feature/new-idea

# Trabajar en él
cd ../my-feature
claude    # iniciar una sesión de IA en esta rama

# De vuelta a tu trabajo principal — intacto
cd ../vmark
```

Esto es especialmente poderoso con herramientas de codificación con IA: puedes tener una sesión de IA experimentando en una rama de función mientras tu rama principal permanece limpia y funcional. Si el experimento falla, solo elimina el directorio del worktree. Sin desorden, sin riesgo.

::: warning No Te Saltes Git
Sin Git, una sola edición mala de la IA puede arruinar horas de trabajo sin posibilidad de recuperación. Con Git, el peor caso siempre es `git checkout -- .` y vuelves a tu último guardado. Aprende lo básico de Git antes que cualquier otra cosa.
:::

## TDD — Cómo Mantienes Honesta a la IA

El Desarrollo Dirigido por Pruebas es la metodología que convierte la codificación con IA de "espero que funcione" a "demuestro que funciona". No es solo una buena práctica — es tu mecanismo principal para **verificar** que el código generado por IA realmente hace lo que pediste.[^3]

### El Ciclo ROJO-VERDE-REFACTORIZAR

TDD sigue un bucle estricto de tres pasos:

```
1. ROJO     — Escribe una prueba que describa lo que quieres. Falla.
2. VERDE    — Pide a la IA que escriba el código mínimo para pasar la prueba.
3. REFACTORIZAR — Limpia sin cambiar el comportamiento. Las pruebas siguen pasando.
```

Esto funciona notablemente bien con herramientas de codificación con IA porque:

| Paso | Tu Rol | Rol de la IA |
|------|-----------|-----------|
| ROJO | Describir el comportamiento esperado | Ayudar a escribir la aserción de prueba |
| VERDE | Verificar que la prueba pase | Escribir la implementación |
| REFACTORIZAR | Juzgar si el código es suficientemente limpio | Hacer la limpieza |

### Por Qué TDD Importa Más con IA

Cuando escribes código tú mismo, lo entiendes implícitamente — sabes qué hace porque lo escribiste tú. Cuando la IA escribe código, necesitas un **mecanismo de verificación externo**. Las pruebas son ese mecanismo.[^4]

Sin pruebas, esto es lo que sucede:

1. Pides a la IA que añada una función
2. La IA escribe 200 líneas de código
3. Las lees, *parecen* correctas
4. Las lanzas
5. Rompen algo que no notaste — un caso límite sutil, una discrepancia de tipo, un error de ±1

Con TDD:

1. Describes el comportamiento como una prueba (la IA te ayuda a escribirla)
2. La prueba falla — confirmando que está probando algo real
3. La IA escribe código para hacerla pasar
4. Ejecutas la prueba — pasa
5. Tienes **prueba** de que funciona, no solo una sensación

### Cómo se Ve una Prueba

No necesitas escribir pruebas desde cero. Describe lo que quieres en lenguaje sencillo y la IA escribe la prueba. Pero debes poder **leer** una prueba:

```ts
// "Cuando el usuario guarda un documento, el indicador de modificado debe limpiarse"
it("clears modified flag after save", () => {
  // Configuración: marcar el documento como modificado
  store.markModified("doc-1");
  expect(store.isModified("doc-1")).toBe(true);

  // Acción: guardar el documento
  store.save("doc-1");

  // Verificación: el indicador de modificado se ha limpiado
  expect(store.isModified("doc-1")).toBe(false);
});
```

El patrón es siempre el mismo: **configuración**, **acción**, **verificación**. Una vez que reconoces este patrón, puedes leer cualquier prueba — y lo que es más importante, puedes decirle a la IA qué probar a continuación.

### Casos Límite — Donde Viven los Errores

El verdadero poder del TDD está en los **casos límite** — las entradas inusuales y condiciones de frontera donde se esconden los errores. La IA es sorprendentemente mala para pensar en estos por su cuenta.[^5] Pero puedes orientarla:

> "¿Qué sucede si el nombre del archivo está vacío?"
> "¿Qué pasa si el usuario hace doble clic en el botón guardar?"
> "¿Qué pasa si la red cae en medio de una solicitud?"
> "¿Qué hay de un archivo con caracteres Unicode en el nombre?"

Cada uno de estos se convierte en una prueba. Cada prueba se convierte en una garantía. Cuantos más casos límite pienses, más robusto se vuelve tu software. Aquí es donde el **criterio** humano y la **velocidad de implementación** de la IA se combinan para producir algo que ninguno podría lograr por sí solo.

### TDD en la Práctica con IA

Aquí hay un flujo de trabajo real:

```
Tú:    Añade una función que compruebe si un nombre de archivo es válido.
       Empieza con una prueba que falle.

IA:    [Escribe la prueba] it("rejects empty filenames", () => { ... })
       [La prueba falla — ROJO ✓]

Tú:    Ahora hazla pasar.

IA:    [Escribe isValidFilename()]
       [La prueba pasa — VERDE ✓]

Tú:    Añade pruebas para: solo espacios, separadores de ruta,
       nombres de más de 255 caracteres, bytes nulos.

IA:    [Escribe 4 pruebas más, algunas fallan]
       [Actualiza la función para manejar todos los casos]
       [Todas las pruebas pasan — VERDE ✓]

Tú:    Bien. Refactoriza si es necesario.

IA:    [Simplifica la expresión regular, mantiene las pruebas pasando — REFACTORIZAR ✓]
```

No escribiste ni una sola línea de código. Pero dirigiste cada decisión. Las pruebas demuestran que el código funciona. Y si alguien cambia la función más tarde, las pruebas detectan las regresiones.

::: tip El Trinquete de Cobertura
VMark aplica umbrales de cobertura de pruebas — si la cobertura cae por debajo del mínimo, la compilación falla. Esto significa que cada nueva función *debe* tener pruebas. La IA lo sabe y escribe pruebas automáticamente, pero debes verificar que prueben un comportamiento significativo, no solo líneas de código.
:::

## Terminal

Las herramientas de codificación con IA son programas de línea de comandos. Claude Code, Codex CLI, Gemini CLI — todos se ejecutan en un terminal. No necesitas memorizar cientos de comandos, pero necesitas estar cómodo con un puñado:

```bash
cd ~/projects/vmark      # Navegar a un directorio
ls                        # Listar archivos
git status                # Ver qué ha cambiado
git log --oneline -5      # Commits recientes
pnpm install              # Instalar dependencias
pnpm test                 # Ejecutar pruebas
```

La IA sugerirá y ejecutará comandos por ti. Tu trabajo es **leer la salida** y entender si las cosas tuvieron éxito o fallaron. Un fallo de prueba se ve diferente a un error de compilación. Un "permiso denegado" es diferente a "archivo no encontrado". No necesitas solucionar esto tú mismo — pero necesitas describir lo que ves para que la IA pueda solucionarlo.

::: tip Empieza Aquí
Si nunca has usado un terminal, empieza con [The Missing Semester](https://missing.csail.mit.edu/) del MIT — específicamente la primera conferencia sobre herramientas de shell. Una hora de práctica te da suficiente para trabajar con herramientas de codificación con IA.
:::

## Inglés

Esto no se trata de escribir prosa perfecta. Se trata de **comprensión lectora** — entender mensajes de error, documentación y explicaciones de IA. Todo el ecosistema de software funciona en inglés:[^6]

- **Los mensajes de error** están en inglés
- **La documentación** se escribe primero en inglés (y a menudo solo en inglés)
- **Stack Overflow**, los issues de GitHub y los tutoriales están abrumadoramente en inglés
- **Los modelos de IA funcionan notablemente mejor** con prompts en inglés (ver [Por Qué los Prompts en Inglés Producen Mejor Código](/es/guide/users-as-developers/prompt-refinement))

No necesitas escribir con fluidez. Necesitas:

1. **Leer** un mensaje de error y entender lo esencial
2. **Buscar** términos técnicos de manera efectiva
3. **Describir** lo que quieres a la IA con suficiente claridad

Si el inglés no es tu primer idioma, el gancho `::` de VMark traduce y refina tus prompts automáticamente. Pero leer las respuestas de la IA — que están en inglés — es algo que harás constantemente.

## Criterio — La Única Cosa que la IA No Puede Reemplazar

Esto es lo más difícil de definir y lo más importante. **Criterio** es saber cómo se ve lo bueno — incluso si todavía no puedes construirlo tú mismo.[^7]

Cuando la IA te ofrece tres enfoques para resolver un problema, el criterio es lo que te dice:

- El simple es mejor que el ingenioso
- La solución con menos dependencias es preferible
- El código que se lee como prosa supera al código "optimizado"
- Una función de 10 líneas es sospechosa si 5 líneas serían suficientes

### Cómo Desarrollar el Criterio

1. **Usa buen software** — nota qué se siente bien y qué se siente torpe
2. **Lee buen código** — navega proyectos populares de código abierto en GitHub
3. **Lee la salida** — cuando la IA genera código, léelo aunque no puedas escribirlo
4. **Pregunta "por qué"** — cuando la IA toma una decisión, pídele que explique los compromisos
5. **Itera** — si algo se siente mal, probablemente lo esté. Pídele a la IA que lo intente de nuevo

El criterio se acumula con el tiempo. Cuanto más código leas (incluso código generado por IA), mejores se vuelven tus instintos. Después de unos meses de desarrollo asistido por IA, detectarás problemas que la IA pasa por alto — no porque sepas más sintaxis, sino porque sabes cómo debería **sentirse el resultado**.

::: tip La Prueba del Criterio
Después de que la IA termine una tarea, pregúntate: "Si fuera un usuario, ¿esto se sentiría correcto?" Si la respuesta no es un sí inmediato, dile a la IA qué se siente mal. No necesitas saber la solución — solo la sensación.
:::

## Lo que No Necesitas

Tan importante como conocer lo esencial es saber qué puedes omitir con seguridad:

| No Necesitas | Porque |
|----------------|---------|
| Dominio de lenguajes de programación | La IA escribe el código; tú lo revisas |
| Experiencia en frameworks | La IA conoce React, Rails, Django mejor que la mayoría de los humanos |
| Conocimiento de algoritmos | La IA implementa algoritmos; tú describes el objetivo |
| Habilidades de DevOps | La IA escribe configuraciones de CI, Dockerfiles, scripts de despliegue |
| Patrones de diseño memorizados | La IA aplica el patrón correcto cuando describes el comportamiento |
| Años de experiencia | Perspectiva fresca + IA > experiencia sin IA[^8] |

Esto no significa que estas habilidades no tengan valor — te hacen más rápido y más efectivo. Pero ya no son **requisitos previos**. Puedes aprenderlos gradualmente, en el trabajo, con la IA enseñándote mientras avanzas.

## El Efecto Compuesto

Estas cinco habilidades — Git, TDD, terminal, inglés y criterio — no solo se suman. Se **multiplican**.[^9]

- La seguridad de Git te permite experimentar libremente, lo que desarrolla el criterio más rápido
- TDD te da confianza en la salida de la IA, para que puedas moverte más rápido
- La fluidez en el terminal te permite ejecutar pruebas y comandos Git sin fricción
- La comprensión del inglés te permite leer mensajes de error y documentación
- El criterio hace que tus prompts sean más precisos, lo que produce mejor código
- El mejor código te da mejores ejemplos para aprender

Después de algunas semanas de desarrollo asistido por IA, te encontrarás entendiendo cosas que nunca estudiaste formalmente. Ese es el efecto compuesto en acción — y es por eso que estas cinco bases, y solo estas cinco, son verdaderamente indispensables.

[^1]: El movimiento "sin código" y "poco código" ha intentado eliminar las barreras de programación durante años. Las herramientas de codificación con IA lo logran de manera más efectiva porque no limitan lo que puedes construir — escriben código arbitrario en cualquier lenguaje, siguiendo cualquier patrón, basándose en descripciones en lenguaje natural. Ver: Jiang, E. et al. (2022). [Discovering the Syntax and Strategies of Natural Language Programming with Generative Language Models](https://dl.acm.org/doi/10.1145/3491102.3501870). *CHI 2022*.

[^2]: El modelo de ramificación de Git cambia fundamentalmente cómo las personas abordan la experimentación. La investigación sobre flujos de trabajo de desarrolladores muestra que los equipos que usan commits frecuentes y pequeños con ramas son significativamente más propensos a intentar cambios arriesgados — porque el coste del fracaso se reduce a casi cero. Ver: Bird, C. et al. (2009). [Does Distributed Development Affect Software Quality?](https://dl.acm.org/doi/10.1145/1555001.1555040). *ICSE 2009*.

[^3]: El Desarrollo Dirigido por Pruebas fue formalizado por Kent Beck en 2002 y desde entonces se ha convertido en un pilar de la ingeniería de software profesional. La disciplina de escribir pruebas primero obliga a los desarrolladores a clarificar los requisitos antes de la implementación — un beneficio que se vuelve aún más poderoso cuando el "desarrollador" es una IA que necesita instrucciones precisas. Ver: Beck, K. (2002). [Test-Driven Development: By Example](https://www.oreilly.com/library/view/test-driven-development/0321146530/). Addison-Wesley.

[^4]: Los estudios sobre generación de código con IA encuentran consistentemente que el código generado por IA pasa pruebas funcionales a tasas más bajas que el código escrito por humanos a menos que sea guiado por casos de prueba explícitos. Proporcionar casos de prueba en el prompt aumenta la generación de código correcto en un 20–40%. Ver: Chen, M. et al. (2021). [Evaluating Large Language Models Trained on Code](https://arxiv.org/abs/2107.03374). *arXiv:2107.03374*; Austin, J. et al. (2021). [Program Synthesis with Large Language Models](https://arxiv.org/abs/2108.07732). *arXiv:2108.07732*.

[^5]: Los modelos de IA tienen un rendimiento sistemáticamente inferior en casos límite y condiciones de frontera. Tienden a generar código de "camino feliz" que maneja entradas comunes pero falla con las inusuales. Esta es una limitación documentada de la generación de código basada en transformadores — los datos de entrenamiento están sesgados hacia patrones de uso típicos. Ver: Pearce, H. et al. (2022). [Examining Zero-Shot Vulnerability Repair with Large Language Models](https://arxiv.org/abs/2112.02125). *IEEE S&P 2022*.

[^6]: El inglés domina la programación y la documentación técnica por un margen abrumador. El análisis de los repositorios públicos de GitHub muestra que más del 90% de los archivos README y comentarios de código están en inglés. De manera similar, los 23 millones de preguntas de Stack Overflow son predominantemente en inglés. Ver: Casalnuovo, C. et al. (2015). [Developer Onboarding in GitHub](https://dl.acm.org/doi/10.1145/2786805.2786854). *ESEC/FSE 2015*.

[^7]: El "criterio" en ingeniería de software — la capacidad de distinguir el buen diseño del malo — es cada vez más reconocido como una habilidad central. Fred Brooks escribió que "los grandes diseños provienen de grandes diseñadores", no de grandes procesos. Con la IA manejando los aspectos mecánicos de la codificación, este juicio estético se convierte en la contribución humana principal. Ver: Brooks, F. (2010). [The Design of Design](https://www.oreilly.com/library/view/the-design-of/9780321702081/). Addison-Wesley.

[^8]: Los estudios sobre programación asistida por IA muestran que los desarrolladores con menos experiencia a menudo se benefician más de las herramientas de IA que los expertos — porque la brecha entre "poder describir" e "poder implementar" se reduce drásticamente con la asistencia de IA. Ver: Peng, S. et al. (2023). [The Impact of AI on Developer Productivity](https://arxiv.org/abs/2302.06590). *arXiv:2302.06590*.

[^9]: El concepto de "aprendizaje compuesto" — donde las habilidades fundamentales aceleran la adquisición de habilidades relacionadas — está bien establecido en la investigación educativa. En programación específicamente, entender algunos conceptos clave desbloquea el aprendizaje rápido de todo lo construido sobre ellos. Ver: Sorva, J. (2012). [Visual Program Simulation in Introductory Programming Education](https://aaltodoc.aalto.fi/handle/123456789/3534). Aalto University.
