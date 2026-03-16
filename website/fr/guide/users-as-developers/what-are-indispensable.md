# Cinq compétences humaines fondamentales qui décuplent l'IA

Vous n'avez pas besoin d'un diplôme en informatique pour créer des logiciels avec des outils de codage IA. Mais vous avez besoin d'un petit ensemble de compétences qu'aucune IA ne peut remplacer. Ce sont les fondations indispensables — les choses qui rendent tout le reste possible.

## La liste courte

| Compétence | Pourquoi elle est indispensable |
|------------|--------------------------------|
| **Git** | Votre filet de sécurité — annuler n'importe quoi, brancher sans crainte, ne jamais perdre de travail |
| **TDD** | La méthodologie qui garde le code généré par l'IA honnête |
| **Maîtrise du terminal** | Les outils IA vivent dans le terminal ; vous devez lire leur output |
| **Anglais** | Les docs, les erreurs et les prompts IA fonctionnent tous mieux en anglais |
| **Goût** | L'IA génère des options ; vous décidez laquelle est la bonne |

C'est tout. Cinq choses. Tout le reste — la syntaxe du langage, les API de frameworks, les patterns de conception — l'IA s'en charge pour vous.[^1]

## Git — Votre filet de sécurité

Git est l'outil le plus important de votre arsenal. Non pas parce que vous devez maîtriser le rebase ou le cherry-picking — l'IA s'en charge — mais parce que Git vous donne **l'expérimentation sans crainte**.[^2]

### Ce que vous devez vraiment savoir

| Commande | Ce qu'elle fait | Quand l'utiliser |
|----------|----------------|-----------------|
| `git status` | Montre ce qui a changé | Avant et après chaque session IA |
| `git diff` | Montre les changements exacts | Examiner ce que l'IA a écrit avant de committer |
| `git add` + `git commit` | Sauvegarder un point de contrôle | Après chaque état fonctionnel |
| `git log` | Historique des changements | Quand on doit comprendre ce qui s'est passé |
| `git stash` | Mettre temporairement de côté des changements | Quand on veut essayer une approche différente |
| `git checkout -- file` | Annuler les changements d'un fichier | Quand l'IA a empiré quelque chose |
| `git worktree` | Travailler sur plusieurs branches simultanément | Quand on veut explorer des idées en parallèle |

### Le modèle mental

Pensez à Git comme à une **annulation infinie**. Chaque commit est un point de sauvegarde auquel vous pouvez revenir. Cela signifie :

- **Essayer librement des changements risqués** — vous pouvez toujours revenir en arrière
- **Laisser l'IA expérimenter** — si elle casse quelque chose, revenez en arrière
- **Travailler sur plusieurs idées** — les branches vous permettent d'explorer en parallèle
- **Examiner avant d'accepter** — `git diff` vous montre exactement ce que l'IA a changé

L'IA créera des commits, des branches et des pull requests pour vous. Mais vous devez comprendre ce que c'est, car c'est vous qui décidez quand sauvegarder, quand créer une branche et quand fusionner.

### Git Worktrees — Des univers parallèles

Une fonctionnalité Git qui mérite d'être apprise tôt est les **worktrees**. Un worktree vous permet de checkout une branche différente dans un répertoire séparé — sans changer votre travail actuel :

```bash
# Créer un worktree pour une nouvelle fonctionnalité
git worktree add ../my-feature -b feature/new-idea

# Travailler dedans
cd ../my-feature
claude    # démarrer une session IA dans cette branche

# Retour à votre travail principal — intact
cd ../vmark
```

C'est particulièrement puissant avec les outils de codage IA : vous pouvez avoir une session IA expérimentant sur une branche de fonctionnalité pendant que votre branche principale reste propre et fonctionnelle. Si l'expérience échoue, supprimez simplement le répertoire worktree. Pas de désordre, pas de risque.

::: warning Ne sautez pas Git
Sans Git, une seule mauvaise modification IA peut ruiner des heures de travail sans possibilité de retour en arrière. Avec Git, le pire cas est toujours `git checkout -- .` et vous êtes de retour à votre dernière sauvegarde. Apprenez les bases de Git avant tout le reste.
:::

