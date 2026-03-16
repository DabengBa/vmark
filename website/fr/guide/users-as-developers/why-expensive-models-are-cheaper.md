# Pourquoi les modèles coûteux sont moins chers

::: info TL;DR
Le modèle IA le plus capable est **60 % moins cher par tâche** malgré un coût 67 % plus élevé par token — parce qu'il utilise moins de tokens, nécessite moins d'itérations et produit 50–75 % moins d'erreurs. Pour les vibe coders qui ne peuvent pas lire le code, la qualité du modèle n'est pas une question d'efficacité — c'est le seul filet de sécurité dans tout le pipeline.
:::

::: details Dernière vérification : février 2026
Les scores de benchmarks, les noms de modèles et les prix dans cet article reflètent l'état du domaine en février 2026. L'argument central — que le coût par tâche compte plus que le prix par token — reste valable même lorsque les chiffres spécifiques changent.
:::

Le modèle de codage IA le plus cher est presque toujours l'option la moins coûteuse — quand vous mesurez ce qui compte vraiment. Le prix par token est une distraction. Ce qui détermine votre coût réel, c'est **combien de tokens il faut pour accomplir le travail**, combien d'itérations vous brûlez et combien de votre temps va à l'examen et à la correction de l'output.

## L'illusion de tarification

Voici les prix API pour les modèles Claude :

| Modèle | Input (par 1M tokens) | Output (par 1M tokens) |
|--------|----------------------|------------------------|
| Claude Opus 4.5 | 5 $ | 25 $ |
| Claude Sonnet 4.5 | 3 $ | 15 $ |

Opus semble 67 % plus cher. La plupart des gens s'arrêtent là et choisissent Sonnet. C'est le mauvais calcul.

### Ce qui se passe vraiment

Les benchmarks d'Anthropic racontent une histoire différente. À effort moyen, Opus 4.5 **égale** le meilleur score SWE-bench de Sonnet 4.5 en utilisant **76 % moins de tokens d'output**. À effort maximal, Opus **dépasse** Sonnet de 4,3 points de pourcentage en utilisant **48 % moins de tokens**.[^1]

Faisons le vrai calcul :

| | Sonnet 4.5 | Opus 4.5 |
|--|-----------|----------|
| Tokens d'output par tâche | ~500 | ~120 |
| Prix par 1M tokens d'output | 15 $ | 25 $ |
| **Coût par tâche** | **0,0075 $** | **0,0030 $** |

Opus est **60 % moins cher par tâche** — malgré un coût 67 % plus élevé par token.[^2]

Ce n'est pas un exemple choisi sur le volet. Sur les tâches de codage à longue portée, Opus atteint des taux de réussite plus élevés en utilisant **jusqu'à 65 % moins de tokens** et en effectuant **50 % moins d'appels d'outils**.[^1]

## La taxe des itérations

Le coût en tokens n'est qu'une partie de l'histoire. Le coût plus important est celui des **itérations** — combien de rounds de génération-examen-correction sont nécessaires pour obtenir du code correct.

Opus 4.5 atteint ses performances maximales en **4 itérations**. Les modèles concurrents nécessitent **jusqu'à 10 tentatives** pour atteindre une qualité similaire.[^1] Chaque itération ratée vous coûte :

- **Des tokens** — le modèle lit le contexte et génère à nouveau
- **Du temps** — vous examinez l'output, trouvez le problème, ré-promptez
- **De l'attention** — changer de contexte entre « est-ce correct ? » et « qu'est-ce qui ne va pas ? »

