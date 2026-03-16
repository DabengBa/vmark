# Pourquoi nous acceptons les issues, pas les pull requests

VMark n'accepte pas les pull requests. Nous accueillons les issues — plus elles sont détaillées, mieux c'est. Cette page explique pourquoi.

## La version courte

VMark est vibe-codé. Toute la base de code est écrite par IA sous la supervision d'un seul mainteneur. Quand quelqu'un soumet une pull request, il y a un problème fondamental : **un humain ne peut pas examiner de manière significative le code généré par IA d'un autre humain**. Le relecteur ne comprend pas le code du contributeur parce qu'aucun des deux ne l'a écrit au sens traditionnel du terme — leurs IA l'ont fait.

Les issues n'ont pas ce problème. Une issue bien rédigée décrit *ce qui* devrait se passer. L'IA du mainteneur corrige ensuite la base de code avec une connaissance complète des conventions du projet, de la suite de tests et de l'architecture. Le résultat est cohérent, testé et maintenable.

## Ce que « vibe-codé » signifie vraiment

Le terme « vibe coding » a été inventé par Andrej Karpathy début 2025 pour décrire un style de programmation où vous décrivez ce que vous voulez en langage naturel et laissez une IA écrire le code. Vous guidez la direction, mais vous n'écrivez pas — ni souvent ne lisez — chaque ligne.[^1]

VMark va plus loin que la plupart des projets. Le dépôt est livré avec :

- **`AGENTS.md`** — Règles du projet que chaque outil IA lit au démarrage
- **`.claude/rules/`** — Plus de 15 fichiers de règles couvrant TDD, tokens de design, patterns de composants, accessibilité et plus
- **Commandes slash** — Flux de travail pré-construits pour auditer, corriger et vérifier le code
- **Vérification croisée entre modèles** — Claude écrit, Codex audite (voir [Vérification croisée entre modèles](/fr/guide/users-as-developers/cross-model-verification))

L'IA ne génère pas juste du code aléatoire. Elle opère dans un réseau dense de contraintes — conventions, tests et vérifications automatisées — qui maintient la cohérence de la base de code. Mais cela ne fonctionne que quand **une seule session IA a le contexte complet** de ces contraintes.

## L'écart de compréhension

Voici le problème central avec les pull requests générées par IA : personne ne les lit vraiment complètement.

Une recherche de la conférence FSE de l'ACM a trouvé que les développeurs — en particulier ceux qui n'ont pas écrit le code eux-mêmes — ont du mal à comprendre le code généré par LLM. L'étude, intitulée *« I Would Have Written My Code Differently »: Beginners Struggle to Understand LLM-Generated Code*, a documenté comment même des développeurs techniquement capables ont des difficultés à raisonner sur du code qu'ils n'ont pas rédigé quand une IA l'a écrit.[^2]

Ce n'est pas seulement un problème de débutants. Une analyse 2025 de plus de 500 000 pull requests par CodeRabbit a trouvé que les PRs générées par IA contiennent **1,7x plus de problèmes** que les PRs écrites par des humains — incluant 75 % plus d'erreurs de logique et d'exactitude. La plus grande préoccupation ? Ce sont précisément les erreurs qui semblent raisonnables lors de la revue, à moins de parcourir le code étape par étape.[^3]

Les chiffres empirent quand les deux côtés utilisent l'IA :

| Scénario | Le relecteur comprend-il le code ? |
|----------|-----------------------------------|
| Humain écrit, humain révise | Oui — le relecteur peut raisonner sur l'intention |
| IA écrit, auteur original révise | Partiellement — l'auteur a guidé l'IA et a du contexte |
| IA écrit, humain différent révise | Mal — le relecteur n'a ni contexte d'authorship ni contexte de session IA |
| IA écrit pour personne A, IA révise pour personne B | Aucun humain ne comprend profondément le code |

VMark se situe dans la dernière ligne. Quand un contributeur ouvre une PR générée par son IA, et que l'IA du mainteneur la révise, les deux humains dans la boucle ont la moins bonne compréhension de tous les scénarios. Ce n'est pas une recette pour un logiciel de qualité.

## Pourquoi les PRs générées par IA sont différentes des PRs humaines

La revue de code traditionnelle fonctionne grâce à une base commune partagée : auteur et relecteur comprennent tous les deux le langage de programmation, les patterns et les idiomes. Le relecteur peut simuler mentalement l'exécution du code et repérer les incohérences.

Avec le code généré par IA, cette base commune s'érode. La recherche montre plusieurs modes d'échec spécifiques :

**Dérive des conventions.** L'IA a une « tendance écrasante à ne pas comprendre quelles sont les conventions existantes dans un dépôt », générant sa propre version légèrement différente de comment résoudre un problème.[^4] Chaque session IA de contributeur produit du code qui fonctionne isolément mais entre en conflit avec les patterns du projet. Dans VMark, où nous imposons des patterns de store Zustand spécifiques, l'usage des tokens CSS et les structures de plugin, la dérive des conventions serait dévastatrice.

