# 🤖 GitHub Copilot Integration - Setup Guide

Questa guida semplifica l'uso di GitHub Copilot nei workflow Actions per automatizzare task di sviluppo.

---

## 🔑 1. Setup GitHub PAT (Personal Access Token)

### Crea il Token

1. Vai su GitHub: **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Clicca **"Generate new token (classic)"**
3. Configurazione:
   - **Note:** `Copilot Actions Token`
   - **Expiration:** 90 days (o custom)
   - **Scopes richiesti:**
     - ✅ `repo` (full access)
     - ✅ `workflow`
     - ✅ `read:org`

4. Genera e **copia il token** (inizia con `github_pat_`)

### Aggiungi ai Secrets

1. Vai nel tuo repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Clicca **"New repository secret"**
4. Configurazione:
   - **Name:** `COPILOT_TOKEN`
   - **Secret:** Incolla il tuo token
5. Salva

---

## 📦 2. Workflows Disponibili

### ✅ Daily Analysis (copilot-daily.yml)

**Trigger:** Giornaliero (09:00 UTC) o manuale

**Cosa fa:**
- Legge instruction file (es. `01-ui-theme-fix.md`)
- Analizza con Copilot API
- Verifica checklist di completamento
- Crea PR con risultati

**Esecuzione manuale:**
```bash
# GitHub CLI
gh workflow run copilot-daily.yml

# VS Code: Command Palette → GitHub Actions: Run Workflow
```

---

### 🚀 Feature Generator (copilot-feature.yml)

**Trigger:** Manuale (con parametri)

**Cosa fa:**
- Legge instruction file specificato
- Carica templates (component, API, page)
- Genera codice completo con Copilot
- Crea PR con codice generato

**Parametri:**
- `instruction_file`: Nome file (es. `02-products-crud.md`)
- `create_files`: Se creare file automaticamente (default: false)

**Esecuzione:**
```bash
# GitHub CLI
gh workflow run copilot-feature.yml \
  -f instruction_file="02-products-crud.md" \
  -f create_files=false

# GitHub Web UI: Actions → Copilot AI - Feature Generator → Run workflow
```

**Output:**
- File `generated-<feature-name>.md` con codice
- PR con codice completo da revieware

---

### 🔍 Code Review (copilot-review.yml)

**Trigger:** Automatico su PR (opened/synchronize)

**Cosa fa:**
- Analizza file modificati nella PR
- Review automatica con Copilot:
  - Security issues
  - Performance problems
  - Best practices
  - Testing coverage
- Posta comment sulla PR
- Aggiunge labels

**Non richiede esecuzione manuale** - si attiva automaticamente.

---

## 🎯 3. Come Usare

### Scenario 1: Validazione Daily

```bash
# 1. Il workflow parte alle 09:00 UTC ogni giorno
# 2. Oppure esegui manualmente:
gh workflow run copilot-daily.yml

# 3. Controlla la PR creata
gh pr list --label "copilot-ai,daily-analysis"
```

### Scenario 2: Genera Feature Completa

```bash
# 1. Hai un instruction file: .github/agents/instructions/02-products-crud.md
# 2. Esegui il workflow:
gh workflow run copilot-feature.yml \
  -f instruction_file="02-products-crud.md"

# 3. Aspetta 2-5 minuti
# 4. Trova la PR:
gh pr list --label "copilot-ai,feature"

# 5. Review il codice generato
gh pr view <numero-pr>
gh pr checkout <numero-pr>
```

### Scenario 3: Review Automatica PR

```bash
# 1. Crei una PR normale:
git checkout -b my-feature
# ... fai modifiche ...
git push origin my-feature
gh pr create

# 2. Il workflow copilot-review.yml parte automaticamente
# 3. Dopo 1-2 minuti vedrai un comment sulla PR con la review
```

---

## 📝 4. Instruction Files

I file in `.github/agents/instructions/` guidano Copilot:

### Struttura Instruction File

```markdown
# Title: Nome Feature

**Priority:** HIGH/MEDIUM/LOW
**Status:** Not Started / In Progress / Completed
**Estimated Time:** X hours

## Description
Descrizione dettagliata della feature...

## Checklist
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Technical Details
- Backend: FastAPI + SQLAlchemy
- Frontend: Next.js + React
- Database: PostgreSQL

## Files to Create
1. `backend/app/models/product.py`
2. `frontend/admin/app/products/page.tsx`
...

## Success Criteria
- All tests passing
- WCAG AA compliant
- Performance: < 2s load time
```

### Instruction Files Disponibili

