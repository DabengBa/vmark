# Por Qué los Modelos Caros Son Más Baratos

::: info TL;DR
El modelo de IA más capaz es un **60% más barato por tarea** a pesar de costar un 67% más por token — porque usa menos tokens, necesita menos iteraciones y produce un 50–75% menos de errores. Para los vibe coders que no pueden leer código, la calidad del modelo no es una cuestión de eficiencia — es la única red de seguridad en toda la cadena.
:::

::: details Última verificación: febrero de 2026
Las puntuaciones de benchmarks, los nombres de modelos y los precios de este artículo reflejan el estado del campo a partir de febrero de 2026. El argumento central — que el coste por tarea importa más que el precio por token — es duradero incluso cuando los números específicos cambian.
:::

El modelo de codificación con IA más caro es casi siempre la opción más barata — cuando mides lo que realmente importa. El precio por token es una distracción. Lo que determina tu coste real es **cuántos tokens se necesitan para hacer el trabajo**, cuántas iteraciones consumes y cuánto tiempo dedicas a revisar y corregir la salida.

## La Ilusión del Precio

Aquí están los precios de API para los modelos Claude:

| Modelo | Entrada (por 1M tokens) | Salida (por 1M tokens) |
|-------|----------------------|------------------------|
| Claude Opus 4.5 | $5 | $25 |
| Claude Sonnet 4.5 | $3 | $15 |

Opus parece un 67% más caro. La mayoría de la gente se detiene aquí y elige Sonnet. Esa es la matemática incorrecta.

### Lo que Realmente Sucede

Los benchmarks de Anthropic cuentan una historia diferente. Con esfuerzo medio, Opus 4.5 **iguala** la mejor puntuación SWE-bench de Sonnet 4.5 usando un **76% menos de tokens de salida**. Con el mayor esfuerzo, Opus **supera** a Sonnet en 4,3 puntos porcentuales usando un **48% menos de tokens**.[^1]

Hagamos la matemática real:

| | Sonnet 4.5 | Opus 4.5 |
|--|-----------|----------|
| Tokens de salida por tarea | ~500 | ~120 |
| Precio por 1M tokens de salida | $15 | $25 |
| **Coste por tarea** | **$0.0075** | **$0.0030** |

Opus es un **60% más barato por tarea** — a pesar de costar un 67% más por token.[^2]

Este no es un ejemplo seleccionado a propósito. En tareas de codificación de largo alcance, Opus logra mayores tasas de éxito usando **hasta un 65% menos de tokens** y haciendo **un 50% menos de llamadas a herramientas**.[^1]

## El Impuesto de las Iteraciones

El coste de tokens es solo una parte de la historia. El mayor coste son las **iteraciones** — cuántas rondas de generar-revisar-corregir se necesitan para obtener código correcto.

Opus 4.5 alcanza el rendimiento máximo en **4 iteraciones**. Los modelos competidores requieren **hasta 10 intentos** para lograr una calidad similar.[^1] Cada iteración fallida te cuesta:

- **Tokens** — el modelo lee el contexto y genera de nuevo
- **Tiempo** — revisas la salida, encuentras el problema, vuelves a escribir el prompt
- **Atención** — cambio de contexto entre "¿es esto correcto?" y "¿qué está mal?"

A una tasa de desarrollador de $75/hora, cada iteración fallida que tarda 15 minutos en revisar y corregir cuesta **$18,75** en tiempo humano. Seis iteraciones adicionales (la diferencia entre 4 y 10) cuestan **$112,50** en tiempo de desarrollador — por tarea compleja. ¿La diferencia en el coste de tokens? Alrededor de medio centavo.[^3]

**Los ahorros en tiempo de desarrollador son 22.500 veces la diferencia en el coste de tokens.**

## El Multiplicador de Errores

Los modelos más baratos no solo requieren más iteraciones — también producen más errores que llegan a producción.

