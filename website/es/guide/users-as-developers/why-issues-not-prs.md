# Por Qué Aceptamos Issues, No Pull Requests

VMark no acepta pull requests. Damos la bienvenida a los issues — cuanto más detallados, mejor. Esta página explica por qué.

## La Versión Corta

VMark está creado con vibe coding. Todo el código base está escrito por IA bajo la supervisión de un único mantenedor. Cuando alguien envía un pull request, hay un problema fundamental: **un ser humano no puede revisar de forma significativa el código generado por IA de otro ser humano**. El revisor no entiende el código del colaborador porque ninguno de ellos lo escribió en el sentido tradicional — sus IA lo hicieron.

Los issues no tienen este problema. Un issue bien redactado describe *qué* debería suceder. La IA del mantenedor entonces corrige el código base con pleno conocimiento de las convenciones, el conjunto de pruebas y la arquitectura del proyecto. El resultado es coherente, probado y mantenible.

## Qué Significa Realmente "Vibe Coding"

El término "vibe coding" fue acuñado por Andrej Karpathy a principios de 2025 para describir un estilo de programación donde describes lo que quieres en lenguaje natural y dejas que una IA escriba el código. Tú guías la dirección, pero no estás escribiendo — ni a menudo leyendo — cada línea.[^1]

VMark va más allá que la mayoría de los proyectos. El repositorio incluye:

- **`AGENTS.md`** — Reglas del proyecto que cada herramienta de IA lee al inicio
- **`.claude/rules/`** — Más de 15 archivos de reglas que cubren TDD, tokens de diseño, patrones de componentes, accesibilidad y más
- **Slash commands** — Flujos de trabajo predefinidos para auditar, corregir y verificar código
- **Verificación cruzada de modelos** — Claude escribe, Codex audita (ver [Verificación Cruzada de Modelos](/es/guide/users-as-developers/cross-model-verification))

La IA no genera código aleatorio. Opera dentro de una densa red de restricciones — convenciones, pruebas y verificaciones automatizadas — que mantienen el código base coherente. Pero esto solo funciona cuando **una sesión de IA tiene pleno contexto** de esas restricciones.

## La Brecha de Comprensión

Aquí está el problema central con los pull requests generados por IA: nadie los lee completamente.

La investigación de la conferencia Foundations of Software Engineering de la ACM encontró que los desarrolladores — especialmente los que no escribieron el código ellos mismos — tienen dificultades para entender el código generado por LLM. El estudio, titulado *"I Would Have Written My Code Differently": Beginners Struggle to Understand LLM-Generated Code*, documentó cómo incluso los desarrolladores técnicamente capaces tienen dificultades para razonar sobre código que no escribieron ellos cuando fue una IA quien lo escribió.[^2]

Este no es solo un problema de principiantes. Un análisis de 2025 de más de 500.000 pull requests por CodeRabbit encontró que los PRs generados por IA contienen **1,7 veces más problemas** que los PRs escritos por humanos — incluyendo un 75% más de errores lógicos y de corrección. La mayor preocupación: estos son precisamente los errores que parecen razonables durante la revisión a menos que recorras el código paso a paso.[^3]

La matemática empeora cuando ambos lados usan IA:

| Escenario | ¿Entiende el revisor el código? |
|----------|---------------------------|
| Humano escribe, humano revisa | Sí — el revisor puede razonar sobre la intención |
| IA escribe, el autor original revisa | Parcialmente — el autor guió la IA y tiene contexto |
| IA escribe, diferente humano revisa | Mal — el revisor no tiene ni el contexto de autoría ni el de la sesión de IA |
| IA escribe para la persona A, IA revisa para la persona B | Ningún humano entiende el código en profundidad |

VMark está en la última fila. Cuando un colaborador abre un PR generado por su IA, y la IA del mantenedor lo revisa, los dos humanos en el proceso tienen la menor comprensión de cualquier escenario. Esta no es una receta para software de calidad.

## Por Qué los PRs Generados por IA Son Diferentes de los PRs Humanos

La revisión de código tradicional funciona gracias a una base compartida: tanto el autor como el revisor entienden el lenguaje de programación, los patrones y las expresiones idiomáticas. El revisor puede simular mentalmente la ejecución del código y detectar inconsistencias.

Con el código generado por IA, esa base compartida se erosiona. La investigación muestra varios modos de fallo específicos:

**Deriva de convenciones.** La IA tiene una "tendencia abrumadora a no entender cuáles son las convenciones existentes dentro de un repositorio", generando su propia versión ligeramente diferente de cómo resolver un problema.[^4] La IA de cada colaborador produce código que funciona de forma aislada pero choca con los patrones del proyecto. En VMark, donde aplicamos patrones específicos de stores Zustand, uso de tokens CSS y estructuras de plugins, la deriva de convenciones sería devastadora.

