# Suscripción vs Precios de API

Las herramientas de codificación con IA ofrecen dos métodos de autenticación: **planes de suscripción** y **claves API**. Para sesiones de codificación sostenidas (vibe coding), las suscripciones son dramáticamente más baratas — a menudo de 10 a 30 veces menos que la facturación por API para el mismo trabajo.[^1]

## La Diferencia de Coste

Una sesión de codificación activa típica usa cientos de miles de tokens por hora. Así es como se comparan los costes:

### Claude Code

| Método | Coste | Qué Obtienes |
|--------|------|-------------|
| **Claude Max** (suscripción) | $100–200/mes | Uso ilimitado durante sesiones de codificación |
| **Clave API** (`ANTHROPIC_API_KEY`) | $600–2.000+/mes | Pago por token; el uso intensivo se acumula rápido |

**Comando de autenticación:**
```bash
claude          # Inicio de sesión automático con suscripción Claude Max (recomendado)
```

### Codex CLI (OpenAI)

| Método | Coste | Qué Obtienes |
|--------|------|-------------|
| **ChatGPT Plus** (suscripción) | $20/mes | Uso moderado |
| **ChatGPT Pro** (suscripción) | $200/mes | Uso intensivo |
| **Clave API** (`OPENAI_API_KEY`) | $200–1.000+/mes | Pago por token |

**Comando de autenticación:**
```bash
codex login     # Iniciar sesión con suscripción ChatGPT (recomendado)
```

### Gemini CLI (Google)

| Método | Coste | Qué Obtienes |
|--------|------|-------------|
| **Nivel gratuito** | $0 | Cuota gratuita generosa |
| **Google One AI Premium** | ~$20/mes | Límites más altos |
| **Clave API** (`GEMINI_API_KEY`) | Variable | Pago por token |

**Comando de autenticación:**
```bash
gemini          # Iniciar sesión con cuenta de Google (recomendado)
```

## Regla General

> **Suscripción = 10–30 veces más barata** para sesiones de codificación sostenidas.

La matemática es simple: una suscripción te da una tarifa mensual fija, mientras que la facturación por API cobra por token. Las herramientas de codificación con IA consumen muchos tokens — leen archivos enteros, generan bloques de código largos e iteran a través de múltiples rondas de ediciones. Una sola función compleja puede consumir millones de tokens.[^2]

## Cuándo las Claves API Siguen Teniendo Sentido

Las claves API son la opción correcta para:

| Caso de Uso | Por Qué |
|----------|-----|
| **Pipelines de CI/CD** | Trabajos automatizados que se ejecutan brevemente y con poca frecuencia |
| **Uso ligero u ocasional** | Unas pocas consultas por semana |
| **Acceso programático** | Scripts e integraciones que llaman a la API directamente |
| **Facturación de equipo/organización** | Facturación centralizada a través de paneles de uso de API |

Para sesiones de codificación interactivas — donde estás yendo y viniendo con la IA durante horas — las suscripciones ganan en coste siempre.[^3]

## Configuración en VMark

`AGENTS.md` de VMark aplica la autenticación con suscripción primero como una convención del proyecto. Cuando clonas el repositorio y abres una herramienta de codificación con IA, te recuerda que uses la autenticación por suscripción:

```
Prefer subscription auth over API keys for all AI coding tools.
```

Las tres herramientas funcionan desde el primer momento una vez autenticadas:

```bash
# Recomendado: autenticación por suscripción
claude              # Claude Code con Claude Max
codex login         # Codex CLI con ChatGPT Plus/Pro
gemini              # Gemini CLI con cuenta de Google

# Alternativa: claves API
export ANTHROPIC_API_KEY=sk-...
export OPENAI_API_KEY=sk-...
export GEMINI_API_KEY=AI...
```

::: tip PATH para Aplicaciones GUI de macOS
Las aplicaciones GUI de macOS (como los terminales lanzados desde Spotlight) tienen un PATH mínimo. Si una herramienta funciona en tu terminal pero Claude Code no puede encontrarla, asegúrate de que la ubicación del binario esté en tu perfil de shell (`~/.zshrc` o `~/.bashrc`).
:::

[^1]: Una sesión de codificación con IA intensiva típica consume más de 50.000–100.000 tokens por interacción. A las tarifas actuales de API (por ejemplo, Claude Sonnet a $3/$15 por millón de tokens de entrada/salida), los usuarios intensivos reportan costes mensuales de API de $200–$2.000+ — mientras que los planes de suscripción tienen un tope de $100–$200/mes para uso ilimitado. La disparidad crece con la intensidad de uso: los usuarios ligeros pueden ver costes similares de cualquier manera, pero las sesiones de vibe coding sostenidas hacen que las suscripciones sean el claro ganador. Ver: [AI Development Tools Pricing Analysis](https://vladimirsiedykh.com/blog/ai-development-tools-pricing-analysis-claude-copilot-cursor-comparison-2025) (2025); [Claude Code Token Limits Guide](https://www.faros.ai/blog/claude-code-token-limits), Faros AI (2025).

[^2]: Los agentes de codificación con IA consumen muchos más tokens que las interacciones de chat simples porque leen archivos completos en el contexto, generan ediciones de múltiples archivos, ejecutan bucles iterativos de corrección-prueba y mantienen el historial de conversación a lo largo de sesiones largas. Una sola implementación de función compleja puede involucrar docenas de llamadas a herramientas, cada una consumiendo miles de tokens. La ventana de contexto en sí se convierte en un factor de coste — las ventanas más grandes permiten mejores resultados pero multiplican el uso de tokens. Ver: [The Real Cost of Vibe Coding](https://smarterarticles.co.uk/the-real-cost-of-vibe-coding-when-ai-over-delivers-on-your-dime) (2025).

[^3]: La industria SaaS más amplia se ha estado moviendo hacia modelos de precios híbridos que combinan suscripciones fijas con componentes basados en el uso. Para 2023, el 46% de las empresas SaaS habían adoptado precios basados en el uso, y las empresas que lo usan reportan una retención neta en dólares del 137%. Sin embargo, para las herramientas impulsadas por IA donde cada consulta consume cómputo notable, los precios puramente basados en el uso exponen a los usuarios a costes impredecibles — razón por la cual las suscripciones de tarifa fija siguen siendo atractivas para los usuarios individuales intensivos. Ver: [The State of SaaS Pricing Strategy](https://www.invespcro.com/blog/saas-pricing/) (2025); [The Evolution of Pricing Models for SaaS Companies](https://medium.com/bcgontech/the-evolution-of-pricing-models-for-saas-companies-6d017101d733), BCG (2024).