Opus 4.5 muestra una **reducción del 50–75%** tanto en errores de llamadas a herramientas como en errores de compilación/lint en comparación con otros modelos.[^1] Esto importa porque los errores que escapan de la sesión de codificación se vuelven exponencialmente más costosos posteriormente:

- Un error detectado durante la codificación tarda minutos en corregirse
- Un error detectado en la revisión de código tarda una hora (la tuya + la del revisor)
- Un error detectado en producción tarda días (depuración, corrección urgente, comunicación, post-mortem)

El estudio de Faros AI — que abarca 1.255 equipos y más de 10.000 desarrolladores — encontró que la alta adopción de IA se correlacionaba con un **aumento del 9% en errores por desarrollador** y un **aumento del 91% en el tiempo de revisión de PR**.[^4] Cuando la IA genera más código con menor precisión, el cuello de botella de revisión absorbe por completo las ganancias de "productividad".

Un modelo que lo hace bien en el primer intento evita esta cascada.

## La Evidencia de SWE-bench

SWE-bench Verified es el estándar de la industria para evaluar la capacidad de codificación con IA en tareas de ingeniería de software del mundo real. La clasificación de febrero de 2026:[^5]

| Modelo | SWE-bench Verified |
|-------|-------------------|
| Claude Opus 4.5 | **80,9%** |
| Claude Opus 4.6 | 80,8% |
| GPT-5.2 | 80,0% |
| Gemini 3 Flash | 78,0% |
| Claude Sonnet 4.5 | 77,2% |
| Gemini 3 Pro | 76,2% |

Una diferencia de 3,7 puntos entre Opus 4.5 y Sonnet 4.5 significa que Opus resuelve **aproximadamente 1 de cada 27 tareas adicionales** que Sonnet no puede resolver. Cuando cada uno de esos fallos desencadena una sesión de depuración manual, el coste se acumula rápidamente.

Pero aquí está lo más importante — cuando los investigadores midieron el **coste por tarea resuelta** en lugar del coste por token, Opus era más barato que Sonnet:

| Modelo | Coste por Tarea | Puntuación SWE-bench |
|-------|--------------|-----------------|
| Claude Opus 4.5 | ~$0,44 | 80,9% |
| Claude Sonnet 4.5 | ~$0,50 | 77,2% |

Sonnet cuesta **más por tarea** mientras resuelve **menos tareas**.[^6]

## Codex CLI: El Mismo Patrón, Diferente Proveedor

Codex CLI de OpenAI muestra la misma dinámica con los niveles de esfuerzo de razonamiento:

- **Razonamiento medio**: Equilibrio entre velocidad e inteligencia — el predeterminado
- **Razonamiento extra alto (xhigh)**: Piensa más tiempo, produce mejores respuestas — recomendado para tareas difíciles

GPT-5.1-Codex-Max con esfuerzo medio supera al GPT-5.1-Codex estándar con el mismo esfuerzo usando un **30% menos de tokens de pensamiento**.[^7] El modelo premium es más eficiente en tokens porque razona mejor — no necesita generar tantos pasos intermedios para llegar a la respuesta correcta.

El patrón es universal en todos los proveedores: **los modelos más inteligentes desperdician menos cómputo.**

## La Advertencia de METR

El ensayo controlado aleatorizado de METR proporciona una advertencia crucial. Dieciséis desarrolladores experimentados ($150/hora) recibieron 246 tareas con herramientas de IA. El resultado: los desarrolladores fueron un **19% más lentos** con asistencia de IA. Aún más llamativo — los desarrolladores *creían* que eran un 20% más rápidos, una brecha de percepción de casi 39 puntos porcentuales.[^8]

El estudio usó **modelos de clase Sonnet** (Claude 3.5/3.7 Sonnet vía Cursor Pro), no Opus. Menos del 44% del código generado por IA fue aceptado.