## TDD — Comment garder l'IA honnête

Le Test-Driven Development est la méthodologie qui transforme le codage IA de « espérons que ça marche » en « prouvons que ça marche ». Ce n'est pas seulement une bonne pratique — c'est votre mécanisme principal pour **vérifier** que le code généré par l'IA fait réellement ce que vous avez demandé.[^3]

### Le cycle RED-GREEN-REFACTOR

TDD suit une boucle stricte en trois étapes :

```
1. RED     — Écrire un test qui décrit ce que vous voulez. Il échoue.
2. GREEN   — Demander à l'IA d'écrire le minimum de code pour faire passer le test.
3. REFACTOR — Nettoyer sans changer le comportement. Les tests passent toujours.
```

Cela fonctionne remarquablement bien avec les outils de codage IA car :

| Étape | Votre rôle | Rôle de l'IA |
|-------|-----------|------------|
| RED | Décrire le comportement attendu | Aider à écrire l'assertion de test |
| GREEN | Vérifier que le test passe | Écrire l'implémentation |
| REFACTOR | Juger si le code est assez propre | Faire le nettoyage |

### Pourquoi TDD est plus important avec l'IA

Quand vous écrivez du code vous-même, vous le comprenez implicitement — vous savez ce qu'il fait parce que vous l'avez écrit. Quand l'IA écrit du code, vous avez besoin d'un **mécanisme de vérification externe**. Les tests sont ce mécanisme.[^4]

Sans tests, voici ce qui se passe :

1. Vous demandez à l'IA d'ajouter une fonctionnalité
2. L'IA écrit 200 lignes de code
3. Vous le lisez, ça *semble* correct
4. Vous le déployez
5. Ça casse quelque chose que vous n'avez pas remarqué — un cas limite subtil, une incompatibilité de type, une erreur de décalage de un

Avec TDD :

1. Vous décrivez le comportement comme un test (l'IA vous aide à l'écrire)
2. Le test échoue — confirmant qu'il teste quelque chose de réel
3. L'IA écrit du code pour le faire passer
4. Vous exécutez le test — il passe
5. Vous avez **la preuve** que ça fonctionne, pas seulement un sentiment

### À quoi ressemble un test

Vous n'avez pas besoin d'écrire des tests de zéro. Décrivez ce que vous voulez en langage courant, et l'IA écrit le test. Mais vous devez être capable de **lire** un test :

```ts
// "Quand l'utilisateur sauvegarde un document, le drapeau de modification devrait s'effacer"
it("clears modified flag after save", () => {
  // Setup : marquer le document comme modifié
  store.markModified("doc-1");
  expect(store.isModified("doc-1")).toBe(true);

  // Action : sauvegarder le document
  store.save("doc-1");

  // Verify : le drapeau de modification est effacé
  expect(store.isModified("doc-1")).toBe(false);
});
```

Le pattern est toujours le même : **setup**, **action**, **verify**. Une fois que vous reconnaissez ce pattern, vous pouvez lire n'importe quel test — et, plus important encore, vous pouvez dire à l'IA quoi tester ensuite.

### Cas limites — Là où vivent les bugs

La vraie puissance de TDD réside dans les **cas limites** — les entrées inhabituelles et les conditions aux frontières où se cachent les bugs. L'IA est étonnamment mauvaise pour y penser seule.[^5] Mais vous pouvez la guider :

> « Que se passe-t-il si le nom de fichier est vide ? »
> « Et si l'utilisateur double-clique sur le bouton de sauvegarde ? »
> « Et si le réseau tombe au milieu d'une requête ? »
> « Et un fichier avec des caractères Unicode dans le nom ? »

Chacun de ces cas devient un test. Chaque test devient une garantie. Plus vous pensez à des cas limites, plus votre logiciel devient robuste. C'est là que le **goût** humain et la **rapidité d'implémentation** de l'IA se combinent pour produire quelque chose qu'aucun des deux ne pourrait atteindre seul.

### TDD en pratique avec l'IA

Voici un flux de travail réel :