| File | Feature | Priority | Status | Time |
|------|---------|----------|--------|------|
| `01-ui-theme-fix.md` | Theme system validation | HIGH | ✅ Complete | 2h |
| `02-products-crud.md` | E-commerce products | MEDIUM-HIGH | ⏳ Not Started | 20h |
| `03-storefront.md` | Public storefront | MEDIUM | ⏳ Not Started | 24h |
| `04-settings.md` | Admin settings | MEDIUM | ⏳ Not Started | 14h |

---

## 🛠️ 5. Templates

Templates in `.github/agents/templates/` forniscono pattern di codice:

### component.md
- React component base
- Styled component (CVA)
- Compound component
- Testing examples
- Best practices

### api-endpoint.md
- FastAPI CRUD endpoint
- Pydantic schemas
- Repository pattern
- Error handling
- Testing examples

### page.md
- Next.js page structure
- Form with validation
- Table with pagination
- SEO metadata
- Error boundary

---

## 🔧 6. Troubleshooting

### Errore: "COPILOT_TOKEN not found"

**Soluzione:**
```bash
# Verifica il secret
gh secret list

# Se non c'è, aggiungilo:
gh secret set COPILOT_TOKEN
# Incolla il token quando richiesto
```

### Errore: "API request failed"

**Cause possibili:**
1. Token scaduto → Rigenera
2. Token senza permessi → Verifica scopes
3. Rate limit → Aspetta 1 ora

**Soluzione:**
```bash
# Test token
curl -H "Authorization: Bearer $COPILOT_TOKEN" \
  https://api.github.com/user

# Dovrebbe restituire i tuoi dati utente
```

### Workflow non si avvia

**Verifica:**
```bash
# 1. Workflow syntax
gh workflow list

# 2. Esecuzione
gh workflow view copilot-feature.yml

# 3. Logs
gh run list --workflow=copilot-feature.yml
gh run view <run-id> --log
```

### Codice generato non completo

**Soluzione:**
- Aumenta `max_tokens` nel workflow (attualmente 4000)
- Semplifica l'instruction file
- Dividi feature in sub-tasks

---

## 📊 7. Monitoring

### Vedere i workflow in esecuzione

```bash
# Lista workflow runs
gh run list --limit 10

# Dettagli run specifico
gh run view <run-id>

# Logs in realtime
gh run watch <run-id>
```

### Vedere PR create

```bash
# PR create da Copilot
gh pr list --label "copilot-ai"

# Daily analysis
gh pr list --label "daily-analysis"

# Feature generation
gh pr list --label "feature"
```

---

## ⚙️ 8. Customization

### Modificare schedule daily

Modifica `.github/workflows/copilot-daily.yml`:

```yaml
on:
  schedule:
    - cron: '0 14 * * *'  # 14:00 UTC invece di 09:00
```

### Aggiungere nuova instruction

1. Crea file: `.github/agents/instructions/05-my-feature.md`
2. Usa template esistente come riferimento
3. Esegui workflow:
   ```bash
   gh workflow run copilot-feature.yml \
     -f instruction_file="05-my-feature.md"
   ```

### Modificare prompt Copilot

Modifica il messaggio `system` o `user` nei workflow:

```javascript
{
  role: 'system',
  content: 'Il tuo custom system prompt qui...'
}
```

---

## 🎓 9. Best Practices

### ✅ DO

- Usa instruction files dettagliati
- Rivedi sempre il codice generato
- Testa localmente prima del merge
- Mantieni token sicuri (mai commit)
- Limita file da revieware (max 20)

### ❌ DON'T

- Non fare commit del token
- Non usare `create_files=true` senza review
- Non mergare codice non testato
- Non superare rate limits API
- Non ignorare security warnings

---

## 📚 10. Risorse

### GitHub Copilot API
- [API Reference](https://docs.github.com/en/rest/copilot)
- [Rate Limits](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)

### GitHub Actions
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Script](https://github.com/actions/github-script)

### VS Code Extension
- [GitHub Actions Extension](https://marketplace.visualstudio.com/items?itemName=GitHub.vscode-github-actions)

---

## 🚀 Quick Start Checklist

- [ ] Token PAT creato con scopes corretti
- [ ] Secret `COPILOT_TOKEN` aggiunto al repository
- [ ] VS Code extension "GitHub Actions" installata
- [ ] Test workflow manuale: `gh workflow run copilot-daily.yml`
- [ ] Verifica PR creata: `gh pr list --label "copilot-ai"`
- [ ] Review codice generato
- [ ] Push modifiche se necessario

---

**Ultima modifica:** 14 Gennaio 2026  
**Versione:** 1.0.0  
**Status:** ✅ Production Ready