Au taux développeur de 75 $/heure, chaque itération ratée qui prend 15 minutes à examiner et corriger coûte **18,75 $** en temps humain. Six itérations supplémentaires (l'écart entre 4 et 10) coûtent **112,50 $** en temps développeur — par tâche complexe. La différence de coût en tokens ? Environ un demi-centime.[^3]

**Les économies de temps développeur sont 22 500x la différence de coût en tokens.**

## Le multiplicateur d'erreurs

Les modèles moins chers ne prennent pas seulement plus d'itérations — ils produisent plus d'erreurs qui survivent en production.

Opus 4.5 montre une **réduction de 50–75 %** des erreurs d'appel d'outils et des erreurs de build/lint par rapport aux autres modèles.[^1] Cela compte parce que les erreurs qui échappent à la session de codage deviennent exponentiellement plus coûteuses en aval :

- Un bug détecté pendant le codage prend des minutes à corriger
- Un bug détecté lors de la revue de code coûte une heure (la vôtre + celle du relecteur)
- Un bug détecté en production coûte des jours (débogage, correctif, communication, post-mortem)

L'étude Faros AI — couvrant 1 255 équipes et plus de 10 000 développeurs — a trouvé qu'une forte adoption de l'IA corrélait avec une **augmentation de 9 % des bugs par développeur** et une **augmentation de 91 % du temps de revue des PRs**.[^4] Quand l'IA génère plus de code avec une précision moindre, le goulot d'étranglement de la revue absorbe entièrement les gains de « productivité ».

Un modèle qui fait bien du premier coup évite cette cascade.

## Les preuves SWE-bench

SWE-bench Verified est le standard de l'industrie pour évaluer la capacité de codage IA sur des tâches réelles de génie logiciel. Le classement de février 2026 :[^5]

| Modèle | SWE-bench Verified |
|--------|-------------------|
| Claude Opus 4.5 | **80,9 %** |
| Claude Opus 4.6 | 80,8 % |
| GPT-5.2 | 80,0 % |
| Gemini 3 Flash | 78,0 % |
| Claude Sonnet 4.5 | 77,2 % |
| Gemini 3 Pro | 76,2 % |

Un écart de 3,7 points entre Opus 4.5 et Sonnet 4.5 signifie qu'Opus résout **environ 1 tâche supplémentaire sur 27** que Sonnet échoue. Quand chacun de ces échecs déclenche une session de débogage manuel, le coût se compose rapidement.

Mais voici le vrai coup de théâtre — quand les chercheurs ont mesuré le **coût par tâche résolue** plutôt que le coût par token, Opus était moins cher que Sonnet :

| Modèle | Coût par tâche | Score SWE-bench |
|--------|----------------|-----------------|
| Claude Opus 4.5 | ~0,44 $ | 80,9 % |
| Claude Sonnet 4.5 | ~0,50 $ | 77,2 % |

Sonnet coûte **plus par tâche** tout en résolvant **moins de tâches**.[^6]

## Codex CLI : le même pattern, un fournisseur différent

Le Codex CLI d'OpenAI montre la même dynamique avec les niveaux d'effort de raisonnement :

- **Raisonnement moyen** : Équilibre vitesse et intelligence — le défaut
- **Raisonnement extra-élevé (xhigh)** : Réfléchit plus longtemps, produit de meilleures réponses — recommandé pour les tâches difficiles

GPT-5.1-Codex-Max avec effort moyen surpasse le GPT-5.1-Codex standard au même effort en utilisant **30 % moins de tokens de réflexion**.[^7] Le modèle premium est plus efficace en tokens parce qu'il raisonne mieux — il n'a pas besoin de générer autant d'étapes intermédiaires pour arriver à la bonne réponse.

Le pattern est universel chez tous les fournisseurs : **les modèles plus intelligents gaspillent moins de calcul.**

## L'avertissement METR

L'essai contrôlé randomisé METR fournit une mise en garde cruciale. Seize développeurs expérimentés (150 $/heure) ont reçu 246 tâches avec des outils IA. Le résultat : les développeurs étaient **19 % plus lents** avec l'assistance IA. Encore plus frappant — les développeurs *croyaient* être 20 % plus rapides, un écart de perception de près de 39 points de pourcentage.[^8]

L'étude utilisait des **modèles de classe Sonnet** (Claude 3.5/3.7 Sonnet via Cursor Pro), pas Opus. Moins de 44 % du code généré par l'IA était accepté.

Cela suggère que le seuil de qualité est d'une importance capitale. Un modèle qui produit du code accepté 44 % du temps vous ralentit — vous passez plus de temps à examiner et rejeter qu'à économiser. Un modèle avec 50–75 % moins d'erreurs et une précision au premier passage dramatiquement plus élevée pourrait complètement inverser cette équation.

**L'étude METR ne montre pas que les outils de codage IA sont lents. Elle montre que les outils de codage IA médiocres sont lents.**

## La dette technique : les 75 % que vous ne comptez pas

Le coût initial de l'écriture du code ne représente que **15–25 % du coût total du logiciel** sur son cycle de vie. Les **75–85 %** restants vont à la maintenance, aux opérations et aux corrections de bugs.[^9]

L'analyse de GitClear du code produit entre 2020 et 2024 a trouvé une **multiplication par 8 des blocs de code dupliqués** et un **doublement du churn de code** corrélant avec l'adoption des outils IA. SonarSource a trouvé une **augmentation de 93 % des bugs de niveau BLOCKER** en comparant l'output de Claude Sonnet 4 à son prédécesseur.[^10]

Si un modèle moins cher génère du code avec presque le double du taux de bugs sévères, et que la maintenance consomme 75–85 % du coût du cycle de vie, les « économies » sur la génération de code sont éclipsées par les coûts en aval. Le code le moins cher à maintenir est le code qui était correct dès le début.

## Le calcul des abonnements

Pour les gros utilisateurs, le choix abonnement vs API amplifie encore l'argument sur la qualité des modèles.

| Plan | Coût mensuel | Ce que vous obtenez |
|------|-------------|---------------------|
| Claude Max (100 $) | 100 $ | Usage Opus élevé |
| Claude Max (200 $) | 200 $ | Opus illimité |
| Usage API équivalent | 3 650 $+ | Les mêmes tokens Opus |

L'abonnement est environ **18x moins cher** que la facturation API pour le même travail.[^11] Au prix de l'abonnement, il n'y a aucun coût marginal à utiliser le meilleur modèle — le modèle « coûteux » devient littéralement gratuit pour chaque requête supplémentaire.

Coût moyen de Claude Code sur abonnement : **6 $ par développeur par jour**, avec 90 % des utilisateurs en dessous de 12 $/jour.[^12] Au salaire développeur de 75 $/heure, **5 minutes de temps économisé par jour** paient l'abonnement. Tout au-delà est un retour pur.

## L'argument composé

Voici pourquoi les chiffres deviennent encore plus déséquilibrés avec le temps :

### 1. Moins d'itérations = moins de pollution du contexte

Chaque tentative ratée s'ajoute à l'historique de conversation. Les longues conversations dégradent les performances du modèle — le rapport signal/bruit baisse. Un modèle qui réussit en 4 itérations a un contexte plus propre qu'un modèle qui tâtonne pendant 10, ce qui signifie que ses réponses ultérieures sont aussi meilleures.

### 2. Moins d'erreurs = moins de fatigue d'examen

Les études de productivité de GitHub Copilot ont trouvé que les bénéfices augmentent avec la difficulté de la tâche.[^13] Les tâches difficiles sont là où les modèles bon marché échouent le plus — et là où les modèles coûteux brillent. L'étude de cas ZoomInfo a montré un **gain de productivité de 40–50 %** avec l'IA, l'écart s'élargissant à mesure que la complexité augmentait.

### 3. Meilleur code = meilleur apprentissage

Si vous êtes un développeur qui développe ses compétences (et tout développeur devrait l'être), le code que vous lisez façonne vos instincts. Lire un output IA systématiquement correct et bien structuré enseigne de bons patterns. Lire un output buggé et verbeux enseigne de mauvaises habitudes.

### 4. Code correct = déploiement plus rapide

Chaque itération dont vous n'avez pas besoin est une fonctionnalité qui sort plus tôt. Dans des marchés compétitifs, la vitesse de développement — mesurée en fonctionnalités livrées, pas en tokens générés — est ce qui compte.

## Pour les vibe coders, il ne s'agit pas de coût — il s'agit de survie

Tout ce qui précède s'applique aux développeurs professionnels qui peuvent lire des diffs, repérer des bugs et corriger du code cassé. Mais il y a un groupe en croissance rapide pour qui l'argument sur la qualité du modèle n'est pas une question d'efficacité — c'est une question de savoir si le logiciel fonctionne du tout. Ce sont les **vibe coders à 100 %** : des non-programmeurs construisant de vraies applications entièrement via des prompts en langage naturel, sans la capacité de lire, auditer ou comprendre une seule ligne du code généré.

### Le risque invisible

Pour un développeur professionnel, un modèle bon marché qui génère du code buggé est **ennuyeux** — il attrape le bug à la revue, le corrige et passe à autre chose. Pour un non-programmeur, le même bug est **invisible**. Il est déployé en production non détecté.

L'ampleur de ce problème est stupéfiante :

- **Veracode** a testé plus de 100 LLMs et a constaté que le code généré par IA introduisait des failles de sécurité dans **45 % des tâches**. Java était le pire à plus de 70 %. De façon critique, les modèles plus récents et plus grands ne montraient aucune amélioration significative en matière de sécurité — le problème est structurel, pas générationnel.[^14]
- **CodeRabbit** a analysé 470 PRs open source et a constaté que le code rédigé par IA avait **1,7x plus de problèmes majeurs** et **1,4x plus de problèmes critiques** que le code humain. Les erreurs de logique étaient 75 % plus élevées. Les problèmes de performance (I/O excessif) étaient **8x plus courants**. Les vulnérabilités de sécurité étaient **1,5–2x plus élevées**.[^15]
- **BaxBench** et la recherche NYU confirment que **40–62 % du code généré par IA** contient des failles de sécurité — cross-site scripting, injection SQL, validation d'input manquante — les types de vulnérabilités qui ne font pas planter l'application mais exposent silencieusement les données de chaque utilisateur.[^16]

Un développeur professionnel reconnaît ces patterns. Un vibe coder ne sait même pas qu'ils existent.

### Des catastrophes réelles

Ce n'est pas théorique. En 2025, le chercheur en sécurité Matt Palmer a découvert que **170 des 1 645 applications** construites avec Lovable — une plateforme de vibe coding populaire — avaient une sécurité de base de données fatalement mal configurée. N'importe qui sur internet pouvait lire et écrire dans leurs bases de données. Les données exposées comprenaient des noms complets, des adresses email, des numéros de téléphone, des adresses personnelles, des montants de dettes personnelles et des clés API.[^17]

Escape.tech est allé plus loin, scannant **plus de 5 600 applications vibe-codées** déployées publiquement sur des plateformes incluant Lovable, Base44, Create.xyz et Bolt.new. Ils ont trouvé plus de **2 000 vulnérabilités**, **400+ secrets exposés** et **175 instances de PII exposées** incluant des dossiers médicaux, des IBANs et des numéros de téléphone.[^18]

Ce n'étaient pas des erreurs de développeurs. Les développeurs — si on peut les appeler ainsi — n'avaient aucune idée que les vulnérabilités existaient. Ils ont demandé à l'IA de construire une application, l'application semblait fonctionner, et ils l'ont déployée. Les failles de sécurité étaient invisibles pour quiconque ne pouvait pas lire le code.

### Le piège de la chaîne d'approvisionnement

Les non-codeurs font face à une menace que même les développeurs expérimentés trouvent difficile à détecter : le **slopsquatting**. Les modèles IA hallucinent des noms de packages — environ 20 % des échantillons de code référencent des packages inexistants. Les attaquants enregistrent ces noms de packages fantômes et injectent des logiciels malveillants. Lorsque l'IA du vibe coder suggère d'installer le package, le malware entre automatiquement dans leur application.[^19]

Un développeur pourrait remarquer un nom de package inconnu et le vérifier. Un vibe coder installe ce que l'IA lui dit d'installer. Il n'a aucun cadre de référence pour ce qui est légitime et ce qui est halluciné.

### Pourquoi la qualité du modèle est le seul filet de sécurité

L'équipe de recherche Unit 42 de Palo Alto Networks l'a dit clairement : les développeurs citoyens — des personnes sans formation en développement — « manquent de formation sur la façon d'écrire du code sécurisé et peuvent ne pas avoir une compréhension complète des exigences de sécurité requises dans le cycle de vie des applications ». Leur enquête a trouvé de vraies **violations de données, des contournements d'authentification et des exécutions de code arbitraire** directement liés à des applications vibe-codées.[^20]

Pour les développeurs professionnels, la revue de code, les tests et les audits de sécurité servent de filets de sécurité. Ils attrapent ce que le modèle rate. Les vibe coders n'ont **aucun de ces filets de sécurité**. Ils ne peuvent pas examiner du code qu'ils ne peuvent pas lire. Ils ne peuvent pas écrire des tests pour un comportement qu'ils ne comprennent pas. Ils ne peuvent pas auditer des propriétés de sécurité dont ils n'ont jamais entendu parler.

Cela signifie que le modèle IA lui-même est le **seul** contrôle qualité dans tout le pipeline. Chaque faille que le modèle introduit est directement déployée aux utilisateurs. Il n'y a pas de deuxième chance, pas de point de contrôle humain, pas de filet de sécurité.

Et c'est précisément là où la qualité du modèle compte le plus :

- **Opus produit 50–75 % moins d'erreurs** que les modèles moins chers.[^1] Pour un vibe coder sans aucune capacité à détecter les erreurs, c'est la différence entre une application fonctionnelle et une application qui divulgue silencieusement des données utilisateur.
- **Opus atteint ses performances maximales en 4 itérations**, pas 10.[^1] Chaque itération supplémentaire signifie que le vibe coder doit décrire le problème en langage naturel (il ne peut pas pointer la ligne qui ne va pas), espérer que l'IA comprenne, et espérer que la correction n'introduit pas de nouveaux bugs qu'il ne peut pas non plus voir.
- **Opus a la plus haute résistance à l'injection de prompts** parmi les modèles frontière — critique quand le vibe coder construit des applications qui gèrent des inputs utilisateur qu'il ne peut pas sanitiser lui-même.
- **Opus utilise moins de tokens par tâche**, ce qui signifie qu'il génère moins de code pour accomplir le même objectif — moins de code signifie moins de surface d'attaque, moins d'endroits pour que les bugs se cachent dans du code que personne ne lira jamais.

Pour un développeur, un modèle bon marché est une taxe de productivité. Pour un vibe coder, un modèle bon marché est une **responsabilité**. Le modèle n'est pas son assistant — c'est **toute son équipe d'ingénieurs**. Embaucher l'« ingénieur » le moins cher possible quand on n'a aucune capacité à vérifier son travail n'est pas de l'économie. C'est de l'imprudence.

### La vraie décision pour les non-codeurs

Si vous ne pouvez pas lire du code, vous ne choisissez pas entre un outil bon marché et un outil coûteux. Vous choisissez entre :

1. **Un modèle qui fait bien la sécurité 55 % du temps** (et vous ne saurez jamais ce qui se passe pour les 45 % restants)
2. **Un modèle qui fait bien la sécurité 80 %+ du temps** (et produit beaucoup moins de bugs silencieux et invisibles qui détruisent les entreprises)

La prime de 67 % par token est insignifiante par rapport au coût d'une violation de données que vous ne saviez pas possible, construite dans du code que vous ne pouviez pas lire, dans une application que vous avez déployée à de vrais utilisateurs.

**Pour les vibe coders, le modèle coûteux n'est pas le choix le moins cher. C'est le seul choix responsable.**

## Le cadre de décision

| Si vous... | Utilisez... | Pourquoi |
|-----------|--------|-----|
| Codez des heures quotidiennement | Opus + abonnement | Coût marginal zéro, qualité maximale |
| Travaillez sur des tâches complexes | Extra-high / Opus | Moins d'itérations, moins de bugs |
| Maintenez du code longue durée | Le meilleur modèle disponible | La dette technique est le vrai coût |
| Faites du vibe-code sans lire le code | **Opus — non négociable** | Le modèle est votre seul filet de sécurité |
| Avez un budget limité | Quand même Opus via abonnement | 200 $/mois < coût du débogage d'output bon marché |
| Faites des requêtes rapides ponctuelles | Sonnet / effort moyen | Le seuil de qualité compte moins pour les tâches simples |

Le seul scénario où les modèles moins chers gagnent est pour les **tâches triviales où n'importe quel modèle réussit du premier coup**. Pour tout le reste — ce qui représente la majeure partie du vrai génie logiciel — le modèle coûteux est le choix bon marché.

## Le résultat final

Le prix par token est une métrique de vanité. Le coût par tâche est la vraie métrique. Et par tâche, le modèle le plus capable gagne systématiquement — pas par une petite marge, mais par des multiples :

- **60 % moins cher** par tâche (moins de tokens)
- **60 % moins** d'itérations pour atteindre les performances maximales
- **50–75 % moins** d'erreurs
- **22 500x** plus de valeur en économies de temps développeur que la différence de coût en tokens

Le modèle le plus coûteux n'est pas un luxe. C'est le choix minimum viable pour quiconque valorise son temps.

[^1]: Anthropic (2025). [Introducing Claude Opus 4.5](https://www.anthropic.com/news/claude-opus-4-5). Conclusions clés : à effort moyen, Opus 4.5 égale le meilleur score SWE-bench de Sonnet 4.5 en utilisant 76 % moins de tokens d'output ; à effort maximal, Opus dépasse Sonnet de 4,3 points de pourcentage en utilisant 48 % moins de tokens ; réduction de 50–75 % des erreurs d'appel d'outils et de build/lint ; performances maximales atteintes en 4 itérations vs. jusqu'à 10 pour les concurrents.

[^2]: claudefa.st (2025). [Claude Opus 4.5: 67% Cheaper, 76% Fewer Tokens](https://claudefa.st/blog/models/claude-opus-4-5). Analyse montrant que la prime de prix par token est plus que compensée par une consommation de tokens dramatiquement plus faible par tâche, faisant d'Opus le choix le plus rentable pour la plupart des charges de travail.

[^3]: Données salariales des développeurs de Glassdoor (2025) : salaire moyen d'un développeur de logiciels aux États-Unis 121 264–172 049 $/an. À 75 $/heure, 15 minutes d'examen/correction par itération ratée = 18,75 $ en temps humain. Six itérations supplémentaires (écart entre 4 et 10) = 112,50 $ par tâche complexe. Voir : [Glassdoor Software Developer Salary](https://www.glassdoor.com/Salaries/software-developer-salary-SRCH_KO0,18.htm).

[^4]: Faros AI (2025). [The AI Productivity Paradox](https://www.faros.ai/blog/ai-software-engineering). Étude de 1 255 équipes et plus de 10 000 développeurs : les développeurs individuels dans des équipes à forte utilisation d'IA complètent 21 % de tâches supplémentaires et fusionnent 98 % de PRs supplémentaires, mais le temps de revue des PRs a augmenté de 91 %, les bugs ont augmenté de 9 % par développeur et la taille des PRs a augmenté de 154 %. Aucune corrélation significative entre l'adoption de l'IA et les améliorations de performance au niveau de l'entreprise.

[^5]: Classement SWE-bench Verified, février 2026. Agrégé depuis [marc0.dev](https://www.marc0.dev/en/leaderboard), [llm-stats.com](https://llm-stats.com/benchmarks/swe-bench-verified) et [The Unwind AI](https://www.theunwindai.com/p/claude-opus-4-5-scores-80-9-on-swe-bench). Claude Opus 4.5 a été le premier modèle à dépasser 80 % sur SWE-bench Verified.

[^6]: JetBrains AI Blog (2026). [The Best AI Models for Coding: Accuracy, Integration, and Developer Fit](https://blog.jetbrains.com/ai/2026/02/the-best-ai-models-for-coding-accuracy-integration-and-developer-fit/). Analyse du coût par tâche sur plusieurs modèles, intégrant la consommation de tokens et les taux de réussite. Voir aussi : [AI Coding Benchmarks](https://failingfast.io/ai-coding-guide/benchmarks/) sur Failing Fast.

[^7]: OpenAI (2025). [GPT-5.1-Codex-Max](https://openai.com/index/gpt-5-1-codex-max/) ; [Codex Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide/). Codex-Max avec effort de raisonnement moyen surpasse le Codex standard au même effort en utilisant 30 % moins de tokens de réflexion — le modèle premium est intrinsèquement plus efficace en tokens.

[^8]: METR (2025). [Measuring the Impact of Early 2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/). Essai contrôlé randomisé : 16 développeurs expérimentés, 246 tâches, rémunération de 150 $/heure. Les développeurs assistés par IA étaient 19 % plus lents. Les développeurs prévoyaient une accélération de 24 % et croyaient après coup être 20 % plus rapides — un écart de perception de ~39 points de pourcentage. Moins de 44 % du code généré par IA était accepté. Voir aussi : [arXiv:2507.09089](https://arxiv.org/abs/2507.09089).

[^9]: Les données de l'industrie sur les coûts du cycle de vie des logiciels placent systématiquement la maintenance à 60–80 % du coût total. Voir : Sommerville, I. (2015). *Software Engineering*, 10e éd., Chapitre 9 : « Les coûts de modification des logiciels après leur sortie dépassent généralement largement les coûts de développement initial. » Voir aussi : [MIT Sloan: The Hidden Costs of Coding with Generative AI](https://sloanreview.mit.edu/article/the-hidden-costs-of-coding-with-generative-ai/).

[^10]: GitClear (2024). [AI Code Quality Analysis](https://leaddev.com/technical-direction/how-ai-generated-code-accelerates-technical-debt) : multiplication par 8 des blocs de code dupliqués, doublement du churn de code (2020–2024). SonarSource (2025) : l'analyse du code généré par IA a trouvé un manque systémique de sensibilisation à la sécurité dans tous les modèles testés, Claude Sonnet 4 produisant presque le double de la proportion de bugs de niveau BLOCKER — une augmentation de 93 % du taux d'introduction de bugs sévères. Voir : [DevOps.com: AI in Software Development](https://devops.com/ai-in-software-development-productivity-at-the-cost-of-code-quality-2/).

[^11]: Level Up Coding (2025). [Claude API vs Subscription Cost Analysis](https://levelup.gitconnected.com/why-i-stopped-paying-api-bills-and-saved-36x-on-claude-the-math-will-shock-you-46454323346c). Comparaison de la facturation abonnement vs API montrant que les abonnements sont environ 18x moins chers pour les sessions de codage soutenues.

[^12]: The CAIO (2025). [Claude Code Pricing Guide](https://www.thecaio.ai/blog/claude-code-pricing-guide). Coût moyen de Claude Code : 6 $ par développeur par jour, avec 90 % des utilisateurs en dessous de 12 $/jour sur les plans d'abonnement.

[^13]: Peng, S. et al. (2023). [The Impact of AI on Developer Productivity: Evidence from GitHub Copilot](https://arxiv.org/abs/2302.06590). Étude en laboratoire : les développeurs ont complété des tâches 55,8 % plus vite avec Copilot. Voir aussi : étude de cas ZoomInfo montrant un gain de productivité de 40–50 % avec l'IA, l'écart augmentant avec la difficulté de la tâche ([arXiv:2501.13282](https://arxiv.org/html/2501.13282v1)).

[^14]: Veracode (2025). [2025 GenAI Code Security Report](https://www.veracode.com/resources/analyst-reports/2025-genai-code-security-report/). Analyse de 80 tâches de codage sur 100+ LLMs : le code généré par IA introduisait des failles de sécurité dans 45 % des cas. Java le pire à plus de 70 %, Python/C#/JavaScript à 38–45 %. Les modèles plus récents et plus grands ne montraient aucune amélioration significative en matière de sécurité. Voir aussi : [annonce BusinessWire](https://www.businesswire.com/news/home/20250730694951/en/).

[^15]: CodeRabbit (2025). [State of AI vs Human Code Generation Report](https://www.coderabbit.ai/blog/state-of-ai-vs-human-code-generation-report). Analyse de 470 PRs GitHub open source (320 co-rédigées par IA, 150 uniquement humaines) : le code IA avait 1,7x plus de problèmes majeurs, 1,4x plus de problèmes critiques, 75 % plus d'erreurs de logique, 1,5–2x plus de vulnérabilités de sécurité, 3x plus de problèmes de lisibilité et près de 8x plus de problèmes de performance (I/O excessif). Voir aussi : [The Register coverage](https://www.theregister.com/2025/12/17/ai_code_bugs/).

[^16]: Recherche BaxBench et NYU sur la sécurité du code IA. Voir : Tihanyi, N. et al. (2025). [Is Vibe Coding Safe? Benchmarking Vulnerability of Agent-Generated Code in Real-World Tasks](https://arxiv.org/abs/2512.03262). BaxBench combine des scénarios de codage backend avec des exploits de sécurité conçus par des experts, trouvant que 40–62 % du code généré par IA contient des failles de sécurité incluant XSS, injection SQL et validation d'input manquante.

[^17]: Palmer, M. (2025). [Statement on CVE-2025-48757](https://mattpalmer.io/posts/statement-on-CVE-2025-48757/). Analyse de 1 645 applications construites avec Lovable : 170 avaient une Row Level Security fatalement mal configurée, permettant un accès non authentifié en lecture et écriture aux bases de données utilisateur. Les PII exposées comprenaient des noms, emails, numéros de téléphone, adresses personnelles, montants de dettes personnelles et clés API. Voir aussi : [Superblocks: Lovable Vulnerability Explained](https://www.superblocks.com/blog/lovable-vulnerabilities).

[^18]: Escape.tech (2025). [The State of Security of Vibe Coded Apps](https://escape.tech/state-of-security-of-vibe-coded-apps). Scan de plus de 5 600 applications vibe-codées déployées publiquement sur Lovable, Base44, Create.xyz, Bolt.new et autres. Plus de 2 000 vulnérabilités, 400+ secrets exposés et 175 instances de PII exposées incluant des dossiers médicaux, IBANs et numéros de téléphone. Voir aussi : [détail de méthodologie](https://escape.tech/blog/methodology-how-we-discovered-vulnerabilities-apps-built-with-vibe-coding/).

[^19]: Lanyado, B. et al. (2025). [AI-hallucinated code dependencies become new supply chain risk](https://www.bleepingcomputer.com/news/security/ai-hallucinated-code-dependencies-become-new-supply-chain-risk/). Étude de 16 modèles IA de génération de code : ~20 % de 756 000 échantillons de code recommandaient des packages inexistants. 43 % des packages hallucinés étaient répétés de manière cohérente à travers les requêtes, les rendant exploitables. Les modèles open source hallucinaient à 21,7 % ; les modèles commerciaux à 5,2 %. Voir aussi : [HackerOne: Slopsquatting](https://www.hackerone.com/blog/ai-slopsquatting-supply-chain-security).

[^20]: Palo Alto Networks Unit 42 (2025). [Securing Vibe Coding Tools: Scaling Productivity Without Scaling Risk](https://unit42.paloaltonetworks.com/securing-vibe-coding-tools/). Enquête sur des incidents de sécurité de vibe-coding réels : violations de données, contournements d'authentification et exécutions de code arbitraire. Remarque que les développeurs citoyens « manquent de formation sur la façon d'écrire du code sécurisé et peuvent ne pas avoir une compréhension complète des exigences de sécurité requises dans le cycle de vie des applications ». Cadre de gouvernance SHIELD introduit. Voir aussi : [couverture Infosecurity Magazine](https://www.infosecurity-magazine.com/news/palo-alto-networks-vibe-coding).
