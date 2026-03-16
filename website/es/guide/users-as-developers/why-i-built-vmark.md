# Por Qué Construí un Editor de Markdown: VMark

::: info TL;DR
Un no-programador comenzó a hacer vibe coding en agosto de 2025 y construyó VMark — un editor de Markdown — en seis semanas. Lecciones clave: **git es obligatorio** (es tu botón de deshacer), **TDD mantiene a la IA honesta** (las pruebas son límites contra los errores), **estás haciendo vibe thinking, no vibe coding** (la IA hace el trabajo, tú haces el juicio), y **el debate entre modelos supera la confianza en un único modelo**. El viaje demostró que los usuarios pueden convertirse en desarrolladores — pero solo si invierten en unas pocas habilidades fundamentales.
:::

## Cómo Empezó

En verdad, construir VMark ha sido principalmente un viaje de aprendizaje y experiencia personal.

Empecé a experimentar con la tendencia de programación emergente conocida como *vibe coding* el 17 de agosto de 2025. El término *vibe coding* en sí fue acuñado y difundido por primera vez el 2 de febrero de 2025, originado en una publicación de Andrej Karpathy en [X](https://x.com/karpathy/status/1886192184808149383) (anteriormente Twitter).

![Tweet de Andrej Karpathy acuñando "vibe coding"](./images/karpathy-vibe-coding.png)

Andrej Karpathy es un investigador y educador muy influyente en el campo del aprendizaje automático. Ha ocupado puestos importantes en empresas como OpenAI y Tesla, y posteriormente fundó Eureka Labs, enfocándose en educación nativa de IA. Su tweet no solo introdujo el concepto de "vibe coding", sino que también se difundió rápidamente por la comunidad tecnológica, desencadenando extensas discusiones de seguimiento.

Para cuando me di cuenta y empecé a usar herramientas de vibe coding, ya había pasado casi medio año. En ese momento, Claude Code todavía estaba en la versión [1.0.82](https://github.com/anthropics/claude-code/commit/b1751f2). Mientras escribo este documento el 9 de febrero de 2026, ha alcanzado la versión [2.1.37](https://github.com/anthropics/claude-code/commit/85f28079913b67a498ce16f32fd88aeb72a01939), habiendo pasado por 112 actualizaciones de versión en el ínterin.

Al principio, solo usé estas herramientas para mejorar algunos scripts de automatización que había escrito hace tiempo — por ejemplo, traducir libros electrónicos por lotes. Lo que me di cuenta fue que simplemente estaba amplificando habilidades que ya tenía.

Si ya sabía hacer algo, la IA me ayudaba a hacerlo mejor. Si no sabía hacer algo, la IA a menudo me daba la ilusión de que podía — normalmente con un momento inicial de "wow" — seguido de nada. Lo que originalmente no podía hacer, todavía no podía hacerlo. Esas hermosas imágenes, videos llamativos y artículos largos eran, en muchos casos, solo otra forma de "Hello World" para una nueva era.[^1]

No soy completamente ignorante en programación, pero ciertamente no soy un verdadero ingeniero informático. En el mejor de los casos, soy un usuario avanzado entre usuarios normales. Conozco algo de código, e incluso he publicado un libro sobre programación en Python. Pero eso no me convierte en un ingeniero. Es como alguien que puede construir una choza de paja: sabe más que alguien que no puede, pero no está ni remotamente en la misma categoría que quienes diseñan rascacielos o puentes.

Y entonces, la IA lo cambió todo.

## De Scripts a Software

Desde el principio hasta ahora, he probado casi todos los CLI de codificación con IA disponibles: Claude Code, Codex CLI, Gemini CLI, incluso herramientas no oficiales como Grok CLI, así como alternativas de código abierto como Aider. Sin embargo, el que más he usado siempre ha sido Claude Code. Después de que Codex CLI introdujera un servidor MCP, usé aún más Claude Code, porque podía llamar a Codex CLI directamente en modo interactivo. Irónicamente, aunque Claude Code fue el primero en proponer el protocolo MCP, todavía no proporciona un servidor MCP por sí mismo (a partir del 2026-02-10).

Al principio, Claude Code se sentía como un especialista en TI profesional que de repente se había mudado a mi casa — alguien que normalmente solo encontrarías en grandes empresas. Cualquier cosa relacionada con la computadora podía entregársele. Resolvía problemas usando herramientas de línea de comandos que nunca había visto antes, o comandos familiares usados de maneras desconocidas.

Siempre que se le daban permisos suficientes, casi no había nada que no pudiera hacer: mantenimiento del sistema, actualizaciones, redes, despliegue de software o servicios con innumerables configuraciones y conflictos complicados. Nunca podrías contratar a una persona así por 200 USD al mes.

Después de eso, el número de máquinas que usaba comenzó a aumentar. Las instancias en la nube crecieron de una o dos a cinco o seis; las máquinas en casa aumentaron de dos o tres a siete u ocho. Problemas que solían llevar días de configuración — y a menudo fallaban debido a mi conocimiento limitado — de repente desaparecieron. Claude Code manejó todas las operaciones de máquina por mí, y después de solucionar los problemas, incluso escribió scripts de inicio automático para garantizar que los mismos problemas nunca volvieran a ocurrir.

Entonces comencé a escribir cosas que nunca había podido escribir antes.

Primero vino una extensión de navegador llamada **Insidebar-ai**, diseñada para reducir el constante cambio de contexto y copiar y pegar en el navegador. Luego vino **Tepub**, que en realidad parecía software real: una herramienta de línea de comandos en Python para traducir libros EPUB (monolingüe o bilingüe) e incluso generar audiolibros. Antes de eso, todo lo que tenía eran scripts Python torpes y escritos a mano.

Me sentía como un blogger de moda que de repente había adquirido habilidades de sastrería — o incluso era dueño de una fábrica textil. Sin importar cuán bueno fuera mi gusto antes, una vez que inadvertidamente aprendí más sobre campos relacionados y fundamentales, muchas de mis opiniones cambiaron de forma natural — e inevitable.

Decidí pasar varios años convirtiéndome en un verdadero ingeniero informático.

Había hecho algo similar antes. Enseñé clases de lectura en New Oriental durante muchos años. Después de enseñar durante varios años, al menos en lectura, me había convertido efectivamente en un lector nativo de inglés (no hablante). Mi expresión oral era terrible — pero de todos modos no había ningún uso real para ella — así que ahí quedó eso.

No tenía ambiciones grandiosas. Solo quería ejercitar mi cerebro. Es el juego más interesante, ¿verdad?

Decidí completar un proyecto relativamente pequeño cada semana, y uno relativamente más grande cada mes. Después de docenas de proyectos, suponía que me convertiría en una persona diferente.

Tres meses después, había construido más de una docena de proyectos — algunos fallaron, algunos fueron abandonados — pero todos fueron fascinantes. Durante este proceso, la IA se volvió visiblemente más inteligente a un ritmo asombroso. Sin un uso denso y práctico, nunca lo sentirías realmente; en el mejor de los casos, lo escucharías de segunda mano. Esta sensación importa, porque moldeó directamente una filosofía de IA que discutiré más adelante: **una firme convicción de que la IA seguirá volviéndose más inteligente**.

En noviembre de 2025, construí un lector EPUB basado en foliate.js, diseñado exactamente como me gustaba. Implementé funciones que no podía conseguir en Kindle o Apple Books (macOS/iOS): resaltados en capas, gestión de resaltados y notas (no solo exportación), diccionarios personalizados, exportación de tarjetas Obsidian y más. Había errores ocasionales, pero no afectaban mi uso personal.

Dicho esto, me daba demasiada vergüenza lanzarlo públicamente. La mayor lección que aprendí fue esta: algo construido solo para uno mismo es un *juguete*; algo construido para mucha gente es un *producto* o un *servicio*.

## Por Qué un Editor de Markdown

Naturalmente, todavía solo pensaba en mis propias necesidades. Una vez que se resolvió la "lectura", lo siguiente que podía resolver para mí mismo era la "escritura". Así que el 27 de diciembre de 2025 — después de regresar a Pekín desde Harbin después de Navidad — empecé a construir **VMark**. El nombre simplemente significa *Editor de Markdown creado con vibe coding*. Incluso su icono fue creado con vibe coding: Claude Code instruyó a Sketch mediante MCP para dibujarlo.

Elegir construir un editor de Markdown tenía otras razones también.

> - Sentía que tenía una idea bastante clara de cómo *debería* ser un editor de Markdown.
>
> - También tenía muchas necesidades insatisfechas que los editores existentes no lograban satisfacer.
>
> - Intuitivamente, se sentía como un proyecto del tamaño correcto para mí en esta etapa — un proyecto de "tamaño medio" que podía manejar de manera realista.
>
> - También creía que tal proyecto me permitiría que la IA me ayudara más. Después de todo, un editor de Markdown no es algo nuevo; cada detalle de él es algo que la IA entiende mejor que casi cualquiera.

Y entonces caí en un agujero — uno muy profundo. Un editor de Markdown verdaderamente bueno es extremadamente difícil de construir, mucho más complejo de lo que había imaginado.

Estuve superficialmente feliz durante unos días, luego pasé una semana luchando repetidamente y sintiéndome abatido. Eventualmente, le pregunté a ChatGPT:

> ¿Cuál es la carga de trabajo para construir un editor de Markdown realmente bueno?

El inicio de su respuesta me hizo reír — de mi propia ignorancia.

> - Un editor de Markdown usable: **1 persona · 1–2 semanas**
>
> - Un buen editor de Markdown: **1–2 personas · 1–3 meses**
>
> - Un editor de Markdown del que los escritores intensivos no puedan prescindir:\
>   **3–8 personas · 1–3 años** (y esencialmente un proyecto en continua evolución)
>
> - (Muchos detalles omitidos.)
>
> - Luego vino la pregunta final:\
>   *¿Cuánto tiempo estás dispuesto a mantenerlo (en años, no en meses)?*

Eso en realidad me tranquilizó. ¿Mantenimiento medido en *años*? Puede ser un problema para otros, pero no para mí. No le temo a eso. También tuve una pequeña perspectiva: Markdown es probablemente el formato más fundamental para la futura interacción humano-computadora. Solo lo usaré más con el tiempo. Si es así, ¿por qué no mantenerlo indefinidamente?

Como nota al margen, durante este proceso descubrí que Typora — un editor que había usado y pagado por múltiples licencias durante muchos años — fue en realidad desarrollado por una empresa con sede en Shanghái.

Dos semanas después, VMark tenía una forma básica. Un mes completo después, el 27 de enero de 2026, cambié su etiqueta de *alpha* a *beta*.

## Un Editor con Criterio

VMark es **muy opinativo**. De hecho, sospecho que todo el software y los servicios creados con vibe coding lo serán. Esto es inevitable, porque el vibe coding es inherentemente un proceso de producción sin reuniones — solo yo y un ejecutor que nunca contradice.

Aquí hay algunas de mis preferencias personales:

> - Toda la información que no sea contenido debe mantenerse fuera del área principal. Incluso el menú de formato se coloca en la parte inferior.
>
> - Tengo preferencias tipográficas obstinadas.
>
> - Los caracteres chinos deben tener espaciado entre ellos, pero las letras latinas incrustadas en texto chino no deben tenerlo. Antes de VMark, ningún editor satisfacía este requisito de nicho y sin valor comercial.
>
> - El interlineado debe ser ajustable en cualquier momento.
>
> - Las tablas solo deben tener color de fondo en la fila de encabezado. Odio las franjas de cebra.
>
> - Las tablas e imágenes deben poder centrarse.
>
> - Solo los encabezados H1 deben tener subrayados.

Algunas funciones que típicamente solo se encuentran en editores de código deben existir:

> - Modo multi-cursor
>
> - Ordenación de múltiples líneas
>
> - Emparejamiento automático de puntuación

Otras son opcionales, pero agradables de tener:

> - Tab Right Escape
>
> - Me gustan los editores de Markdown WYSIWYG, pero odio cambiar constantemente de vista (aunque a veces es necesario). Por eso diseñé una función de *Source Peek* (F5), que me permite ver y editar la fuente del bloque actual sin cambiar toda la vista.
>
> - Exportar PDF no es tan importante. Exportar HTML dinámico sí lo es.

Y así sucesivamente.

## Errores y Avances

Durante el desarrollo, cometí incontables errores, incluyendo pero no limitados a:

> - Implementar funciones complejas demasiado pronto, inflando innecesariamente el alcance
>
> - Gastar tiempo en funciones que luego se eliminaron
>
> - Dudar entre caminos, reiniciando una y otra vez
>
> - Seguir un camino demasiado tiempo antes de darme cuenta de que me faltaban principios guía

En resumen, cometí cada error que puede cometer un ingeniero inmaduro — muchas veces. Un resultado fue que desde la mañana hasta la noche, miraba una pantalla casi sin parar. Doloroso, pero alegre.

Por supuesto, hubo cosas que hice bien.

Por ejemplo, añadí un servidor MCP a VMark antes de que sus funciones principales estuvieran siquiera sólidas. Esto permitió que la IA enviara contenido directamente al editor. Simplemente podía pedirle a Claude Code en el terminal:

> "Proporciona contenido Markdown para probar esta función, con cobertura integral de casos límite."

Cada vez, el contenido de prueba generado me sorprendía — y ahorraba enormes cantidades de tiempo y energía.

Al principio, no tenía idea de qué era realmente MCP. Solo llegué a entenderlo profundamente después de clonar un servidor MCP y modificarlo para convertirlo en algo completamente no relacionado con VMark — lo que llevó a otro proyecto llamado **CCCMemory**. Vibe learning, de hecho.

En el uso real, tener MCP en un editor de Markdown es increíblemente útil — especialmente para dibujar diagramas Mermaid. Nadie los entiende mejor que la IA. Lo mismo ocurre con las expresiones regulares. Ahora rutinariamente le pido a la IA que envíe su resultado — informes de análisis, informes de auditoría — directamente a VMark. Es mucho más cómodo que leerlos en un terminal o en VSCode.

Para el 2 de febrero de 2026 — exactamente un año después del nacimiento del concepto de vibe coding — sentí que VMark se había convertido en una herramienta que podía usar cómodamente de verdad. Todavía tenía muchos errores, pero ya había empezado a escribir con él diariamente, corrigiendo errores en el camino.

Incluso añadí un panel de línea de comandos y AI Genies (honestamente, todavía no muy usable, debido a peculiaridades de diferentes proveedores de IA). Aún así, estaba claramente en un camino donde seguía mejorando para mí — y donde ya no podía usar otros editores de Markdown.

## Git Es Obligatorio

Seis semanas después, sentí que había algunos detalles que valía la pena compartir con otros "no ingenieros" como yo.

Primero, aunque no soy un ingeniero real, afortunadamente entiendo las operaciones básicas de **git**. He usado git durante muchos años, aunque parece una herramienta que solo usan los ingenieros. Mirando hacia atrás, creo que registré mi cuenta de GitHub hace unos 15 años.

Raramente uso funciones avanzadas de git. Por ejemplo, no uso git worktree como recomienda Claude Code. En cambio, uso dos máquinas separadas. Solo uso comandos básicos, todos emitidos mediante instrucciones en lenguaje natural a Claude Code.

Todo sucede en ramas. Me divierto libremente, luego digo:

> "Resume las lecciones aprendidas hasta ahora, reinicia la rama actual y empecemos de nuevo."

Sin git, simplemente no puedes hacer ningún proyecto no trivial. Esto es especialmente importante para los no programadores: *aprender conceptos básicos de git es obligatorio*. Naturalmente aprenderás más solo observando trabajar a Claude Code.

Segundo, debes entender el flujo de trabajo **TDD**. Haz todo lo posible para mejorar la cobertura de pruebas. Entiende el concepto de *pruebas como límites*. Los errores son inevitables — como los gorgojos del arroz en un granero. Sin suficiente cobertura de pruebas, no tienes ninguna posibilidad de encontrarlos.

## Vibe Thinking, No Vibe Coding

Aquí está el principio filosófico central: **no estás haciendo vibe coding; estás haciendo vibe thinking**. Los productos y servicios son siempre el resultado del *pensamiento*, no el resultado inevitable del *trabajo*.

La IA ha asumido gran parte del "*hacer*", pero solo puede asistir en el pensamiento fundamental de *qué*, *por qué* y *cómo*. El peligro es que siempre seguirá tu dirección. Si dependes de ella para pensar, silenciosamente te atrapará dentro de tus propios sesgos cognitivos[^2] — mientras te hace sentir más libre que nunca. Como dice la letra de la canción:

> *"We are all just prisoners here, of our own device."*

Lo que frecuentemente le digo a la IA es:

> "Trátame como un rival que no te cae particularmente bien. Evalúa mis ideas de forma crítica y desafíalas directamente, pero mantén un tono profesional y sin hostilidad."

> Los resultados son consistentemente de alta calidad e inesperados.

Otra técnica es dejar que las IA de diferentes proveedores debatan entre sí.[^3] Instalé el servicio MCP de Codex CLI para Claude Code. A menudo le digo a Claude Code:

> "Resume los problemas que no pudiste resolver ahora mismo y pídele ayuda a Codex."

O envío el plan de Claude Code a Codex CLI:

> "Este es el plan elaborado por Claude Code. Quiero tu retroalimentación más profesional, directa y sin reservas."

Luego le devuelvo la respuesta de Codex a Claude Code.

Cuando descubrí el comando `/audit` de Claude Code (alrededor de principios de octubre), inmediatamente escribí `/codex-audit` — un clon que usa MCP para llamar a Codex CLI. Usar IA para presionar y auditar a la IA funciona mucho mejor que hacerlo yo mismo.

Este enfoque es esencialmente una variante de la *recursión* — el mismo principio detrás de buscar en Google "cómo usar Google eficazmente". Por eso no paso mucho tiempo en ingeniería de prompts compleja. Si entiendes la recursión, los mejores resultados son inevitables.

## Solo Terminal

También hay un factor de personalidad. Los ingenieros deben disfrutar genuinamente de **tratar con los detalles**. De lo contrario, el trabajo se vuelve miserable. Cada detalle contiene innumerables sub-detalles.

Por ejemplo: comillas tipográficas versus comillas rectas; cuán notables son las comillas tipográficas depende de las fuentes latinas más que de las fuentes CJK (algo que nunca supe antes de VMark); si las comillas se emparejan automáticamente, las comillas dobles de cierre también deben emparejarse automáticamente (un detalle que noté mientras escribía este mismo artículo); mientras tanto, las comillas simples de cierre *no* deben emparejarse automáticamente. Si manejar estos detalles no te hace feliz, el desarrollo de productos inevitablemente se volverá aburrido, frustrante e incluso irritante.

Finalmente, hay otra elección muy opinativa que vale la pena mencionar. Porque no soy ingeniero, elegí lo que creo que es el camino más correcto por necesidad:

**No uso ningún IDE** — **solo el terminal.**

Al principio, usé el Terminal predeterminado de macOS. Más tarde, cambié a iTerm para pestañas y paneles divididos.

¿Por qué abandonar los IDE como VSCode? Inicialmente, porque no podía entender el código complejo — y Claude Code a menudo hacía colapsar VSCode. Más tarde, me di cuenta de que no necesitaba entenderlo. El código escrito por IA es enormemente mejor que lo que yo — o incluso los programadores que podría contratar (los científicos de OpenAI no son personas que puedas contratar) — podría escribir. Si no leo el código, tampoco hay necesidad de leer los diffs.

Con el tiempo, dejé de escribir documentación yo mismo (la orientación sigue siendo necesaria). Todo el sitio web de [vmark.app](https://vmark.app) fue escrito por IA; yo no toqué un solo carácter — excepto las reflexiones sobre el vibe coding en sí.

Es similar a cómo invierto: *puedo* leer estados financieros, pero nunca lo hago — las buenas empresas son obvias sin ellos. Lo que importa es la dirección, no los detalles.

Por eso el sitio web de VMark incluye este crédito:

<img src="./images/vmark-credits.png" alt="VMark credits — Producer and Coders" style="max-width: 480px;" />

Otra consecuencia de ser muy opinativo: incluso si VMark es de código abierto, las contribuciones de la comunidad son poco probables. Está construido puramente para mi propio flujo de trabajo; muchas funciones tienen poco valor para otros. Más importante aún, un editor de Markdown no es tecnología de vanguardia. Es una de las innumerables implementaciones de una herramienta familiar. La IA puede resolver prácticamente cualquier problema relacionado con él.

Claude Code incluso puede leer issues de GitHub, corregir errores y responder automáticamente en el idioma del reportero. La primera vez que lo vi manejar un issue de extremo a extremo, me quedé completamente asombrado.

## La Prueba de Fuego

Construir VMark también me hizo pensar en las implicaciones más amplias de la IA para el aprendizaje. Toda educación debería estar orientada a la producción[^4] — el futuro pertenece a los creadores, pensadores y tomadores de decisiones, mientras que la ejecución pertenece a las máquinas. La prueba de fuego más importante para cualquiera que use IA:

> Después de que empezaste a usar IA, ¿estás pensando **más**, o **menos**?

Si estás pensando más — y pensando más profundamente — entonces la IA te está ayudando de la manera correcta. Si estás pensando menos, entonces la IA está produciendo efectos secundarios.[^5]

Además, la IA nunca es una herramienta para "trabajar menos". La lógica es simple: porque puede hacer más cosas, puedes pensar más y profundizar más. Como resultado, las cosas que *puedes* hacer — y *necesitas* hacer — solo **aumentarán**, no disminuirán.[^6]

Mientras escribía este artículo, casualmente descubrí varios problemas pequeños. Como resultado, el número de versión de VMark pasó de **0.4.12** a **0.4.13**.

Y dado que he empezado a vivir principalmente en la línea de comandos, ya no siento ninguna necesidad de un monitor grande o múltiples pantallas. Un portátil de 13 pulgadas es completamente suficiente. Incluso un pequeño balcón puede convertirse en un espacio de trabajo "suficiente".

[^1]: Un ensayo controlado aleatorizado de METR encontró que los desarrolladores experimentados de código abierto (con una media de 5 años en sus proyectos asignados) eran en realidad un **19% más lentos** al usar herramientas de IA, a pesar de predecir una aceleración del 24%. El estudio destaca una brecha entre las ganancias de productividad percibidas y reales — la IA ayuda más cuando amplifica habilidades existentes, no cuando sustituye las que faltan. Ver: Rao, A., Brokman, J., Wentworth, A., et al. (2025). [Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://arxiv.org/abs/2507.09089). *METR Technical Report*.

[^2]: Los LLMs entrenados con retroalimentación humana sistemáticamente están de acuerdo con las creencias existentes de los usuarios en lugar de proporcionar respuestas verídicas — un comportamiento que los investigadores llaman *servilismo*. En cinco asistentes de IA de vanguardia y cuatro tareas de generación de texto, los modelos consistentemente adaptaban las respuestas para coincidir con las opiniones del usuario, incluso cuando esas opiniones eran incorrectas. Cuando un usuario simplemente sugería una respuesta incorrecta, la precisión del modelo disminuía significativamente. Esta es exactamente la "trampa del sesgo cognitivo" descrita anteriormente: la IA sigue tu dirección en lugar de desafiarte. Ver: Sharma, M., Tong, M., Korbak, T., et al. (2024). [Towards Understanding Sycophancy in Language Models](https://arxiv.org/abs/2310.13548). *ICLR 2024*.

[^3]: Esta técnica refleja un enfoque de investigación llamado *debate multiagente*, donde múltiples instancias de LLM proponen y desafían las respuestas de las otras a lo largo de varias rondas. Incluso cuando todos los modelos producen inicialmente respuestas incorrectas, el proceso de debate mejora significativamente la exactitud y el razonamiento. Usar modelos de diferentes proveedores (con diferentes datos de entrenamiento y arquitecturas) amplifica este efecto — sus puntos ciegos raramente se superponen. Ver: Du, Y., Li, S., Torralba, A., Tenenbaum, J.B., & Mordatch, I. (2024). [Improving Factuality and Reasoning in Language Models through Multiagent Debate](https://arxiv.org/abs/2305.14325). *ICML 2024*.

[^4]: Esto se alinea con la teoría del *construccionismo* de Seymour Papert — la idea de que el aprendizaje es más efectivo cuando los estudiantes construyen activamente artefactos significativos en lugar de absorber información pasivamente. Papert, alumno de Piaget, argumentó que construir productos tangibles (software, herramientas, obras creativas) involucra procesos cognitivos más profundos que la instrucción tradicional. John Dewey hizo un argumento similar un siglo antes: la educación debería ser experiencial y conectada con la resolución de problemas del mundo real en lugar de la memorización. Ver: Papert, S. & Harel, I. (1991). [Constructionism](https://web.media.mit.edu/~calla/web_comunidad/Reading-En/situating_constructionism.pdf). *Ablex Publishing*; Dewey, J. (1938). *Experience and Education*. Kappa Delta Pi.

[^5]: Un estudio de 2025 con 666 participantes encontró una fuerte correlación negativa entre el uso frecuente de herramientas de IA y las capacidades de pensamiento crítico (r = −0.75), mediada por la *descarga cognitiva* — la tendencia a delegar el pensamiento en herramientas externas. Cuanto más dependían los participantes de la IA, menos ejercitaban sus propias facultades analíticas. Los participantes más jóvenes mostraron mayor dependencia de la IA y puntuaciones más bajas de pensamiento crítico. Ver: Gerlich, M. (2025). [AI Tools in Society: Impacts on Cognitive Offloading and the Future of Critical Thinking](https://www.mdpi.com/2075-4698/15/1/6). *Societies*, 15(1), 6.

[^6]: Esta es una instancia moderna de la *paradoja de Jevons* — la observación de 1865 de que las máquinas de vapor más eficientes no redujeron el consumo de carbón sino que lo aumentaron, porque los menores costes estimularon una mayor demanda. Aplicado a la IA: a medida que la codificación y la escritura se vuelven más baratas y rápidas, el volumen total de trabajo se expande en lugar de contraerse. Los datos recientes lo respaldan — la demanda de ingenieros de software con fluidez en IA aumentó casi un 60% interanual en 2025, con primas de compensación del 15–25% para los desarrolladores competentes en herramientas de IA. Las ganancias de eficiencia crean nuevas posibilidades, que crean nuevo trabajo. Ver: Jevons, W.S. (1865). *The Coal Question*; [The Productivity Paradox of AI](https://www.hackerrank.com/blog/the-productivity-paradox-of-ai/), HackerRank Blog (2025).
