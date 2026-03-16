# Por Qué los Prompts en Inglés Producen Mejor Código

Las herramientas de codificación con IA funcionan mejor cuando les das prompts en inglés — incluso si el inglés no es tu primer idioma. VMark incluye un gancho que traduce y refina tus prompts automáticamente.

## Por Qué Importa el Inglés para la Codificación con IA

### Los LLMs Piensan en Inglés

Los grandes modelos de lenguaje procesan internamente todos los idiomas a través de un espacio de representación fuertemente alineado con el inglés.[^1] Pre-traducir prompts que no están en inglés al inglés antes de enviarlos al modelo mejora de manera medible la calidad de la salida.[^2]

En la práctica, un prompt en chino como "把这个函数改成异步的" funciona — pero el equivalente en inglés "Convert this function to async" produce código más preciso con menos iteraciones.

### El Uso de Herramientas Hereda el Idioma del Prompt

Cuando una herramienta de codificación con IA busca en la web, lee documentación o consulta referencias de API, usa el idioma de tu prompt para esas consultas. Las consultas en inglés encuentran mejores resultados porque:

- La documentación oficial, Stack Overflow y los issues de GitHub están predominantemente en inglés
- Los términos técnicos de búsqueda son más precisos en inglés
- Los ejemplos de código y los mensajes de error están casi siempre en inglés

Un prompt en chino que pregunte sobre "状态管理" puede buscar recursos en chino, omitiendo la documentación canónica en inglés. Los benchmarks multilingües muestran consistentemente diferencias de rendimiento de hasta un 24% entre el inglés y otros idiomas — incluso los bien representados como el francés o el alemán.[^3]

## El Gancho de Refinamiento de Prompts `::`

El archivo `.claude/hooks/refine_prompt.mjs` de VMark es un [gancho UserPromptSubmit](https://docs.anthropic.com/en/docs/claude-code/hooks) que intercepta tu prompt antes de que llegue a Claude, lo traduce al inglés y lo refina en un prompt de codificación optimizado.

### Cómo Usarlo

Prefija tu prompt con `::` o `>>`:

```
:: 把这个函数改成异步的
```

El gancho:
1. Envía tu texto a Claude Haiku (rápido, barato) para su traducción y refinamiento
2. Bloquea el prompt original para que no se envíe
3. Copia el prompt refinado en inglés a tu portapapeles
4. Te muestra el resultado

Luego pegas (`Cmd+V`) el prompt refinado y presionas Enter para enviarlo.

### Ejemplo

**Entrada:**
```
:: 这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下
```

**Salida refinada (copiada al portapapeles):**
```
Optimize this component to prevent unnecessary re-renders when the parent component updates. Use React.memo, useMemo, or useCallback as appropriate.
```

### Qué Hace

El gancho usa un prompt de sistema cuidadosamente estructurado que le da a Haiku:

- **Conocimiento de Claude Code** — conoce las capacidades de la herramienta objetivo (edición de archivos, Bash, Glob/Grep, herramientas MCP, modo de planificación, subagentes)
- **Contexto del proyecto** — se carga desde `.claude/hooks/project-context.txt` para que Haiku conozca la pila tecnológica, las convenciones y las rutas de archivos clave
- **Reglas ordenadas por prioridad** — preservar la intención primero, luego traducir, luego clarificar el alcance, luego eliminar el relleno
- **Manejo de idiomas mixtos** — traduce la prosa pero mantiene los términos técnicos sin traducir (`useEffect`, rutas de archivos, comandos CLI)
- **Ejemplos de few-shot**[^4] — siete pares de entrada/salida que cubren chino, inglés vago, idiomas mixtos y solicitudes de múltiples pasos
- **Guía de longitud de salida** — 1–2 oraciones para solicitudes simples, 3–5 para las complejas

Si tu entrada ya es un prompt claro en inglés, se devuelve con cambios mínimos.

### Configuración

El gancho está preconfigurado en el archivo `.claude/settings.json` de VMark. Requiere el [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) que está disponible automáticamente con Claude Code.

No se necesita configuración adicional — solo usa el prefijo `::` o `>>`.

::: tip Cuándo Omitirlo
Para comandos cortos (`go ahead`, `yes`, `continue`, `option 2`), envíalos sin el prefijo. El gancho los ignora para evitar viajes de ida y vuelta innecesarios.
:::

## También Funciona para Hablantes de Inglés

Incluso si escribes en inglés, el prefijo `>>` es útil para la optimización de prompts:

```
>> make the thing work better with the new API
```

Se convierte en:
```
Update the integration to use the new API. Fix any deprecated method calls and ensure error handling follows the updated response format.
```

El refinamiento añade especificidad y estructura que ayuda a la IA a producir mejor código en el primer intento.[^5]

[^1]: Los LLMs multilingües toman decisiones clave en un espacio de representación más cercano al inglés, independientemente del idioma de entrada/salida. Usando una lente logit para sondear representaciones internas, los investigadores encontraron que las palabras con carga semántica (como "water" o "sun") se seleccionan en inglés antes de traducirse al idioma objetivo. La dirección de activación también es más efectiva cuando se calcula en inglés. Ver: Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: Pre-traducir sistemáticamente los prompts que no están en inglés al inglés antes de la inferencia mejora la calidad de la salida de LLM en múltiples tareas e idiomas. Los investigadores descomponen los prompts en cuatro partes funcionales (instrucción, contexto, ejemplos, salida) y muestran que la traducción selectiva de componentes específicos puede ser más efectiva que traducirlo todo. Ver: Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: El benchmark MMLU-ProX — 11.829 preguntas idénticas en 29 idiomas — encontró diferencias de rendimiento de hasta un 24,3% entre el inglés y los idiomas de bajos recursos. Incluso los idiomas bien representados como el francés y el alemán muestran una degradación medible. La diferencia se correlaciona fuertemente con la proporción de cada idioma en el corpus de preentrenamiento del modelo, y simplemente escalar el tamaño del modelo no la elimina. Ver: [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Los prompts de few-shot — proporcionar ejemplos de entrada/salida dentro del prompt — mejoran dramáticamente el rendimiento de tareas de LLM. El artículo original de GPT-3 mostró que mientras el rendimiento sin ejemplos mejora constantemente con el tamaño del modelo, el rendimiento con pocos ejemplos aumenta *más rápidamente*, a veces alcanzando la competitividad con modelos ajustados. Los modelos más grandes son más hábiles para aprender de ejemplos en contexto. Ver: Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: Los prompts estructurados y bien elaborados superan consistentemente a las instrucciones vagas en tareas de generación de código. Técnicas como el razonamiento en cadena de pensamiento, la asignación de roles y las restricciones explícitas de alcance mejoran la precisión en el primer intento. Ver: Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