```
Vous :   Ajoute une fonction qui vérifie si un nom de fichier est valide.
          Commence par un test qui échoue.

IA :     [Écrit le test] it("rejects empty filenames", () => { ... })
          [Le test échoue — RED ✓]

Vous :   Maintenant fais-le passer.

IA :     [Écrit isValidFilename()]
          [Le test passe — GREEN ✓]

Vous :   Ajoute des tests pour : espaces seulement, séparateurs de chemin,
          noms de plus de 255 caractères, octets nuls.

IA :     [Écrit 4 tests supplémentaires, certains échouent]
          [Met à jour la fonction pour gérer tous les cas]
          [Tous les tests passent — GREEN ✓]

Vous :   Bien. Refactorise si nécessaire.

IA :     [Simplifie la regex, garde les tests passants — REFACTOR ✓]
```

Vous n'avez écrit aucune ligne de code. Mais vous avez piloté chaque décision. Les tests prouvent que le code fonctionne. Et si quelqu'un modifie la fonction plus tard, les tests détectent les régressions.

::: tip Le cliquet de couverture
VMark impose des seuils de couverture des tests — si la couverture tombe en dessous du plancher, le build échoue. Cela signifie que chaque nouvelle fonctionnalité *doit* avoir des tests. L'IA le sait et écrit des tests automatiquement, mais vous devriez vérifier qu'ils testent un comportement significatif, pas seulement des lignes de code.
:::

## Maîtrise du terminal

Les outils de codage IA sont des programmes en ligne de commande. Claude Code, Codex CLI, Gemini CLI — ils s'exécutent tous dans un terminal. Vous n'avez pas besoin de mémoriser des centaines de commandes, mais vous devez être à l'aise avec une poignée :

```bash
cd ~/projects/vmark      # Naviguer vers un répertoire
ls                        # Lister les fichiers
git status                # Voir ce qui a changé
git log --oneline -5      # Commits récents
pnpm install              # Installer les dépendances
pnpm test                 # Exécuter les tests
```

L'IA suggérera et exécutera des commandes pour vous. Votre travail consiste à **lire l'output** et à comprendre si les choses ont réussi ou échoué. Un échec de test est différent d'une erreur de build. Un accès refusé est différent d'un fichier introuvable. Vous n'avez pas besoin de corriger ces choses vous-même — mais vous devez décrire ce que vous voyez pour que l'IA puisse le corriger.

::: tip Par où commencer
Si vous n'avez jamais utilisé de terminal, commencez par [The Missing Semester](https://missing.csail.mit.edu/) du MIT — spécifiquement le premier cours sur les outils shell. Une heure de pratique vous donne suffisamment pour travailler avec des outils de codage IA.
:::

## Maîtrise de l'anglais

Il ne s'agit pas d'écrire une prose parfaite. Il s'agit de **compréhension en lecture** — comprendre les messages d'erreur, la documentation et les explications de l'IA. L'ensemble de l'écosystème logiciel tourne en anglais :[^6]

- **Les messages d'erreur** sont en anglais
- **La documentation** est écrite en anglais en premier (et souvent seulement)
- **Stack Overflow**, les issues GitHub et les tutoriels sont massivement en anglais
- **Les modèles IA fonctionnent mesurement mieux** avec des prompts en anglais (voir [Pourquoi les prompts en anglais donnent de meilleurs résultats](/fr/guide/users-as-developers/prompt-refinement))

Vous n'avez pas besoin d'écrire avec fluidité. Vous devez :

1. **Lire** un message d'erreur et comprendre l'essentiel
2. **Rechercher** des termes techniques efficacement
3. **Décrire** ce que vous voulez à l'IA suffisamment clairement

Si l'anglais n'est pas votre langue maternelle, le hook `::` de VMark traduit et affine vos prompts automatiquement. Mais lire les réponses de l'IA — qui sont en anglais — est quelque chose que vous ferez constamment.

## Goût — La seule chose que l'IA ne peut pas remplacer

C'est le plus difficile à définir et le plus important. **Le goût**, c'est savoir à quoi ressemble quelque chose de bien — même si vous ne pouvez pas encore le construire vous-même.[^7]