**Isolation du contexte.** Les fonctionnalités vibe-codées sont souvent « générées isolément, où l'IA crée des implémentations raisonnables pour chaque prompt mais n'a aucune mémoire des décisions architecturales des sessions précédentes ».[^5] L'IA d'un contributeur ne connaît pas les 15 fichiers de règles de VMark, son pipeline d'audit croisé ou ses conventions de plugin ProseMirror spécifiques — à moins que le contributeur ait soigneusement tout configuré.

**Goulot d'étranglement de la revue.** Les développeurs utilisant l'IA complètent 21 % de tâches supplémentaires et fusionnent 98 % de PRs supplémentaires, mais le temps de revue des PRs augmente de 91 %.[^6] La vitesse de génération de code IA crée un déluge de code qui submerge la capacité de revue humaine. Pour un mainteneur solo, c'est intenable.

## Le précédent SQLite

VMark n'est pas le premier projet à restreindre les contributions. SQLite — l'une des bibliothèques logicielles les plus largement déployées au monde — est « open source, pas open contribution » depuis toute son histoire. Le projet n'accepte pas les patches de personnes au hasard sur internet. Les contributeurs peuvent suggérer des changements et inclure du code de preuve de concept, mais les développeurs principaux réécrivent généralement les patches de zéro.[^7]

Le raisonnement de SQLite est différent (ils doivent maintenir le statut de domaine public), mais le résultat est le même : **la qualité est maintenue en ayant une seule équipe avec le contexte complet** écrire tout le code. Les contributions extérieures sont canalisées via des rapports de bugs et des suggestions de fonctionnalités plutôt que des changements de code directs.

D'autres projets notables ont adopté des positions similaires. Le modèle Benevolent Dictator for Life (BDFL) — utilisé historiquement par Python (Guido van Rossum), Linux (Linus Torvalds) et beaucoup d'autres — concentre l'autorité finale en une seule personne qui assure la cohérence architecturale.[^8] VMark rend simplement cela explicite : le « dictateur » est l'IA, supervisée par le mainteneur.

## Pourquoi les issues fonctionnent mieux

Une issue est une **spécification**, pas une implémentation. Elle décrit ce qui ne va pas ou ce qui est nécessaire, sans s'engager sur une solution particulière. C'est une meilleure interface entre les contributeurs et une base de code maintenue par IA :

| Type de contribution | Ce qu'elle fournit | Risque |
|---------------------|-------------------|--------|
| Pull request | Du code qu'on doit comprendre, réviser, tester et maintenir | Dérive des conventions, perte de contexte, fardeau de revue |
| Issue | Une description du comportement souhaité | Aucun — le mainteneur décide si et comment agir |

### Ce qui fait une bonne issue

Les meilleures issues se lisent comme des documents de spécifications :

1. **Comportement actuel** — Ce qui se passe maintenant (avec des étapes de reproduction pour les bugs)
2. **Comportement attendu** — Ce qui devrait se passer à la place
3. **Contexte** — Pourquoi c'est important, ce que vous essayiez de faire
4. **Environnement** — OS, version de VMark, paramètres pertinents
5. **Captures d'écran ou enregistrements** — Quand un comportement visuel est impliqué

Vous êtes invités à utiliser l'IA pour écrire des issues. En fait, nous l'encourageons. Un assistant IA peut vous aider à structurer une issue détaillée et bien organisée en quelques minutes. L'ironie est intentionnelle : **l'IA est douée pour décrire clairement les problèmes, et l'IA est douée pour corriger des problèmes clairement décrits.** Le goulot d'étranglement est le milieu flou — comprendre la solution générée par IA de quelqu'un d'autre — que les issues contournent proprement.

### Ce qui se passe après que vous déposez une issue

1. Le mainteneur lit et triage l'issue
2. L'IA reçoit l'issue comme contexte, avec une connaissance complète de la base de code
3. L'IA écrit un correctif en suivant TDD (test d'abord, puis implémentation)
4. Un second modèle IA (Codex) audite le correctif de manière indépendante
5. Les contrôles automatisés s'exécutent (`pnpm check:all` — lint, tests, couverture, build)
6. Le mainteneur examine le changement en contexte et fusionne

Ce pipeline produit du code qui est :
- **Conforme aux conventions** — L'IA lit les fichiers de règles à chaque session
- **Testé** — TDD est obligatoire ; les seuils de couverture sont imposés
- **Vérifié de manière croisée** — Un second modèle audite pour les erreurs de logique, la sécurité et le code mort
- **Architecturalement cohérent** — Une session IA avec le contexte complet, pas des fragments de nombreuses sessions

## Le tableau d'ensemble

L'ère IA force une refonte du fonctionnement des contributions open source. Le modèle traditionnel — fork, branche, code, PR, revue, fusion — supposait que les humains écrivent du code et que d'autres humains peuvent le lire. Quand l'IA génère le code, les deux suppositions s'affaiblissent.

Une enquête 2025 sur des développeurs professionnels a trouvé qu'ils « ne font pas de vibe code ; ils contrôlent soigneusement les agents via la planification et la supervision ».[^9] L'accent est mis sur le **contrôle et le contexte** — exactement ce qui est perdu quand une PR arrive depuis une session IA externe non liée d'un contributeur.

