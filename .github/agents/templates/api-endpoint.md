# API Endpoint Template - Guida Agente AI

## Linee Guida Generali

Quando crei endpoint API:
- **RESTful:** Segui convenzioni REST
- **Consistent:** Consistenza nella risposta
- **Documented:** Docstrings complete
- **Validated:** Input/output validation
- **Secure:** Autenticazione e autorizzazione
- **Performant:** Query optimization

## Template Base Endpoint

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.dependencies import get_db, get_current_active_user
from app.models import User
from app.schemas.item import ItemSchema, ItemCreateSchema, ItemUpdateSchema
from app.repositories.item import ItemRepository

router = APIRouter(prefix="/items", tags=["items"])

# ============================================================================
# GET ENDPOINTS
# ============================================================================

@router.get("", response_model=List[ItemSchema])
async def list_items(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> List[ItemSchema]:
    """
    List all items with pagination.
    
    - **skip**: Number of items to skip (default: 0)
    - **limit**: Maximum items to return (default: 10, max: 100)
    
    Returns: List of items
    """
    if limit > 100:
        limit = 100
    
    repo = ItemRepository(db)
    items = await repo.list(skip=skip, limit=limit)
    return items


@router.get("/{item_id}", response_model=ItemSchema)
async def get_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ItemSchema:
    """
    Get a specific item by ID.
    
    - **item_id**: Item identifier
    
    Returns: Item details
    
    Raises:
    - 404: Item not found
    """
    repo = ItemRepository(db)
    item = await repo.get(item_id)
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {item_id} not found"
        )
    
    return item

# ============================================================================
# POST ENDPOINTS
# ============================================================================

@router.post("", response_model=ItemSchema, status_code=status.HTTP_201_CREATED)
async def create_item(
    item_data: ItemCreateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ItemSchema:
    """
    Create a new item.
    
    Request body:
    - **name**: Item name (required)
    - **description**: Item description
    - **price**: Item price (required)
    
    Returns: Created item with ID
    
    Raises:
    - 400: Invalid input data
    - 409: Item already exists
    """
    repo = ItemRepository(db)
    
    # Check if item already exists
    existing = await repo.get_by_name(item_data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Item '{item_data.name}' already exists"
        )
    
    item = await repo.create(item_data)
    return item

# ============================================================================
# PUT/PATCH ENDPOINTS
# ============================================================================

@router.put("/{item_id}", response_model=ItemSchema)
async def update_item(
    item_id: int,
    item_data: ItemUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> ItemSchema:
    """
    Update an existing item (full replacement).
    
    - **item_id**: Item identifier
    
    Request body: Item fields to update
    
    Returns: Updated item
    
    Raises:
    - 404: Item not found
    - 400: Invalid input data
    """
    repo = ItemRepository(db)
    
    item = await repo.get(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {item_id} not found"
        )
    
    updated_item = await repo.update(item_id, item_data)
    return updated_item

# ============================================================================
# DELETE ENDPOINTS
# ============================================================================

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> None:
    """
    Delete an item (soft delete).
    
    - **item_id**: Item identifier
    
    Returns: No content
    
    Raises:
    - 404: Item not found
    - 403: Insufficient permissions
    """
    repo = ItemRepository(db)
    
    item = await repo.get(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item {item_id} not found"
        )
    
    # Check permissions
    if item.owner_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete this item"
        )
    
    await repo.delete(item_id)
```

## Template Schemi Pydantic

```python
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class ItemBase(BaseModel):
    """Base schema with common fields"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    price: float = Field(..., gt=0)


class ItemCreateSchema(ItemBase):
    """Schema for creating items"""
    pass


class ItemUpdateSchema(BaseModel):
    """Schema for updating items - all fields optional"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    price: Optional[float] = Field(None, gt=0)
    
    model_config = ConfigDict(extra='forbid')


class ItemSchema(ItemBase):
    """Schema for responses"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "Example Item",
                "description": "A sample item",
                "price": 99.99,
                "created_at": "2024-01-14T10:00:00",
                "updated_at": "2024-01-14T10:00:00",
            }
        }
    )
```

## Template Repository Pattern

```python
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import Item
from app.schemas.item import ItemCreateSchema, ItemUpdateSchema


class ItemRepository:
    """Repository for Item CRUD operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def list(self, skip: int = 0, limit: int = 10) -> List[Item]:
        """List items with pagination"""
        query = select(Item).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get(self, item_id: int) -> Optional[Item]:
        """Get item by ID"""
        query = select(Item).where(Item.id == item_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_name(self, name: str) -> Optional[Item]:
        """Get item by name"""
        query = select(Item).where(Item.name == name)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def create(self, item_data: ItemCreateSchema) -> Item:
        """Create new item"""
        item = Item(**item_data.model_dump())
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item
    
    async def update(self, item_id: int, item_data: ItemUpdateSchema) -> Item:
        """Update existing item"""
        item = await self.get(item_id)
        if not item:
            return None
        
        update_data = item_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)
        
        await self.db.commit()
        await self.db.refresh(item)
        return item
    
    async def delete(self, item_id: int) -> bool:
        """Delete item (soft delete)"""
        item = await self.get(item_id)
        if not item:
            return False
        
        # Soft delete
        item.is_deleted = True
        await self.db.commit()
        return True
```

## Error Handling Pattern

```python
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError

try:
    item = await repo.create(item_data)
except IntegrityError as e:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="Item with this name already exists"
    ) from e
except Exception as e:
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="An unexpected error occurred"
    ) from e
```

## Testing Template

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_items(client: AsyncClient, user_token: str):
    """Test listing items"""
    response = await client.get(
        "/api/v1/items",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_create_item(client: AsyncClient, user_token: str):
    """Test creating item"""
    response = await client.post(
        "/api/v1/items",
        json={"name": "Test", "price": 99.99},
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test"


@pytest.mark.asyncio
async def test_get_nonexistent_item(client: AsyncClient, user_token: str):
    """Test 404 error"""
    response = await client.get(
        "/api/v1/items/999",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert response.status_code == 404
```

## HTTP Methods Summary

| Method | Purpose | Idempotent | Status |
|--------|---------|-----------|--------|
| GET | Retrieve | Yes | 200 |
| POST | Create | No | 201 |
| PUT | Update/Replace | Yes | 200 |
| PATCH | Partial update | No | 200 |
| DELETE | Remove | Yes | 204 |

## Status Codes Common

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 500 | Server Error |

## Checklist Endpoint

- [ ] Endpoint funziona (test manual)
- [ ] Input validation completo
- [ ] Error handling robusto
- [ ] Authentication/Authorization
- [ ] Docstrings complete
- [ ] Tests scritti (80%+ coverage)
- [ ] Logging appropriato
- [ ] Performance ottimale
- [ ] Rate limiting se necessario
- [ ] API documentation updated

---

**Last Updated:** 2026-01-14
**For:** Agente AI - API Endpoint Creation