Quand l'IA vous propose trois approches pour résoudre un problème, le goût est ce qui vous dit :

- La simple est meilleure que la sophistiquée
- La solution avec moins de dépendances est préférable
- Le code qui se lit comme de la prose est supérieur au code « optimisé »
- Une fonction de 10 lignes est suspecte si 5 lignes suffisent

### Comment développer le goût

1. **Utiliser de bons logiciels** — remarquez ce qui semble juste et ce qui semble maladroit
2. **Lire du bon code** — parcourez des projets open source populaires sur GitHub
3. **Lire l'output** — quand l'IA génère du code, lisez-le même si vous ne pouvez pas l'écrire
4. **Demandez « pourquoi »** — quand l'IA fait un choix, demandez-lui d'expliquer les compromis
5. **Itérer** — si quelque chose semble faux, c'est probablement le cas. Demandez à l'IA de réessayer

Le goût se compose. Plus vous lisez de code (même du code généré par l'IA), meilleurs deviennent vos instincts. Après quelques mois de développement assisté par IA, vous attraperez des problèmes que l'IA rate — non pas parce que vous connaissez plus de syntaxe, mais parce que vous savez à quoi le **résultat devrait ressembler**.

::: tip Le test du goût
Après que l'IA termine une tâche, demandez-vous : « Si j'étais un utilisateur, est-ce que ça me semblerait juste ? » Si la réponse n'est pas un oui immédiat, dites à l'IA ce qui semble faux. Vous n'avez pas besoin de connaître la correction — juste la sensation.
:::

## Ce dont vous n'avez pas besoin

Tout aussi important que de connaître les essentiels, c'est de savoir ce que vous pouvez ignorer en toute sécurité :

| Vous n'avez pas besoin de | Parce que |
|---------------------------|-----------|
| Maîtriser un langage de programmation | L'IA écrit le code ; vous l'examinez |
| L'expertise des frameworks | L'IA connaît React, Rails, Django mieux que la plupart des humains |
| La connaissance des algorithmes | L'IA implémente les algorithmes ; vous décrivez l'objectif |
| Les compétences DevOps | L'IA écrit les configs CI, les Dockerfiles, les scripts de déploiement |
| Les patterns de conception mémorisés | L'IA applique le bon pattern quand vous décrivez le comportement |
| Des années d'expérience | Perspective fraîche + IA > expérience sans IA[^8] |

Cela ne signifie pas que ces compétences sont sans valeur — elles vous rendent plus rapide et plus efficace. Mais elles ne sont plus des **prérequis**. Vous pouvez les apprendre progressivement, sur le tas, avec l'IA qui vous enseigne au fur et à mesure.

## L'effet composé

Ces cinq compétences — Git, TDD, terminal, anglais et goût — ne font pas seulement s'additionner. Elles **se composent**.[^9]

- La sécurité de Git vous permet d'expérimenter librement, ce qui développe plus vite le goût
- TDD vous donne confiance dans l'output de l'IA, donc vous pouvez aller plus vite
- La fluidité du terminal vous permet d'exécuter les tests et les commandes Git sans friction
- La compréhension de l'anglais vous permet de lire les messages d'erreur et la documentation
- Le goût rend vos prompts plus précis, ce qui produit un meilleur code
- Un meilleur code vous donne de meilleurs exemples à apprendre

Après quelques semaines de développement assisté par IA, vous vous retrouverez à comprendre des choses que vous n'avez jamais formellement étudiées. C'est l'effet composé à l'œuvre — et c'est pourquoi ces cinq fondations, et seulement celles-ci, sont vraiment indispensables.

[^1]: Les mouvements « no-code » et « low-code » essaient de supprimer les barrières à la programmation depuis des années. Les outils de codage IA y parviennent plus efficacement car ils ne contraignent pas ce que vous pouvez construire — ils écrivent du code arbitraire dans n'importe quel langage, suivant n'importe quel pattern, basé sur des descriptions en langage naturel. Voir : Jiang, E. et al. (2022). [Discovering the Syntax and Strategies of Natural Language Programming with Generative Language Models](https://dl.acm.org/doi/10.1145/3491102.3501870). *CHI 2022*.

[^2]: Le modèle de branchement de Git change fondamentalement la façon dont les gens abordent l'expérimentation. Des recherches sur les flux de travail des développeurs montrent que les équipes utilisant des commits fréquents et petits avec des branches sont significativement plus susceptibles d'essayer des changements risqués — parce que le coût de l'échec tombe à presque zéro. Voir : Bird, C. et al. (2009). [Does Distributed Development Affect Software Quality?](https://dl.acm.org/doi/10.1145/1555001.1555040). *ICSE 2009*.

[^3]: Le Test-Driven Development a été formalisé par Kent Beck en 2002 et est depuis devenu une pierre angulaire du génie logiciel professionnel. La discipline d'écrire des tests en premier force les développeurs à clarifier les exigences avant l'implémentation — un avantage qui devient encore plus puissant quand le « développeur » est une IA qui a besoin d'instructions précises. Voir : Beck, K. (2002). [Test-Driven Development: By Example](https://www.oreilly.com/library/view/test-driven-development/0321146530/). Addison-Wesley.

[^4]: Les études sur la génération de code IA trouvent systématiquement que le code généré par IA passe les tests fonctionnels à des taux plus faibles que le code humain, sauf s'il est guidé par des cas de test explicites. Fournir des cas de test dans le prompt augmente la génération de code correct de 20–40 %. Voir : Chen, M. et al. (2021). [Evaluating Large Language Models Trained on Code](https://arxiv.org/abs/2107.03374). *arXiv:2107.03374* ; Austin, J. et al. (2021). [Program Synthesis with Large Language Models](https://arxiv.org/abs/2108.07732). *arXiv:2108.07732*.

[^5]: Les modèles IA sous-performent systématiquement sur les cas limites et les conditions aux frontières. Ils ont tendance à générer du code de « happy path » qui gère les entrées communes mais échoue sur les entrées inhabituelles. C'est une limitation documentée de la génération de code basée sur les transformers — les données d'entraînement sont biaisées vers les patterns d'utilisation typiques. Voir : Pearce, H. et al. (2022). [Examining Zero-Shot Vulnerability Repair with Large Language Models](https://arxiv.org/abs/2112.02125). *IEEE S&P 2022*.

[^6]: L'anglais domine la programmation et la documentation technique de façon écrasante. L'analyse des dépôts publics de GitHub montre que plus de 90 % des fichiers README et commentaires de code sont en anglais. De même, les 23 millions de questions de Stack Overflow sont principalement en anglais. Voir : Casalnuovo, C. et al. (2015). [Developer Onboarding in GitHub](https://dl.acm.org/doi/10.1145/2786805.2786854). *ESEC/FSE 2015*.

[^7]: Le « goût » en génie logiciel — la capacité à distinguer un bon design d'un mauvais — est de plus en plus reconnu comme une compétence essentielle. Fred Brooks a écrit que « les grands designs viennent des grands designers », pas des grands processus. Avec l'IA gérant les aspects mécaniques du codage, ce jugement esthétique devient la contribution humaine principale. Voir : Brooks, F. (2010). [The Design of Design](https://www.oreilly.com/library/view/the-design-of/9780321702081/). Addison-Wesley.

[^8]: Des études sur la programmation assistée par IA montrent que les développeurs moins expérimentés bénéficient souvent davantage des outils IA que les experts — parce que l'écart entre « peut décrire » et « peut implémenter » se réduit considérablement avec l'assistance IA. Voir : Peng, S. et al. (2023). [The Impact of AI on Developer Productivity](https://arxiv.org/abs/2302.06590). *arXiv:2302.06590*.

[^9]: Le concept d'« apprentissage composé » — où les compétences fondamentales accélèrent l'acquisition de compétences connexes — est bien établi dans la recherche pédagogique. En programmation spécifiquement, comprendre quelques idées essentielles débloque un apprentissage rapide de tout ce qui est construit dessus. Voir : Sorva, J. (2012). [Visual Program Simulation in Introductory Programming Education](https://aaltodoc.aalto.fi/handle/123456789/3534). Aalto University.