Esto sugiere que el umbral de calidad importa enormemente. Un modelo que produce código que aceptas el 44% de las veces te hace más lento — pasas más tiempo revisando y rechazando que el tiempo que ahorras. Un modelo con un 50–75% menos de errores y una precisión dramáticamente mayor en el primer intento podría cambiar completamente esta ecuación.

**El estudio METR no muestra que las herramientas de codificación con IA sean lentas. Muestra que las herramientas de codificación con IA mediocres son lentas.**

## Deuda Técnica: El 75% que No Estás Contando

El coste inicial de escribir código es solo el **15–25% del coste total del software** a lo largo de su ciclo de vida. El **75–85%** restante va al mantenimiento, las operaciones y las correcciones de errores.[^9]

El análisis de GitClear del código producido durante 2020–2024 encontró un **aumento de 8x en bloques de código duplicados** y un **aumento de 2x en la rotación de código** correlacionados con la adopción de herramientas de IA. SonarSource encontró un **aumento del 93% en errores de nivel BLOQUEADOR** al comparar la salida de Claude Sonnet 4 con su predecesor.[^10]

Si un modelo más barato genera código con casi el doble de tasa de errores graves, y el mantenimiento consume del 75 al 85% del coste del ciclo de vida, los "ahorros" en la generación de código son eclipsados por los costes posteriores. El código más barato de mantener es el código que fue correcto desde la primera vez.

## Matemática de Suscripciones

Para los usuarios intensivos, la elección entre suscripción y API amplifica aún más el argumento sobre la calidad del modelo.

| Plan | Coste Mensual | Qué Obtienes |
|------|-------------|--------------|
| Claude Max ($100) | $100 | Uso alto de Opus |
| Claude Max ($200) | $200 | Opus ilimitado |
| Uso equivalente de API | $3.650+ | Los mismos tokens de Opus |

La suscripción es aproximadamente **18 veces más barata** que la facturación por API para el mismo trabajo.[^11] Al precio de suscripción, no hay coste marginal por usar el mejor modelo — el modelo "caro" literalmente se vuelve gratuito por consulta adicional.

Coste promedio de Claude Code en suscripción: **$6 por desarrollador por día**, con el 90% de los usuarios por debajo de $12/día.[^12] A un salario de desarrollador de $75/hora, **5 minutos de tiempo ahorrado por día** pagan la suscripción. Todo lo que supera eso es puro beneficio.

## El Argumento Compuesto

Aquí está por qué la matemática se vuelve aún más desigual con el tiempo:

### 1. Menos iteraciones = menos contaminación del contexto

Cada intento fallido se añade al historial de conversación. Las conversaciones largas degradan el rendimiento del modelo — la relación señal-ruido disminuye. Un modelo que tiene éxito en 4 iteraciones tiene un contexto más limpio que uno que flaquea durante 10, lo que significa que sus respuestas posteriores también son mejores.

### 2. Menos errores = menos fatiga de revisión

Los estudios de productividad de GitHub Copilot encontraron que los beneficios aumentan con la dificultad de la tarea.[^13] Las tareas difíciles son donde los modelos baratos fallan más — y donde los modelos caros brillan. El estudio de caso de ZoomInfo mostró un **aumento de productividad del 40–50%** con IA, con la diferencia creciendo a medida que aumentaba la complejidad.

### 3. Mejor código = mejor aprendizaje

Si eres un desarrollador que está desarrollando tus habilidades (y todo desarrollador debería serlo), el código que lees moldea tus instintos. Leer salida de IA consistentemente correcta y bien estructurada enseña buenos patrones. Leer salida llena de errores y verbosa enseña malos hábitos.

### 4. El código correcto se lanza más rápido

Cada iteración que no necesitas es una función que se lanza antes. En mercados competitivos, la velocidad de desarrollo — medida en funciones entregadas, no en tokens generados — es lo que importa.

## Para los Vibe Coders, Esto No Se Trata del Coste — Se Trata de Supervivencia

