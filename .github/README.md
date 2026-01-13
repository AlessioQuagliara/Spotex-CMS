# GitHub Actions AI Agent - Guida di Utilizzo

## 📋 Panoramica

Questo sistema automatizza i task di sviluppo tramite GitHub Actions e AI Agent. Include:

- **3 Workflow YAML** per automazione
- **4 Istruzioni** dettagliate per il task
- **3 Template** riutilizzabili
- **2 Script** di validazione
- **1 Configurazione** centralizzata

## 🚀 Quick Start

### 1. Visualizzare i Workflow

```bash
# Listare i workflow disponibili
ls -la .github/workflows/

# ai-agent-daily.yml    - Task giornalieri
# ai-agent-feature.yml  - Feature implementation
# ai-agent-review.yml   - Code review
```

### 2. Eseguire Manualmente da GitHub

1. Vai su **Actions** in GitHub
2. Seleziona il workflow
3. Clicca **Run workflow**
4. Scegli il branch e i parametri
5. Esegui

### 3. Eseguire da VS Code

**Con estensione GitHub Actions:**

1. Apri Command Palette: `Ctrl+Shift+P`
2. Digita: `GitHub Actions: Run Workflow`
3. Seleziona il workflow
4. Scegli i parametri
5. Esegui

## 📁 Struttura Directory

```
.github/
├── workflows/              # GitHub Actions workflows
│   ├── ai-agent-daily.yml
│   ├── ai-agent-feature.yml
│   └── ai-agent-review.yml
├── agents/                 # Agent configuration
│   ├── instructions/       # Task instructions (markdown)
│   │   ├── 01-ui-theme-fix.md
│   │   ├── 02-products-crud.md
│   │   ├── 03-storefront.md
│   │   └── 04-settings.md
│   ├── templates/          # Reusable templates
│   │   ├── component.md
│   │   ├── api-endpoint.md
│   │   └── page.md
│   └── config.json         # Agent configuration
├── scripts/                # Automation scripts
│   ├── run-agent.sh
│   └── validate-changes.sh
└── logs/                   # Execution logs
    └── (auto-generated)
```

## 🎯 Workflow Descriptions

### 1. Daily Tasks (ai-agent-daily.yml)

**Trigger:** Ogni giorno alle 09:00 UTC

**Tasks:**
- ✓ Code quality checks (linting)
- ✓ Dependency updates check
- ✓ Security vulnerability scan
- ✓ Performance optimization suggestions

**Output:** Crea una PR automatica con i risultati

**Parametri:** None (schedule-based)

```bash
# Trigger manuale
gh workflow run ai-agent-daily.yml
```

### 2. Feature Implementation (ai-agent-feature.yml)

**Trigger:** Pull request opened/updated

**Tasks:**
- ✓ Esegue istruzioni del feature
- ✓ Runs linting e tests
- ✓ Aggiunge review automatica
- ✓ Commenta sulla PR

**Output:** Review comments sulla PR

**Parametri:**
```
feature: Nome della feature
instruction_file: Path al file di istruzioni
```

```bash
# Trigger manuale
gh workflow run ai-agent-feature.yml \
  -f feature="products-crud" \
  -f instruction_file=".github/agents/instructions/02-products-crud.md"
```

### 3. Code Review (ai-agent-review.yml)

**Trigger:** Pull request created

**Tasks:**
- ✓ Analisi qualità codice
- ✓ Security review
- ✓ Performance check
- ✓ Crea PR review

**Output:** Commento di review dettagliato

```bash
# Trigger manuale
gh workflow run ai-agent-review.yml
```

## 📝 Task Instructions

Ogni instruction file contiene:

- **Obiettivo** - Cosa fare
- **Priorità** - Importanza
- **Checklist** - Passi da seguire
- **File interessati** - Cosa modificare
- **Comandi utili** - Come testare
- **Criteri completamento** - Quando è finito

### Exemplo: 01-ui-theme-fix.md

```markdown
# UI Theme System - Istruzioni Agente AI

## Obiettivo
Completare e validare il sistema di temi...

## Checklist di Completamento
- [ ] Verifica Implementazione
- [ ] Test Funzionalità
...
```

### Usare un'Istruzione

```bash
# 1. Leggi il file
cat .github/agents/instructions/02-products-crud.md

# 2. Segui la checklist
# 3. Esegui i comandi indicati
# 4. Quando finito, commita e crea PR
```

## 🔧 Script di Validazione

### run-agent.sh

Esegue i task specificati:

```bash
# Esegui daily tasks
bash .github/scripts/run-agent.sh daily

# Esegui feature tasks
bash .github/scripts/run-agent.sh feature .github/agents/instructions 02-products-crud.md

# Esegui review tasks
bash .github/scripts/run-agent.sh review
```

**Output:** Log in `.github/logs/agent-run-TIMESTAMP.log`

### validate-changes.sh

