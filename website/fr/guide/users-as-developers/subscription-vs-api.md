# Abonnement vs facturation API

Les outils de codage IA proposent deux méthodes d'authentification : les **plans d'abonnement** et les **clés API**. Pour les sessions de codage soutenues (vibe coding), les abonnements sont dramatiquement moins chers — souvent 10–30x moins que la facturation API pour le même travail.[^1]

## La différence de coût

Une session de codage active typique utilise des centaines de milliers de tokens par heure. Voici comment les coûts se comparent :

### Claude Code

| Méthode | Coût | Ce que vous obtenez |
|---------|------|---------------------|
| **Claude Max** (abonnement) | 100–200 $/mois | Usage illimité pendant les sessions de codage |
| **Clé API** (`ANTHROPIC_API_KEY`) | 600–2 000 $/mois+ | Paiement par token ; une utilisation intensive s'accumule vite |

**Commande d'authentification :**
```bash
claude          # Connexion automatique avec abonnement Claude Max (recommandé)
```

### Codex CLI (OpenAI)

| Méthode | Coût | Ce que vous obtenez |
|---------|------|---------------------|
| **ChatGPT Plus** (abonnement) | 20 $/mois | Usage modéré |
| **ChatGPT Pro** (abonnement) | 200 $/mois | Usage intensif |
| **Clé API** (`OPENAI_API_KEY`) | 200–1 000 $/mois+ | Paiement par token |

**Commande d'authentification :**
```bash
codex login     # Connexion avec abonnement ChatGPT (recommandé)
```

### Gemini CLI (Google)

| Méthode | Coût | Ce que vous obtenez |
|---------|------|---------------------|
| **Niveau gratuit** | 0 $ | Quota gratuit généreux |
| **Google One AI Premium** | ~20 $/mois | Limites plus élevées |
| **Clé API** (`GEMINI_API_KEY`) | Variable | Paiement par token |

**Commande d'authentification :**
```bash
gemini          # Connexion avec compte Google (recommandé)
```

## Règle générale

> **Abonnement = 10–30x moins cher** pour les sessions de codage soutenues.

Le calcul est simple : un abonnement vous donne un tarif mensuel fixe, tandis que la facturation API facture par token. Les outils de codage IA sont extrêmement gourmands en tokens — ils lisent des fichiers entiers, génèrent de longs blocs de code et itèrent à travers plusieurs rounds de modifications. Une seule fonctionnalité complexe peut consommer des millions de tokens.[^2]

## Quand les clés API ont encore du sens

Les clés API sont le bon choix pour :

| Cas d'usage | Pourquoi |
|-------------|---------|
| **Pipelines CI/CD** | Tâches automatisées qui s'exécutent brièvement et rarement |
| **Usage léger ou occasionnel** | Quelques requêtes par semaine |
| **Accès programmatique** | Scripts et intégrations qui appellent l'API directement |
| **Facturation équipe/org** | Facturation centralisée via les tableaux de bord d'utilisation API |

Pour les sessions de codage interactives — où vous échangez avec l'IA pendant des heures — les abonnements gagnent systématiquement sur le coût.[^3]

## Configuration dans VMark

Le `AGENTS.md` de VMark impose l'authentification prioritaire par abonnement comme convention de projet. Quand vous clonez le dépôt et ouvrez un outil de codage IA, il vous rappelle d'utiliser l'authentification par abonnement :

```
Prefer subscription auth over API keys for all AI coding tools.
```

Les trois outils fonctionnent immédiatement une fois authentifiés :

```bash
# Recommandé : authentification par abonnement
claude              # Claude Code avec Claude Max
codex login         # Codex CLI avec ChatGPT Plus/Pro
gemini              # Gemini CLI avec compte Google

# Alternative : clés API
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AI...
```

::: tip PATH pour les applications macOS GUI
Les applications macOS GUI (comme les terminaux lancés depuis Spotlight) ont un PATH minimal. Si un outil fonctionne dans votre terminal mais que Claude Code ne peut pas le trouver, assurez-vous que l'emplacement du binaire est dans votre profil shell (`~/.zshrc` ou `~/.bashrc`).
:::

[^1]: Une session de codage IA intensive typique consomme 50 000–100 000+ tokens par interaction. Aux tarifs API actuels (par ex. Claude Sonnet à 3 $/15 $ par million de tokens input/output), les gros utilisateurs rapportent des coûts API mensuels de 200–2 000 $+ — tandis que les plans d'abonnement sont plafonnés à 100–200 $/mois pour un usage illimité. La disparité augmente avec l'intensité d'utilisation : les utilisateurs légers peuvent voir des coûts similaires dans les deux cas, mais les sessions de vibe-coding soutenues font des abonnements le choix gagnant évident. Voir : [AI Development Tools Pricing Analysis](https://vladimirsiedykh.com/blog/ai-development-tools-pricing-analysis-claude-copilot-cursor-comparison-2025) (2025) ; [Claude Code Token Limits Guide](https://www.faros.ai/blog/claude-code-token-limits), Faros AI (2025).

[^2]: Les agents de codage IA consomment bien plus de tokens que les simples interactions de chat parce qu'ils lisent des fichiers entiers dans le contexte, génèrent des modifications multi-fichiers, exécutent des boucles itératives de correction-test et maintiennent l'historique de conversation à travers de longues sessions. Une seule implémentation de fonctionnalité complexe peut impliquer des dizaines d'appels d'outils, chacun consommant des milliers de tokens. La fenêtre de contexte elle-même devient un facteur de coût — des fenêtres plus grandes permettent de meilleurs résultats mais multiplient l'utilisation des tokens. Voir : [The Real Cost of Vibe Coding](https://smarterarticles.co.uk/the-real-cost-of-vibe-coding-when-ai-over-delivers-on-your-dime) (2025).

[^3]: Le secteur SaaS au sens large s'est orienté vers des modèles de tarification hybrides combinant des abonnements fixes avec des composantes d'utilisation. D'ici 2023, 46 % des entreprises SaaS avaient adopté une tarification basée sur l'utilisation, et les entreprises qui l'utilisent rapportent une rétention nette en dollars de 137 %. Cependant, pour les outils alimentés par IA où chaque requête consomme un calcul notable, la tarification purement basée sur l'utilisation expose les utilisateurs à des coûts imprévisibles — c'est pourquoi les abonnements à tarif fixe restent attrayants pour les gros utilisateurs individuels. Voir : [The State of SaaS Pricing Strategy](https://www.invespcro.com/blog/saas-pricing/) (2025) ; [The Evolution of Pricing Models for SaaS Companies](https://medium.com/bcgontech/the-evolution-of-pricing-models-for-saas-companies-6d017101d733), BCG (2024).
