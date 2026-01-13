# UI Theme System - Istruzioni Agente AI

## Obiettivo
Completare e validare il sistema di temi Dark/Light Mode implementato in Next.js per il dashboard admin.

## Priorità
🔴 **ALTA** - Componente fondamentale per l'esperienza utente

## Checklist di Completamento

### 1. Verifica Implementazione
- [ ] `providers/theme-provider.tsx` esiste e funziona
- [ ] `components/theme-toggle.tsx` è integrato nell'header
- [ ] `app/globals.css` contiene le variabili CSS per entrambi i temi
- [ ] `app/layout.tsx` include il ThemeProvider
- [ ] Tailwind è configurato con `darkMode: ['class']`

### 2. Test Funzionalità
```bash
# Verificare che il toggle del tema funziona
- Accedi a http://localhost:3000/dashboard
- Clicca il pulsante Sun/Moon nell'header
- Verifica che il tema cambia istantaneamente
- Ricarica la pagina e verifica che il tema è persistente
```

### 3. Validazione Accessibilità
- [ ] WCAG AA compliance: rapporto di contrasto minimo 4.5:1
- [ ] Testo leggibile in entrambe le modalità
- [ ] Icone visibili e comprensibili
- [ ] Nessun problema di flash/scintillio al caricamento
- [ ] Supporto per preferenze di sistema (prefers-color-scheme)

### 4. Test Componenti shadcn/ui
Verificare che tutti questi componenti supportano il tema:
- [ ] Button (tutte le varianti)
- [ ] Card
- [ ] Badge
- [ ] Input/Textarea
- [ ] Select
- [ ] Dropdown Menu
- [ ] Dialog
- [ ] Table

### 5. Cross-browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### 6. Performance
- [ ] Nessuno scintillio (flash) di colori
- [ ] Transizioni fluide
- [ ] Nessun layout shift
- [ ] Tempi di caricamento accettabili

## Comandi di Test

```bash
# Test locale
npm run dev

# Build
npm run build

# Linting
npm run lint

# Test components
npm run test
```

## File Interessati
- `frontend/admin/providers/theme-provider.tsx`
- `frontend/admin/components/theme-toggle.tsx`
- `frontend/admin/app/globals.css`
- `frontend/admin/app/layout.tsx`
- `frontend/admin/tailwind.config.ts`
- `frontend/admin/app/theme-test/page.tsx`

## Criteri di Completamento
✅ Task completato quando:
1. Tutte le verifiche della checklist sono spunte
2. Non ci sono errori di console
3. Tema è persistente tra reload
4. WCAG AA compliance è garantito
5. Dashboard è completamente visibile e usabile

## Note Importanti
- Le variabili CSS DEVONO usare il formato HSL, non HEX
- Tutti i colori sono già ottimizzati per WCAG AA
- Il ThemeProvider DEVE essere al top del layout
- Use `suppressHydrationWarning` su `<html>` tag

## Comandi Utili

### Verificare colori nel CSS
```bash
grep -E "^\\s*--" frontend/admin/app/globals.css | head -20
```

### Verificare che theme-provider è importato
```bash
grep -r "ThemeProvider" frontend/admin/app/layout.tsx
```

### Testare il toggle manualmente
```bash
# Accedi alla pagina di test
http://localhost:3000/theme-test
```

## Prossimi Passi (Opzionali)
- [ ] Aggiungere animazioni di transizione
- [ ] Creare preset di temi aggiuntivi
- [ ] Implementare user-specific theme preference in DB
- [ ] Aggiungere theme picker nel settings

---

**Created:** 2026-01-14
**Last Updated:** 2026-01-14
**Status:** In Progress