Todo lo anterior se aplica a los desarrolladores profesionales que pueden leer diffs, detectar errores y corregir código roto. Pero hay un grupo en rápido crecimiento para el que el argumento sobre la calidad del modelo no es una cuestión de eficiencia — es una cuestión de si el software funciona en absoluto. Estos son los **vibe coders al 100%**: no programadores que construyen aplicaciones reales completamente mediante prompts en lenguaje natural, sin capacidad para leer, auditar o entender una sola línea del código generado.

### El Riesgo Invisible

Para un desarrollador profesional, un modelo barato que genera código con errores es **molesto** — detectan el error en la revisión, lo corrigen y siguen adelante. Para un no programador, el mismo error es **invisible**. Se lanza a producción sin ser detectado.

La escala de este problema es asombrosa:

- **Veracode** probó más de 100 LLMs y encontró que el código generado por IA introdujo fallos de seguridad en el **45% de las tareas**. Java fue el peor con más del 70%. Críticamente, los modelos más nuevos y grandes no mostraron ninguna mejora significativa en seguridad — el problema es estructural, no generacional.[^14]
- **CodeRabbit** analizó 470 PRs de código abierto y encontró que el código de autoría de IA tenía **1,7 veces más problemas graves** y **1,4 veces más problemas críticos** que el código humano. Los errores lógicos eran un 75% mayores. Los problemas de rendimiento (E/S excesiva) eran **8 veces más comunes**. Las vulnerabilidades de seguridad eran **1,5–2 veces mayores**.[^15]
- **BaxBench** y la investigación de la NYU confirman que el **40–62% del código generado por IA** contiene fallos de seguridad — cross-site scripting, inyección SQL, validación de entrada faltante — el tipo de vulnerabilidades que no hacen colapsar la aplicación pero silenciosamente exponen los datos de todos los usuarios.[^16]

Un desarrollador profesional reconoce estos patrones. Un vibe coder no sabe que existen.

### Catástrofes del Mundo Real

Esto no es teórico. En 2025, el investigador de seguridad Matt Palmer descubrió que **170 de 1.645 aplicaciones** construidas con Lovable — una popular plataforma de vibe coding — tenían seguridad de base de datos fatalmente mal configurada. Cualquier persona en internet podía leer y escribir en sus bases de datos. Los datos expuestos incluían nombres completos, direcciones de correo electrónico, números de teléfono, direcciones particulares, cantidades de deuda personal y claves API.[^17]

Escape.tech fue más lejos, escaneando **más de 5.600 aplicaciones de vibe coding desplegadas públicamente** en plataformas incluyendo Lovable, Base44, Create.xyz y Bolt.new. Encontraron más de **2.000 vulnerabilidades**, **más de 400 secretos expuestos** e **175 instancias de PII expuesta** incluyendo registros médicos, IBANs y números de teléfono.[^18]

Estos no fueron errores de desarrolladores. Los desarrolladores — si podemos llamarlos así — no tenían idea de que existían las vulnerabilidades. Pidieron a la IA que construyera una aplicación, la aplicación parecía funcionar y la desplegaron. Los fallos de seguridad eran invisibles para cualquiera que no pudiera leer el código.

### La Trampa de la Cadena de Suministro

Los no codificadores enfrentan una amenaza que incluso los desarrolladores experimentados encuentran difícil de detectar: el **slopsquatting**. Los modelos de IA alucinan nombres de paquetes — aproximadamente el 20% de las muestras de código hacen referencia a paquetes inexistentes. Los atacantes registran estos nombres de paquetes fantasma e inyectan malware. Cuando la IA del vibe coder sugiere instalar el paquete, el malware entra automáticamente en su aplicación.[^19]

Un desarrollador podría notar un nombre de paquete desconocido y verificarlo. Un vibe coder instala lo que la IA le dice que instale. No tiene ningún marco de referencia para lo que es legítimo y lo que es alucinado.