Valida le modifiche prima del commit:

```bash
# Valida tutto
bash .github/scripts/validate-changes.sh
```

**Checklist:**
- [ ] TypeScript compilation
- [ ] Linting
- [ ] Tests passing
- [ ] No large files
- [ ] Security checks

**Output:** Log in `.github/logs/validate-TIMESTAMP.log`

## 📚 Template Riutilizzabili

### 1. Component Template

File: `.github/agents/templates/component.md`

Contiene:
- Template base React component
- Compound components pattern
- Testing examples
- Storybook setup

**Usare:**
```bash
cat .github/agents/templates/component.md
# Copia il template
# Modifica con il tuo componente
# Segui la checklist
```

### 2. API Endpoint Template

File: `.github/agents/templates/api-endpoint.md`

Contiene:
- FastAPI endpoint template
- Repository pattern
- Error handling
- Testing examples

### 3. Page Template

File: `.github/agents/templates/page.md`

Contiene:
- Next.js page template
- Forms
- Data fetching
- Error boundaries
- SEO setup

## ⚙️ Configurazione (config.json)

```json
{
  "instructions": {
    "01-ui-theme-fix": {
      "title": "UI Theme System",
      "priority": "high",
      "status": "completed"
    },
    ...
  },
  "workflows": {
    "daily": { ... },
    "feature": { ... },
    "review": { ... }
  },
  "quality_gates": {
    "code_coverage": 80,
    "lint_errors": 0,
    "test_pass_rate": 95
  }
}
```

**Modifica per:**
- Aggiungere nuove istruzioni
- Cambiare priorità
- Configurare notifiche
- Impostare quality gates

## 🔐 Secrets Richiesti

Set in GitHub Settings > Secrets:

```
SLACK_WEBHOOK     # Per notifiche Slack (opzionale)
GITHUB_TOKEN      # Auto-generated (required)
```

## 📊 Monitorare l'Esecuzione

### In GitHub

1. Vai a **Actions**
2. Seleziona il workflow
3. Visualizza i run recenti
4. Clicca su un run per dettagli
5. Vedi logs e outputs

### Localmente

```bash
# Visualizzare i log recenti
tail -f .github/logs/agent-run-*.log

# Cercare un run specifico
ls -lt .github/logs/ | head -5
```

## 🛠️ Troubleshooting

### Workflow non esegue

**Soluzione:**
1. Controlla che il file YAML è valido
2. Verifica i secrets
3. Controlla i permessi del branch
4. Vedi i logs in GitHub

### Script fallisce

**Soluzione:**
```bash
# Run il script localmente
bash .github/scripts/run-agent.sh daily

# Controlla l'output
cat .github/logs/agent-run-*.log
```

### PR non si crea

**Causa possibile:**
- Nessuna modifica
- Errore in validazione
- Permessi insufficienti

**Fix:**
```bash
# Controlla il log
grep -A 5 "error" .github/logs/agent-run-*.log
```

## 💡 Best Practices

### 1. Naming Convention

Usa nomi consistenti per i workflow:
```
ai-agent-[task-type].yml
```

### 2. Instruction Writing

Quando scrivi istruzioni:
- ✓ Sii specifico
- ✓ Includi checklist
- ✓ Dai comandi di test
- ✓ Specifica criteri completamento

### 3. Script Execution

Prima di pushare:
```bash
# Valida localmente
bash .github/scripts/validate-changes.sh

# Se OK, puoi committare
git add .
git commit -m "feat: ..."
git push
```

### 4. PR Reviews

Workflow aggiunge review automatica:
- ✓ Leggibile
- ✓ Constructivo
- ✓ Con suggerimenti

## 📈 Prossimi Passi

1. **Installare estensione VS Code**
   ```
   - GitHub Actions (GitHub)
   - ID: GitHub.vscode-github-actions
   ```

2. **Configurare Slack** (opzionale)
   ```json
   {
     "notifications": {
       "slack": {
         "enabled": true,
         "channel": "#ai-agent"
       }
     }
   }
   ```

3. **Aggiungere nuove istruzioni**
   ```bash
   # Crea nuovo file
   touch .github/agents/instructions/05-my-task.md
   # Aggiungi a config.json
   # Testa il workflow
   ```

4. **Personalizzare quality gates**
   - Modifica `config.json`
   - Aumenta coverage target
   - Aggiungi nuovi controlli

## 📞 Support

**Problemi con i workflow?**
1. Controlla i logs: `.github/logs/`
2. Vedi GitHub Actions UI
3. Leggi la documentazione script

**Modifiche ai template?**
1. Edita il file template in `.github/agents/templates/`
2. Aggiorna la versione in config.json
3. Crea una PR

## 📄 License

Parte del progetto Spotex CMS
Copyright © 2026 Spotex Team

---

**Last Updated:** 2026-01-14
**Version:** 1.0.0
