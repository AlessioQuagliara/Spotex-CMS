# E-Commerce Products CRUD - Istruzioni Agente AI

## Obiettivo
Implementare il sistema completo di CRUD (Create, Read, Update, Delete) per prodotti e-commerce nel backend e frontend.

## Priorità
🟠 **MEDIA-ALTA** - Componente essenziale per e-commerce

## Fase 1: Backend Setup

### 1.1 Modelli e Database
- [ ] Riabilitare `backend/app/models/product.py`
- [ ] Risolvere dipendenze FK con Store model
- [ ] Migrare schema con Alembic
- [ ] Validare relazioni many-to-many

### 1.2 Schema Pydantic
```python
# Copia template da templates/api-endpoint.md
- [ ] ProductSchema base
- [ ] ProductCreateSchema
- [ ] ProductUpdateSchema
- [ ] ProductListSchema con pagination
```

### 1.3 Repository Pattern
- [ ] Implementare ProductRepository in `repositories/product.py`
- [ ] Metodi: list, get, create, update, delete
- [ ] Aggiungere filtri: by_category, by_price, by_status
- [ ] Implementare soft delete

### 1.4 API Endpoints
```
POST   /api/v1/products                 - Create
GET    /api/v1/products                 - List (con pagination)
GET    /api/v1/products/{id}            - Get one
PUT    /api/v1/products/{id}            - Update
DELETE /api/v1/products/{id}            - Delete
GET    /api/v1/products/category/{cat}  - Filter by category
```

## Fase 2: Frontend Implementation

### 2.1 Product Management Pages
- [ ] `/dashboard/products` - List with table
- [ ] `/dashboard/products/new` - Create form
- [ ] `/dashboard/products/{id}` - Edit form
- [ ] `/dashboard/products/{id}/preview` - Preview

### 2.2 Components
- [ ] ProductTable con sorting/filtering
- [ ] ProductForm con validation
- [ ] ProductPreview
- [ ] ImageUpload component

### 2.3 Hooks
- [ ] `useProducts()` - Fetch products
- [ ] `useProduct(id)` - Fetch single
- [ ] `useCreateProduct()` - Create mutation
- [ ] `useUpdateProduct(id)` - Update mutation
- [ ] `useDeleteProduct(id)` - Delete mutation

### 2.4 Forms
- [ ] Basic info (name, description, price)
- [ ] Stock management (quantity, SKU)
- [ ] Categories assignment
- [ ] Media upload (images, gallery)
- [ ] SEO settings

## Fase 3: Testing

### 3.1 Backend Tests
```bash
pytest backend/tests/test_products.py -v
```
- [ ] CRUD operations
- [ ] Permission checks
- [ ] Validation
- [ ] Error handling

### 3.2 Frontend Tests
```bash
npm run test -- products
```
- [ ] Component rendering
- [ ] Form submission
- [ ] API calls
- [ ] Error states

### 3.3 Integration
- [ ] End-to-end create product
- [ ] Edit and verify changes
- [ ] Delete and verify removal
- [ ] Filter and search works

## File da Creare/Modificare

### Backend
```
backend/app/models/product.py (re-enable from .bak)
backend/app/schemas/product.py (create/update)
backend/app/repositories/product.py
backend/app/api/v1/endpoints/products.py
backend/tests/test_products.py
```

### Frontend
```
frontend/admin/app/dashboard/products/page.tsx
frontend/admin/app/dashboard/products/new/page.tsx
frontend/admin/app/dashboard/products/[id]/page.tsx
frontend/admin/components/products/product-table.tsx
frontend/admin/components/products/product-form.tsx
frontend/admin/hooks/use-products.ts
```

## Comandi Chiave

```bash
# Backend
cd backend
python -c "from app.models import Product; print(Product.__table__.columns.keys())"
pytest tests/test_products.py -v

# Frontend
npm run test -- products
npm run lint -- components/products
```

## Criteri di Completamento

✅ Task completato quando:
1. Tutti i CRUD endpoints funzionano
2. Frontend forms validano input
3. Immagini si caricano e visualizzano
4. Pagination funziona
5. Filtri e ricerca funzionano
6. Tests passano al 90%+
7. Nessun errore in console

## Note Importanti

- **Attenzione:** Disabilitare product.py è stato un workaround temporaneo
- **Priority:** Risolvere dipendenze FK prima di riabilitare
- **FK Problem:** Store model non esiste - creare o rimuovere la dipendenza
- **Migration:** Usare Alembic per migrazioni database

## Troubleshooting

### Se product.py import fallisce
```bash
# Controlla la dipendenza
grep -n "store_id" backend/app/models/product.py
# Commenta o crea Store model
```

### Se API ritorna 404
```bash
# Verifica endpoint registrato
grep -r "products" backend/app/api/v1/
```

### Se frontend non vede dati
```bash
# Verifica API URL in .env
cat frontend/admin/.env.local | grep API_URL
```

## Prossimi Passi
1. Risolvere Store model dependency
2. Creare migrazioni database
3. Implementare backend CRUD
4. Implementare frontend components
5. Aggiungere tests
6. Documentare API

---

**Created:** 2026-01-14
**Priority:** Medium-High
**Estimated Time:** 16-20 hours
**Status:** Not Started