**Aislamiento de contexto.** Las funciones creadas con vibe coding a menudo son "generadas de forma aislada, donde la IA crea implementaciones razonables para cada prompt pero no tiene memoria de las decisiones arquitectónicas de sesiones anteriores".[^5] La IA de un colaborador no sabe nada de los 15 archivos de reglas de VMark, su canalización de auditoría cruzada de modelos, ni sus convenciones específicas de plugins ProseMirror — a menos que el colaborador haya configurado cuidadosamente todo eso.

**Cuello de botella de revisión.** Los desarrolladores que usan IA completan un 21% más de tareas y fusionan un 98% más de pull requests, pero el tiempo de revisión de PR aumenta un 91%.[^6] La velocidad de generación de código con IA crea un aluvión de código que desborda la capacidad de revisión humana. Para un mantenedor en solitario, esto es inviable.

## El Precedente de SQLite

VMark no es el primer proyecto en restringir las contribuciones. SQLite — una de las bibliotecas de software más ampliamente desplegadas en el mundo — ha sido "de código abierto, no de contribución abierta" durante toda su historia. El proyecto no acepta parches de personas aleatorias de internet. Los colaboradores pueden sugerir cambios e incluir código de prueba de concepto, pero los desarrolladores principales típicamente reescriben los parches desde cero.[^7]

El razonamiento de SQLite es diferente (necesitan mantener el estado de dominio público), pero el resultado es el mismo: **la calidad se mantiene teniendo un único equipo con pleno contexto** que escribe todo el código. Las contribuciones externas se canalizan a través de informes de errores y sugerencias de funciones en lugar de cambios de código directo.

Otros proyectos notables han adoptado posturas similares. El modelo del Dictador Benevolente Vitalicio (BDFL) — usado históricamente por Python (Guido van Rossum), Linux (Linus Torvalds) y muchos otros — concentra la autoridad final en una persona que garantiza la coherencia arquitectónica.[^8] VMark simplemente hace esto explícito: el "dictador" es la IA, supervisada por el mantenedor.

## Por Qué los Issues Funcionan Mejor

Un issue es una **especificación**, no una implementación. Describe qué está mal o qué se necesita, sin comprometerse con una solución particular. Esta es una mejor interfaz entre los colaboradores y un código base mantenido por IA:

| Tipo de contribución | Qué proporciona | Riesgo |
|-------------------|------------------|------|
| Pull request | Código que debes entender, revisar, probar y mantener | Deriva de convenciones, pérdida de contexto, carga de revisión |
| Issue | Una descripción del comportamiento deseado | Ninguno — el mantenedor decide si y cómo actuar |

### Qué Hace un Gran Issue

Los mejores issues se leen como documentos de requisitos:

1. **Comportamiento actual** — Qué sucede ahora (con pasos para reproducir en el caso de errores)
2. **Comportamiento esperado** — Qué debería suceder en su lugar
3. **Contexto** — Por qué importa esto, qué estabas intentando hacer
4. **Entorno** — Sistema operativo, versión de VMark, configuración relevante
5. **Capturas de pantalla o grabaciones** — Cuando se involucra comportamiento visual

Puedes usar IA para escribir issues. De hecho, lo fomentamos. Un asistente de IA puede ayudarte a estructurar un issue detallado y bien organizado en minutos. La ironía es intencional: **la IA es excelente para describir problemas claramente, y la IA es excelente para solucionar problemas descritos claramente.** El cuello de botella es el medio difuso — entender la solución generada por IA de otro — que los issues evitan hábilmente.

### Qué Sucede Después de que Presentas un Issue

1. El mantenedor lee y clasifica el issue
2. La IA recibe el issue como contexto, junto con pleno conocimiento del código base
3. La IA escribe una corrección siguiendo TDD (prueba primero, luego implementación)
4. Un segundo modelo de IA (Codex) audita la corrección de forma independiente
5. Se ejecutan compuertas automatizadas (`pnpm check:all` — lint, pruebas, cobertura, compilación)
6. El mantenedor revisa el cambio en contexto y lo fusiona

Esta canalización produce código que es:
- **Conforme a las convenciones** — La IA lee los archivos de reglas en cada sesión
- **Probado** — TDD es obligatorio; los umbrales de cobertura se aplican
- **Verificado de forma cruzada** — Un segundo modelo audita en busca de errores lógicos, seguridad y código muerto
- **Arquitectónicamente coherente** — Una sesión de IA con pleno contexto, no fragmentos de muchas

## El Panorama General

La era de la IA está forzando una reconsideración de cómo funciona la contribución de código abierto. El modelo tradicional — hacer fork, crear rama, codificar, PR, revisión, fusión — asumía que los humanos escriben código y otros humanos pueden leerlo. Cuando la IA genera el código, ambas suposiciones se debilitan.

Una encuesta de 2025 de desarrolladores profesionales encontró que "no hacen vibe coding; en cambio, controlan cuidadosamente a los agentes a través de la planificación y la supervisión".[^9] El énfasis está en el **control y el contexto** — exactamente lo que se pierde cuando llega un PR de la sesión de IA no relacionada de un colaborador externo.

Creemos que el futuro del código abierto en la era de la IA tiene un aspecto diferente:

