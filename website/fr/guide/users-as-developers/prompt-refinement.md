# Pourquoi les prompts en anglais donnent de meilleurs résultats

Les outils de codage IA fonctionnent mieux quand vous leur donnez des prompts en anglais — même si l'anglais n'est pas votre langue maternelle. VMark est livré avec un hook qui traduit et affine vos prompts automatiquement.

## Pourquoi l'anglais compte pour le codage IA

### Les LLMs pensent en anglais

Les grands modèles de langage traitent en interne toutes les langues à travers un espace de représentation fortement aligné avec l'anglais.[^1] Pré-traduire les prompts non anglophones en anglais avant de les envoyer au modèle améliore mesurément la qualité de l'output.[^2]

En pratique, un prompt chinois comme « 把这个函数改成异步的 » fonctionne — mais l'équivalent anglais « Convert this function to async » produit du code plus précis avec moins d'itérations.

### L'utilisation des outils hérite de la langue du prompt

Quand un outil de codage IA recherche sur le web, lit de la documentation ou consulte des références API, il utilise la langue de votre prompt pour ces requêtes. Les requêtes en anglais trouvent de meilleurs résultats parce que :

- Les docs officielles, Stack Overflow et les issues GitHub sont principalement en anglais
- Les termes techniques sont plus précis en anglais
- Les exemples de code et les messages d'erreur sont presque toujours en anglais

Un prompt en chinois demandant « 状态管理 » peut rechercher des ressources chinoises, manquant la documentation anglaise canonique. Les benchmarks multilingues montrent systématiquement des écarts de performance allant jusqu'à 24 % entre l'anglais et les autres langues — même des langues bien représentées comme le français ou l'allemand.[^3]

## Le hook de raffinement de prompt `::`

Le fichier `.claude/hooks/refine_prompt.mjs` de VMark est un [hook UserPromptSubmit](https://docs.anthropic.com/en/docs/claude-code/hooks) qui intercepte votre prompt avant qu'il n'atteigne Claude, le traduit en anglais et l'affine en un prompt de codage optimisé.

### Comment l'utiliser

Préfixez votre prompt avec `::` ou `>>` :

```
:: 把这个函数改成异步的
```

Le hook :
1. Envoie votre texte à Claude Haiku (rapide, bon marché) pour traduction et affinement
2. Empêche l'envoi du prompt original
3. Copie le prompt anglais affiné dans votre presse-papiers
4. Vous montre le résultat

Vous collez ensuite (`Cmd+V`) le prompt affiné et appuyez sur Entrée pour l'envoyer.

### Exemple

**Entrée :**
```
:: 这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下
```

**Output affiné (copié dans le presse-papiers) :**
```
Optimize this component to prevent unnecessary re-renders when the parent component updates. Use React.memo, useMemo, or useCallback as appropriate.
```

### Ce qu'il fait

Le hook utilise un prompt système soigneusement structuré qui donne à Haiku :

- **Conscience de Claude Code** — connaît les capacités de l'outil cible (modification de fichiers, Bash, Glob/Grep, outils MCP, mode plan, sous-agents)
- **Contexte du projet** — chargé depuis `.claude/hooks/project-context.txt` pour que Haiku connaisse la pile technique, les conventions et les chemins de fichiers clés
- **Règles ordonnées par priorité** — préserver l'intention d'abord, puis traduire, puis clarifier la portée, puis supprimer le remplissage
- **Gestion des langues mixtes** — traduit la prose mais garde les termes techniques non traduits (`useEffect`, chemins de fichiers, commandes CLI)
- **Exemples few-shot**[^4] — sept paires d'entrée/sortie couvrant le chinois, l'anglais vague, les langues mixtes et les requêtes multi-étapes
- **Orientation sur la longueur de l'output** — 1–2 phrases pour les requêtes simples, 3–5 pour les requêtes complexes

Si votre entrée est déjà un prompt anglais clair, elle est retournée avec des changements minimaux.

### Configuration

Le hook est préconfiguré dans le `.claude/settings.json` de VMark. Il nécessite le [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) qui est automatiquement disponible avec Claude Code.

Aucune configuration supplémentaire n'est nécessaire — utilisez simplement le préfixe `::` ou `>>`.

::: tip Quand l'ignorer
Pour les commandes courtes (`go ahead`, `yes`, `continue`, `option 2`), envoyez-les sans préfixe. Le hook les ignore pour éviter des allers-retours inutiles.
:::

## Fonctionne aussi pour les anglophones

Même si vous écrivez en anglais, le préfixe `>>` est utile pour l'optimisation des prompts :

```
>> make the thing work better with the new API
```

Devient :
```
Update the integration to use the new API. Fix any deprecated method calls and ensure error handling follows the updated response format.
```

L'affinement ajoute de la spécificité et de la structure qui aident l'IA à produire un meilleur code du premier coup.[^5]

[^1]: Les LLMs multilingues prennent leurs décisions clés dans un espace de représentation le plus proche de l'anglais, quelle que soit la langue d'entrée/sortie. En utilisant une lentille logit pour sonder les représentations internes, les chercheurs ont constaté que les mots sémantiquement chargés (comme « water » ou « sun ») sont sélectionnés en anglais avant d'être traduits dans la langue cible. Le pilotage par activation est aussi plus efficace quand il est calculé en anglais. Voir : Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: La pré-traduction systématique des prompts non anglophones en anglais avant l'inférence améliore la qualité de l'output des LLMs sur plusieurs tâches et langues. Les chercheurs décomposent les prompts en quatre parties fonctionnelles (instruction, contexte, exemples, output) et montrent que la traduction sélective de composants spécifiques peut être plus efficace que tout traduire. Voir : Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: Le benchmark MMLU-ProX — 11 829 questions identiques en 29 langues — a trouvé des écarts de performance allant jusqu'à 24,3 % entre l'anglais et les langues à faibles ressources. Même des langues bien représentées comme le français et l'allemand montrent une dégradation mesurable. L'écart corrèle fortement avec la proportion de chaque langue dans le corpus de pré-entraînement du modèle, et le simple fait d'augmenter la taille du modèle ne l'élimine pas. Voir : [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024) ; Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: Le few-shot prompting — fournir des exemples d'entrée/sortie dans le prompt — améliore considérablement les performances des LLMs sur les tâches. L'article fondateur GPT-3 a montré que si les performances zero-shot s'améliorent régulièrement avec la taille du modèle, les performances few-shot augmentent *plus rapidement*, atteignant parfois la compétitivité avec des modèles affinés. Les modèles plus grands sont plus habiles à apprendre à partir d'exemples en contexte. Voir : Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: Les prompts structurés et bien conçus surpassent systématiquement les instructions vagues dans les tâches de génération de code. Des techniques comme le raisonnement chain-of-thought, l'attribution de rôles et les contraintes de portée explicites améliorent toutes la précision au premier passage. Voir : Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
