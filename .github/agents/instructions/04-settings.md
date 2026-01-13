# Admin Settings & Configuration - Istruzioni Agente AI

## Obiettivo
Implementare un sistema completo di settings e configurazioni per amministratori del CMS.

## Priorità
🟢 **MEDIA** - Feature di supporto importante

## Fase 1: Backend Settings API

### 1.1 Models & Schemas
- [ ] `Settings` model per store-wide config
- [ ] `UserPreferences` model per user-specific settings
- [ ] Schema validazione con Pydantic
- [ ] Caching con Redis

### 1.2 Settings Categories

#### General Settings
```python
site_name: str
site_url: str
site_description: str
admin_email: str
support_email: str
timezone: str
language: str
```

#### Store Settings
```python
store_name: str
store_currency: str
tax_rate: float
shipping_enabled: bool
free_shipping_threshold: float
```

#### Email Settings
```python
smtp_host: str
smtp_port: int
smtp_user: str
smtp_password: str
from_email: str
reply_to_email: str
```

#### Payment Settings
```python
stripe_key: str
paypal_enabled: bool
payment_methods: List[str]
```

#### Security Settings
```python
require_2fa: bool
password_policy: dict
session_timeout: int
```

### 1.3 API Endpoints
```
GET    /api/v1/admin/settings              - Get all settings
POST   /api/v1/admin/settings              - Update settings
GET    /api/v1/admin/settings/{category}   - Get by category
PUT    /api/v1/admin/settings/{key}        - Update single setting

GET    /api/v1/admin/preferences           - User preferences
POST   /api/v1/admin/preferences           - Update preferences
```

## Fase 2: Frontend Settings Pages

### 2.1 Settings Layout
```
/dashboard/settings/
├── general/                    # Site info
├── store/                      # Store config
├── email/                      # Email SMTP
├── payment/                    # Payment providers
├── security/                   # Security settings
├── team/                       # Users & roles
├── integrations/               # 3rd party integrations
└── advanced/                   # Advanced options
```

### 2.2 General Settings
- [ ] Site name, URL, description
- [ ] Admin email, support email
- [ ] Timezone, language
- [ ] Logo upload
- [ ] Favicon upload

### 2.3 Store Settings
- [ ] Store name
- [ ] Currency
- [ ] Tax rate
- [ ] Shipping methods
- [ ] Shipping zones
- [ ] Business hours

### 2.4 Email Configuration
- [ ] SMTP Host, Port
- [ ] Email credentials
- [ ] From address
- [ ] Email templates
- [ ] Test email button

### 2.5 Payment Integration
- [ ] Stripe API keys
- [ ] PayPal configuration
- [ ] Payment methods toggle
- [ ] Transaction fees
- [ ] Refund policy

### 2.6 Security Settings
- [ ] Password policy
- [ ] 2FA requirement
- [ ] Session timeout
- [ ] IP whitelist
- [ ] API rate limiting
- [ ] Backup schedule

## Fase 3: Components

### 3.1 Settings Components
```
components/settings/
├── SettingsLayout.tsx           # Sidebar + main
├── SettingSection.tsx           # Form section
├── SettingInput.tsx             # Input field
├── SettingSelect.tsx            # Dropdown
├── SettingToggle.tsx            # Toggle switch
├── SettingSave.tsx              # Save button
└── SettingNotification.tsx      # Success/error
```

### 3.2 Form Components
- [ ] Text input con validation
- [ ] Number input con min/max
- [ ] Password input con strength indicator
- [ ] Select dropdown
- [ ] Toggle switches
- [ ] File upload
- [ ] Color picker
- [ ] Textarea con markdown preview

### 3.3 Tables
- [ ] Payment methods table
- [ ] Email templates table
- [ ] API keys management
- [ ] User roles/permissions

## Fase 4: Hooks & State Management

### 4.1 Hooks
```typescript
// In hooks/use-settings.ts
useSettings(category?: string)
useUpdateSettings(key: string)
usePreferences()
useUpdatePreference(key: string)
```

### 4.2 Form Management
- [ ] useSettingsForm() - Form state
- [ ] useSettingsValidation() - Validation
- [ ] useSettingsMutation() - API calls
- [ ] useSettingsCache() - Caching

## File da Creare

### Backend
```
backend/app/models/settings.py
backend/app/schemas/settings.py
backend/app/repositories/settings.py
backend/app/api/v1/endpoints/settings.py
backend/tests/test_settings.py
```

### Frontend
```
frontend/admin/app/dashboard/settings/
├── layout.tsx
├── page.tsx
├── general/page.tsx
├── store/page.tsx
├── email/page.tsx
├── payment/page.tsx
├── security/page.tsx
└── team/page.tsx

frontend/admin/components/settings/
├── SettingsLayout.tsx
├── SettingSection.tsx
├── SettingForm.tsx
└── SettingsTable.tsx

frontend/admin/hooks/
├── use-settings.ts
├── use-preferences.ts
└── use-settings-form.ts
```

## Database Schema

```sql
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE,
  value JSONB,
  category VARCHAR(50),
  encrypted BOOLEAN DEFAULT false,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  theme VARCHAR(20),
  language VARCHAR(10),
  notifications_email BOOLEAN,
  preferences JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Criteri di Completamento

✅ Task completato quando:
1. Settings CRUD API funziona
2. Tutte le categorie sono configurabili
3. Settings si salvano in database
4. Cache è invalidato su update
5. Frontend mostra tutte le opzioni
6. Form validation funziona
7. Error handling è robusto
8. Email test funziona
9. Settings exported/imported (backup)
10. Tests passano 80%+

## Testing

```bash
# Backend API test
curl -X GET http://localhost:8000/api/v1/admin/settings \
  -H "Authorization: Bearer $TOKEN"

# Frontend test
npm run test -- settings

# E2E
npm run cypress -- run --spec='cypress/e2e/settings.cy.ts'
```

## Security Considerations

- ⚠️ Non loggare sensitive keys (password, API keys)
- ⚠️ Encryptare sensitive settings nel database
- ⚠️ Validare input lato server
- ⚠️ Rate limit settings updates
- ⚠️ Audit log per config changes

## Performance Tips

- Cachare settings in Redis
- Invalidare cache su update
- Lazy load settings pages
- Batch settings updates
- Compress large JSON configs

## Prossimi Passi

1. Definire schema database
2. Creare backend models/schemas
3. Implementare CRUD API
4. Creare frontend layout
5. Implementare form components
6. Aggiungere validation
7. Integrare API calls
8. Aggiungere tests
9. Documentare settings
10. Aggiungere audit logging

---

**Created:** 2026-01-14
**Priority:** Medium
**Estimated Time:** 12-16 hours
**Status:** Not Started
**Dependencies:** [Basic API setup]