- **Los issues se convierten en la contribución principal** — Describir problemas es una habilidad universal
- **Los mantenedores controlan la IA** — Un equipo con pleno contexto produce código coherente
- **La verificación cruzada de modelos reemplaza la revisión humana** — La auditoría adversarial de IA detecta lo que los humanos pasan por alto
- **Las pruebas reemplazan la confianza** — Las compuertas automatizadas, no el juicio del revisor, determinan si el código es correcto

VMark está experimentando con este modelo de forma abierta. Puede que no sea el enfoque correcto para cada proyecto. Pero para un código base creado con vibe coding y mantenido por una persona con herramientas de IA, es el enfoque que produce el mejor software.

## Cómo Contribuir

**Presenta un issue.** Eso es todo. Cuanto más detalle proporciones, mejor será la corrección.

- **[Informe de Error](https://github.com/xiaolai/vmark/issues/new?template=bug_report.yml)**
- **[Solicitud de Función](https://github.com/xiaolai/vmark/issues/new?template=feature_request.yml)**

Tu issue se convierte en la especificación de la IA. Un issue claro conduce a una corrección correcta. Un issue vago conduce a ida y vuelta. Invierte en la descripción — determina directamente la calidad del resultado.

---

[^1]: Karpathy, A. (2025). [Vibe coding](https://en.wikipedia.org/wiki/Vibe_coding). Descrito originalmente en una publicación de redes sociales, el término entró rápidamente en el vocabulario principal de los desarrolladores. Wikipedia señala que el vibe coding "se basa en herramientas de IA para generar código a partir de prompts en lenguaje natural, reduciendo o eliminando la necesidad de que el desarrollador escriba código manualmente."

[^2]: Jury, J. et al. (2025). ["I Would Have Written My Code Differently": Beginners Struggle to Understand LLM-Generated Code](https://dl.acm.org/doi/pdf/10.1145/3696630.3731663). *FSE Companion '25*, 33.ª Conferencia Internacional de la ACM sobre los Fundamentos de la Ingeniería de Software. El estudio encontró que los desarrolladores que no crearon el prompt de IA tenían dificultades significativas para entender y razonar sobre el código generado.

[^3]: CodeRabbit. (2025). [AI-Assisted Pull Requests Report](https://www.helpnetsecurity.com/2025/12/23/coderabbit-ai-assisted-pull-requests-report/). Análisis de más de 500.000 pull requests que encontró que los PRs generados por IA contienen 10,83 problemas cada uno frente a 6,45 en los PRs humanos (1,7 veces más), con un 75% más de errores lógicos y de corrección y 1,4 veces más problemas críticos.

[^4]: Osmani, A. (2025). [Code Review in the Age of AI](https://addyo.substack.com/p/code-review-in-the-age-of-ai). Análisis de cómo el código generado por IA interactúa con los codebases existentes, señalando la tendencia de la IA a crear patrones inconsistentes que se desvían de las convenciones establecidas del proyecto.

[^5]: Weavy. (2025). [You Can't Vibe Code Your Way Out of a Vibe Coding Mess](https://www.weavy.com/blog/you-cant-vibe-code-your-way-out-of-a-vibe-coding-mess). Documenta cómo las funciones creadas con vibe coding generadas en sesiones aisladas de IA crean conflictos arquitectónicos cuando se combinan, porque cada sesión carece de conocimiento de las decisiones tomadas en otras sesiones.

[^6]: SoftwareSeni. (2025). [Why AI Coding Speed Gains Disappear in Code Reviews](https://www.softwareseni.com/why-ai-coding-speed-gains-disappear-in-code-reviews/). Reporta que mientras los desarrolladores asistidos por IA completan un 21% más de tareas y fusionan un 98% más de PRs, el tiempo de revisión de PR aumenta un 91% — revelando que la IA desplaza el cuello de botella de la escritura a la revisión.

[^7]: SQLite. [SQLite Copyright](https://sqlite.org/copyright.html). SQLite ha sido "de código abierto, no de contribución abierta" desde su inicio. El proyecto no acepta parches de colaboradores externos para mantener el estado de dominio público y la calidad del código. Los colaboradores pueden sugerir cambios, pero el equipo central reescribe las implementaciones desde cero.

[^8]: Wikipedia. [Benevolent Dictator for Life](https://en.wikipedia.org/wiki/Benevolent_dictator_for_life). El modelo de gobernanza BDFL, utilizado por Python, Linux y muchos otros proyectos, concentra la autoridad arquitectónica en una persona para mantener la coherencia. Los BDFLs notables incluyen a Guido van Rossum (Python), Linus Torvalds (Linux) y Larry Wall (Perl).

[^9]: Dang, H.T. et al. (2025). [Professional Software Developers Don't Vibe, They Control: AI Agent Use for Coding in 2025](https://arxiv.org/html/2512.14012). Encuesta de desarrolladores profesionales que encontró que mantienen un control estricto sobre los agentes de IA a través de la planificación y la supervisión, en lugar de adoptar el enfoque manos libres del "vibe coding".