### Por Qué la Calidad del Modelo Es la Única Red de Seguridad

El equipo de investigación Unit 42 de Palo Alto Networks lo dijo claramente: los desarrolladores ciudadanos — personas sin formación en desarrollo — "carecen de formación en cómo escribir código seguro y pueden no tener una comprensión completa de los requisitos de seguridad necesarios en el ciclo de vida de las aplicaciones". Su investigación encontró **brechas de datos, omisiones de autenticación y ejecución de código arbitrario** del mundo real rastreados directamente hasta aplicaciones de vibe coding.[^20]

Para los desarrolladores profesionales, la revisión de código, las pruebas y las auditorías de seguridad sirven como redes de seguridad. Detectan lo que el modelo pasa por alto. Los vibe coders no tienen **ninguna de estas redes de seguridad**. No pueden revisar código que no pueden leer. No pueden escribir pruebas para comportamientos que no entienden. No pueden auditar propiedades de seguridad de las que nunca han oído hablar.

Esto significa que el modelo de IA en sí mismo es el **único** control de calidad en toda la cadena. Cada fallo que el modelo introduce llega directamente a los usuarios. No hay segunda oportunidad, no hay punto de control humano, no hay red de seguridad.

Y aquí es precisamente donde más importa la calidad del modelo:

- **Opus produce un 50–75% menos de errores** que los modelos más baratos.[^1] Para un vibe coder con cero capacidad para detectar errores, esta es la diferencia entre una aplicación funcional y una aplicación que silenciosamente filtra datos de usuarios.
- **Opus alcanza el rendimiento máximo en 4 iteraciones**, no en 10.[^1] Cada iteración adicional significa que el vibe coder tiene que describir el problema en lenguaje natural (no puede señalar la línea que está mal), esperar que la IA entienda y esperar que la corrección no introduzca nuevos errores que tampoco puede ver.
- **Opus tiene la mayor resistencia a la inyección de prompts** entre los modelos de frontera — fundamental cuando el vibe coder está construyendo aplicaciones que manejan entradas de usuario que no pueden sanitizar ellos mismos.
- **Opus usa menos tokens por tarea**, lo que significa que genera menos código para lograr el mismo objetivo — menos código significa menos superficie de ataque, menos lugares donde los errores pueden esconderse en código que nadie leerá jamás.

Para un desarrollador, un modelo barato es un impuesto sobre la productividad. Para un vibe coder, un modelo barato es una **responsabilidad**. El modelo no es su asistente — es su **equipo de ingeniería completo**. Contratar al "ingeniero" más barato posible cuando no tienes capacidad para verificar su trabajo no es ser frugal. Es irresponsable.

### La Decisión Real para los No Codificadores

Si no puedes leer código, no estás eligiendo entre una herramienta barata y una cara. Estás eligiendo entre:

1. **Un modelo que logra la seguridad correctamente el 55% de las veces** (y nunca sabrás nada del otro 45%)
2. **Un modelo que logra la seguridad correctamente el 80%+ de las veces** (y produce dramáticamente menos de los errores silenciosos e invisibles que destruyen negocios)

La prima del 67% por token no tiene sentido comparada con el coste de una brecha de datos que no sabías que era posible, integrada en código que no podías leer, en una aplicación que desplegaste a usuarios reales.

**Para los vibe coders, el modelo caro no es la opción más barata. Es la única responsable.**

## El Marco de Decisión

| Si... | Usa... | Por qué |
|-----------|--------|-----|
| Codificas durante horas diariamente | Opus + suscripción | Coste marginal cero, mayor calidad |
| Trabajas en tareas complejas | Extra-alto / Opus | Menos iteraciones, menos errores |
| Mantienes código de larga duración | El mejor modelo disponible | La deuda técnica es el coste real |
| Haces vibe coding sin leer código | **Opus — no negociable** | El modelo es tu única red de seguridad |
| Tienes un presupuesto limitado | Aun así Opus con suscripción | $200/mes < coste de depurar salida barata |
| Haces consultas puntuales rápidas | Sonnet / esfuerzo medio | El umbral de calidad importa menos para tareas simples |