Nous croyons que l'avenir de l'open source à l'ère IA ressemble à quelque chose de différent :

- **Les issues deviennent la contribution principale** — Décrire les problèmes est une compétence universelle
- **Les mainteneurs contrôlent l'IA** — Une équipe avec le contexte complet produit du code cohérent
- **La vérification croisée entre modèles remplace la revue humaine** — L'audit IA adversarial attrape ce que les humains ratent
- **Les tests remplacent la confiance** — Les contrôles automatisés, pas le jugement du relecteur, déterminent si le code est correct

VMark expérimente avec ce modèle en ouvert. Ce n'est peut-être pas la bonne approche pour chaque projet. Mais pour une base de code vibe-codée maintenue par une personne avec des outils IA, c'est l'approche qui produit le meilleur logiciel.

## Comment contribuer

**Déposez une issue.** C'est tout. Plus vous fournissez de détails, meilleur sera le correctif.

- **[Rapport de bug](https://github.com/xiaolai/vmark/issues/new?template=bug_report.yml)**
- **[Demande de fonctionnalité](https://github.com/xiaolai/vmark/issues/new?template=feature_request.yml)**

Votre issue devient la spécification de l'IA. Une issue claire mène à un correctif correct. Une issue vague mène à des allers-retours. Investissez dans la description — cela détermine directement la qualité du résultat.

---

[^1]: Karpathy, A. (2025). [Vibe coding](https://en.wikipedia.org/wiki/Vibe_coding). Décrit à l'origine dans un post sur les réseaux sociaux, le terme est rapidement entré dans le vocabulaire courant des développeurs. Wikipédia note que le vibe coding « repose sur des outils IA pour générer du code à partir de prompts en langage naturel, réduisant ou éliminant le besoin pour le développeur d'écrire du code manuellement ».

[^2]: Jury, J. et al. (2025). ["I Would Have Written My Code Differently": Beginners Struggle to Understand LLM-Generated Code](https://dl.acm.org/doi/pdf/10.1145/3696630.3731663). *FSE Companion '25*, 33e Conférence internationale ACM sur les fondements du génie logiciel. L'étude a trouvé que les développeurs qui n'avaient pas rédigé le prompt IA avaient des difficultés significatives à comprendre et raisonner sur le code généré.

[^3]: CodeRabbit. (2025). [AI-Assisted Pull Requests Report](https://www.helpnetsecurity.com/2025/12/23/coderabbit-ai-assisted-pull-requests-report/). Analyse de plus de 500 000 pull requests : les PRs générées par IA contiennent 10,83 problèmes chacune vs. 6,45 dans les PRs humaines (1,7x plus), avec 75 % plus d'erreurs de logique et d'exactitude et 1,4x plus de problèmes critiques.

[^4]: Osmani, A. (2025). [Code Review in the Age of AI](https://addyo.substack.com/p/code-review-in-the-age-of-ai). Analyse de comment le code généré par IA interagit avec les bases de code existantes, notant la tendance de l'IA à créer des patterns incohérents qui s'écartent des conventions de projet établies.

[^5]: Weavy. (2025). [You Can't Vibe Code Your Way Out of a Vibe Coding Mess](https://www.weavy.com/blog/you-cant-vibe-code-your-way-out-of-a-vibe-coding-mess). Documente comment les fonctionnalités vibe-codées générées dans des sessions IA isolées créent des conflits architecturaux quand elles sont combinées, parce que chaque session manque de conscience des décisions prises dans d'autres sessions.

[^6]: SoftwareSeni. (2025). [Why AI Coding Speed Gains Disappear in Code Reviews](https://www.softwareseni.com/why-ai-coding-speed-gains-disappear-in-code-reviews/). Rapporte que si les développeurs assistés par IA complètent 21 % de tâches supplémentaires et fusionnent 98 % de PRs supplémentaires, le temps de revue des PRs augmente de 91 % — révélant que l'IA déplace le goulot d'étranglement de l'écriture à la revue.

[^7]: SQLite. [SQLite Copyright](https://sqlite.org/copyright.html). SQLite est « open source, pas open contribution » depuis ses débuts. Le projet n'accepte pas de patches de contributeurs externes pour maintenir le statut de domaine public et la qualité du code. Les contributeurs peuvent suggérer des changements, mais l'équipe principale réécrit les implémentations de zéro.

[^8]: Wikipedia. [Benevolent Dictator for Life](https://en.wikipedia.org/wiki/Benevolent_dictator_for_life). Le modèle de gouvernance BDFL, utilisé par Python, Linux et beaucoup d'autres projets, concentre l'autorité architecturale en une personne pour maintenir la cohérence. Les BDFLs notables incluent Guido van Rossum (Python), Linus Torvalds (Linux) et Larry Wall (Perl).

[^9]: Dang, H.T. et al. (2025). [Professional Software Developers Don't Vibe, They Control: AI Agent Use for Coding in 2025](https://arxiv.org/html/2512.14012). Enquête auprès de développeurs professionnels : ils maintiennent un contrôle étroit sur les agents IA via la planification et la supervision, plutôt que d'adopter l'approche « hands-off » du vibe coding.
