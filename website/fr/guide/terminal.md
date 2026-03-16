# Terminal intégré

VMark inclut un panneau de terminal intégré pour exécuter des commandes sans quitter l'éditeur.

Appuyez sur `` Ctrl + ` `` pour basculer le panneau de terminal.

## Sessions

Le terminal prend en charge jusqu'à 5 sessions simultanées, chacune avec son propre processus shell. Une barre d'onglets verticale sur le côté droit affiche les onglets de session numérotés.

| Action | Comment |
|--------|---------|
| Nouvelle session | Cliquez sur le bouton **+** |
| Changer de session | Cliquez sur un numéro d'onglet |
| Fermer une session | Cliquez sur l'icône corbeille |
| Redémarrer le shell | Cliquez sur l'icône de redémarrage |

Lorsque vous fermez la dernière session, le panneau se masque mais la session reste active — rouvrez avec `` Ctrl + ` `` et vous reprenez là où vous en étiez. Si un processus shell se termine, appuyez sur n'importe quelle touche pour le redémarrer.

## Raccourcis clavier

Ces raccourcis fonctionnent lorsque le panneau de terminal est mis au point :

| Action | Raccourci |
|--------|----------|
| Copier | `Mod + C` (avec sélection) |
| Coller | `Mod + V` |
| Effacer | `Mod + K` |
| Rechercher | `Mod + F` |
| Basculer le terminal | `` Ctrl + ` `` |

::: tip
`Mod + C` sans sélection de texte envoie SIGINT au processus en cours d'exécution — identique à appuyer sur Ctrl+C dans un terminal ordinaire.
:::

## Recherche

Appuyez sur `Mod + F` pour ouvrir la barre de recherche. Tapez pour effectuer une recherche incrémentale dans le tampon du terminal.

| Action | Raccourci |
|--------|----------|
| Occurrence suivante | `Entrée` |
| Occurrence précédente | `Shift + Entrée` |
| Fermer la recherche | `Échap` |

## Menu contextuel

Clic droit à l'intérieur du terminal pour accéder :

- **Copier** — copier le texte sélectionné (désactivé lorsque rien n'est sélectionné)
- **Coller** — coller depuis le presse-papiers dans le shell
- **Tout sélectionner** — sélectionner l'intégralité du tampon du terminal
- **Effacer** — effacer la sortie visible

## Liens cliquables

Le terminal détecte deux types de liens dans la sortie des commandes :

- **URL web** — cliquez pour ouvrir dans votre navigateur par défaut
- **Chemins de fichiers** — cliquez pour ouvrir le fichier dans l'éditeur (prend en charge les suffixes `:ligne:col` et les chemins relatifs résolus par rapport à la racine de l'espace de travail)

## Environnement shell

VMark définit ces variables d'environnement dans chaque session de terminal :

| Variable | Valeur |
|----------|--------|
| `TERM_PROGRAM` | `vmark` |
| `EDITOR` | `vmark` |
| `VMARK_WORKSPACE` | Chemin racine de l'espace de travail (lorsqu'un dossier est ouvert) |
| `PATH` | PATH complet du shell de connexion (identique à votre terminal système) |

Le terminal intégré hérite du `PATH` de votre shell de connexion, de sorte que les outils CLI comme `node`, `claude` et d'autres binaires installés par l'utilisateur sont accessibles — tout comme dans une fenêtre de terminal ordinaire.

Le shell est lu depuis `$SHELL` (revient à `/bin/sh`). Le répertoire de travail commence à la racine de l'espace de travail, ou au répertoire parent du fichier actif, ou `$HOME`.

Les raccourcis shell standard comme `Ctrl+R` (recherche d'historique inversée dans zsh/bash) fonctionnent lorsque le terminal est mis au point — ils ne sont pas interceptés par l'éditeur.

Lorsque vous ouvrez un espace de travail ou un fichier alors que le terminal est déjà en cours d'exécution, toutes les sessions effectuent automatiquement `cd` vers la nouvelle racine de l'espace de travail.

## Paramètres

Ouvrez **Paramètres → Terminal** pour configurer :

| Paramètre | Plage | Par défaut |
|-----------|-------|------------|
| Taille de police | 10 – 24 px | 13 px |
| Interligne | 1.0 – 2.0 | 1.2 |
| Copier à la sélection | Activé / Désactivé | Désactivé |

Les modifications s'appliquent immédiatement à toutes les sessions ouvertes.

## Persistance

La visibilité du panneau de terminal et sa hauteur sont sauvegardées et restaurées lors des redémarrages à chaud. Les processus shell eux-mêmes ne peuvent pas être préservés — un nouveau shell est lancé pour chaque session au redémarrage.