El único escenario donde los modelos más baratos ganan es para **tareas triviales donde cualquier modelo tiene éxito en el primer intento**. Para todo lo demás — que es la mayor parte de la ingeniería de software real — el modelo caro es la opción barata.

## El Resultado Final

El precio por token es una métrica de vanidad. El coste por tarea es la métrica real. Y por tarea, el modelo más capaz gana consistentemente — no por un margen pequeño, sino por múltiplos:

- **60% más barato** por tarea (menos tokens)
- **60% menos** iteraciones para alcanzar el rendimiento máximo
- **50–75% menos** errores
- **22.500 veces** más valioso en ahorro de tiempo de desarrollador que la diferencia en el coste de tokens

El modelo más caro no es un lujo. Es la elección mínima viable para cualquiera que valore su tiempo.

[^1]: Anthropic (2025). [Introducing Claude Opus 4.5](https://www.anthropic.com/news/claude-opus-4-5). Hallazgos clave: con esfuerzo medio, Opus 4.5 iguala la mejor puntuación SWE-bench de Sonnet 4.5 usando un 76% menos de tokens de salida; con el mayor esfuerzo, Opus supera a Sonnet en 4,3 puntos porcentuales usando un 48% menos de tokens; reducción del 50–75% en errores de llamadas a herramientas y errores de compilación/lint; rendimiento máximo alcanzado en 4 iteraciones frente a hasta 10 para competidores.

[^2]: claudefa.st (2025). [Claude Opus 4.5: 67% Cheaper, 76% Fewer Tokens](https://claudefa.st/blog/models/claude-opus-4-5). Análisis que muestra que la prima de precio por token se compensa con creces por un consumo de tokens dramáticamente menor por tarea, haciendo de Opus la elección más rentable para la mayoría de las cargas de trabajo.

[^3]: Datos salariales de desarrolladores de Glassdoor (2025): salario promedio de desarrollador de software en EE.UU. $121.264–$172.049/año. A $75/hora, 15 minutos de revisión/corrección por iteración fallida = $18,75 en tiempo humano. Seis iteraciones adicionales (diferencia entre 4 y 10) = $112,50 por tarea compleja. Ver: [Glassdoor Software Developer Salary](https://www.glassdoor.com/Salaries/software-developer-salary-SRCH_KO0,18.htm).

[^4]: Faros AI (2025). [The AI Productivity Paradox](https://www.faros.ai/blog/ai-software-engineering). Estudio de 1.255 equipos y más de 10.000 desarrolladores encontró: los desarrolladores individuales en equipos de alta IA completan un 21% más de tareas y fusionan un 98% más de PRs, pero el tiempo de revisión de PR aumentó un 91%, los errores aumentaron un 9% por desarrollador y el tamaño del PR creció un 154%. Sin correlación significativa entre la adopción de IA y las mejoras de rendimiento a nivel de empresa.

[^5]: Clasificación SWE-bench Verified, febrero de 2026. Agregado de [marc0.dev](https://www.marc0.dev/en/leaderboard), [llm-stats.com](https://llm-stats.com/benchmarks/swe-bench-verified) y [The Unwind AI](https://www.theunwindai.com/p/claude-opus-4-5-scores-80-9-on-swe-bench). Claude Opus 4.5 fue el primer modelo en superar el 80% en SWE-bench Verified.

[^6]: JetBrains AI Blog (2026). [The Best AI Models for Coding: Accuracy, Integration, and Developer Fit](https://blog.jetbrains.com/ai/2026/02/the-best-ai-models-for-coding-accuracy-integration-and-developer-fit/). Análisis del coste por tarea en múltiples modelos, incorporando el consumo de tokens y las tasas de éxito. Ver también: [AI Coding Benchmarks](https://failingfast.io/ai-coding-guide/benchmarks/) en Failing Fast.

[^7]: OpenAI (2025). [GPT-5.1-Codex-Max](https://openai.com/index/gpt-5-1-codex-max/); [Codex Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide/). Codex-Max con esfuerzo de razonamiento medio supera al Codex estándar con el mismo esfuerzo usando un 30% menos de tokens de pensamiento — el modelo premium es inherentemente más eficiente en tokens.

[^8]: METR (2025). [Measuring the Impact of Early 2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/). Ensayo controlado aleatorizado: 16 desarrolladores experimentados, 246 tareas, compensación de $150/hora. Los desarrolladores asistidos por IA fueron un 19% más lentos. Los desarrolladores esperaban una aceleración del 24% y creyeron a posteriori que eran un 20% más rápidos — una brecha de percepción de ~39 puntos porcentuales. Menos del 44% del código generado por IA fue aceptado. Ver también: [arXiv:2507.09089](https://arxiv.org/abs/2507.09089).

[^9]: Los datos de la industria sobre los costes del ciclo de vida del software sitúan consistentemente el mantenimiento en el 60–80% del coste total. Ver: Sommerville, I. (2015). *Software Engineering*, 10.ª ed., Capítulo 9: "Los costes de cambiar el software después del lanzamiento típicamente superan con creces los costes iniciales de desarrollo." Ver también: [MIT Sloan: The Hidden Costs of Coding with Generative AI](https://sloanreview.mit.edu/article/the-hidden-costs-of-coding-with-generative-ai/).

[^10]: GitClear (2024). [AI Code Quality Analysis](https://leaddev.com/technical-direction/how-ai-generated-code-accelerates-technical-debt): aumento de 8x en bloques de código duplicados, aumento de 2x en la rotación de código (2020–2024). SonarSource (2025): el análisis del código generado por IA encontró una falta sistémica de conciencia de seguridad en todos los modelos probados, con Claude Sonnet 4 produciendo casi el doble de la proporción de errores de nivel BLOQUEADOR — un aumento del 93% en la tasa de introducción de errores graves. Ver: [DevOps.com: AI in Software Development](https://devops.com/ai-in-software-development-productivity-at-the-cost-of-code-quality-2/).

[^11]: Level Up Coding (2025). [Claude API vs Subscription Cost Analysis](https://levelup.gitconnected.com/why-i-stopped-paying-api-bills-and-saved-36x-on-claude-the-math-will-shock-you-46454323346c). Comparación de la facturación por suscripción frente a la facturación por API que muestra que las suscripciones son aproximadamente 18 veces más baratas para sesiones de codificación sostenidas.

[^12]: The CAIO (2025). [Claude Code Pricing Guide](https://www.thecaio.ai/blog/claude-code-pricing-guide). Coste promedio de Claude Code: $6 por desarrollador por día, con el 90% de los usuarios por debajo de $12/día en planes de suscripción.

[^13]: Peng, S. et al. (2023). [The Impact of AI on Developer Productivity: Evidence from GitHub Copilot](https://arxiv.org/abs/2302.06590). Estudio de laboratorio: los desarrolladores completaron tareas un 55,8% más rápido con Copilot. Ver también: el estudio de caso de ZoomInfo que muestra un aumento de productividad del 40–50% con IA, con la diferencia creciendo a medida que aumenta la dificultad de la tarea ([arXiv:2501.13282](https://arxiv.org/html/2501.13282v1)).

[^14]: Veracode (2025). [2025 GenAI Code Security Report](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/). Análisis de 80 tareas de codificación en más de 100 LLMs: el código generado por IA introdujo fallos de seguridad en el 45% de los casos. Java el peor con más del 70%, Python/C#/JavaScript al 38–45%. Los modelos más nuevos y grandes no mostraron ninguna mejora significativa en seguridad. Ver también: [BusinessWire announcement](https://www.businesswire.com/news/home/20250730694951/en/).

[^15]: CodeRabbit (2025). [State of AI vs Human Code Generation Report](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report). Análisis de 470 PRs de GitHub de código abierto (320 con coautoría de IA, 150 solo humanos): el código de IA tenía 1,7 veces más problemas graves, 1,4 veces más problemas críticos, 75% más errores lógicos, 1,5–2 veces más vulnerabilidades de seguridad, 3 veces más problemas de legibilidad y casi 8 veces más problemas de rendimiento (E/S excesiva). Ver también: [The Register coverage](https://www.theregister.com/2025/12/17/ai_code_bugs/).

[^16]: BaxBench y la investigación de NYU sobre seguridad del código de IA. Ver: Tihanyi, N. et al. (2025). [Is Vibe Coding Safe? Benchmarking Vulnerability of Agent-Generated Code in Real-World Tasks](https://arxiv.org/abs/2512.03262). BaxBench combina escenarios de codificación de backend con exploits de seguridad diseñados por expertos, encontrando que el 40–62% del código generado por IA contiene fallos de seguridad incluyendo XSS, inyección SQL y validación de entrada faltante.

[^17]: Palmer, M. (2025). [Statement on CVE-2025-48757](https://mattpalmer.io/posts/statement-on-CVE-2025-48757/). Análisis de 1.645 aplicaciones construidas con Lovable: 170 tenían Row Level Security fatalmente mal configurada, permitiendo acceso no autenticado para leer y escribir bases de datos de usuarios. PII expuesta incluyó nombres, correos electrónicos, números de teléfono, domicilios, cantidades de deuda personal y claves API. Ver también: [Superblocks: Lovable Vulnerability Explained](https://www.superblocks.com/blog/lovable-vulnerabilities).

[^18]: Escape.tech (2025). [The State of Security of Vibe Coded Apps](https://escape.tech/state-of-security-of-vibe-coded-apps). Escaneado de más de 5.600 aplicaciones de vibe coding desplegadas públicamente en Lovable, Base44, Create.xyz, Bolt.new y otros. Encontró más de 2.000 vulnerabilidades, más de 400 secretos expuestos e 175 instancias de PII expuesta incluyendo registros médicos, IBANs y números de teléfono. Ver también: [Methodology detail](https://escape.tech/blog/methodology-how-we-discovered-vulnerabilities-apps-built-with-vibe-coding/).

[^19]: Lanyado, B. et al. (2025). [AI-hallucinated code dependencies become new supply chain risk](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/). Estudio de 16 modelos de IA de generación de código: ~20% de 756.000 muestras de código recomendaban paquetes inexistentes. El 43% de los paquetes alucinados se repetían consistentemente en las consultas, haciéndolos explotables. Los modelos de código abierto alucinaban al 21,7%; los modelos comerciales al 5,2%. Ver también: [HackerOne: Slopsquatting](https://www.hackerone.com/blog/ai-slopsquatting-supply-chain-security).

[^20]: Palo Alto Networks Unit 42 (2025). [Securing Vibe Coding Tools: Scaling Productivity Without Scaling Risk](https://unit42.paloaltonetworks.com/securing-vibe-coding-tools/). Investigación de incidentes de seguridad de vibe coding del mundo real: brechas de datos, omisiones de autenticación y ejecución de código arbitrario. Señala que los desarrolladores ciudadanos "carecen de formación en cómo escribir código seguro y pueden no tener una comprensión completa de los requisitos de seguridad necesarios en el ciclo de vida de las aplicaciones". Introdujo el marco de gobernanza SHIELD. Ver también: [Infosecurity Magazine coverage](https://www.infosecurity-magazine.com/news/palo-alto-networks-vibe-coding).
