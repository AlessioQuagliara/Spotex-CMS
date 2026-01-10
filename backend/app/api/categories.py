from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.database import get_db
from app.repositories.category import CategoryRepository
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse, CategoryTree

router = APIRouter()
repo = CategoryRepository()

@router.get("/", response_model=List[CategoryResponse])
async def read_categories(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    return await repo.get_multi(db, skip=skip, limit=limit)

@router.get("/tree", response_model=List[CategoryTree])
async def read_category_tree(db: AsyncSession = Depends(get_db)):
    return await repo.get_tree(db)

@router.get("/{category_id}", response_model=CategoryResponse)
async def read_category(category_id: int, db: AsyncSession = Depends(get_db)):
    category = await repo.get(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category

@router.get("/slug/{slug}", response_model=CategoryResponse)
async def read_category_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    category = await repo.get_by_slug(db, slug)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(category: CategoryCreate, db: AsyncSession = Depends(get_db)):
    # Check unique name and slug
    existing_category = await repo.get_by_slug(db, slug=category.slug)
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slug already exists"
        )
    
    # Check parent exists if provided
    if category.parent_id:
        parent = await repo.get(db, category.parent_id)
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent category not found"
            )
    
    return await repo.create(db, obj_in=category)

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category: CategoryUpdate,
    db: AsyncSession = Depends(get_db)
):
    db_category = await repo.get(db, category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Check unique slug if updating
    if category.slug:
        existing_category = await repo.get_by_slug(db, slug=category.slug)
        if existing_category and existing_category.id != category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slug already exists"
            )
    
    # Check parent exists and prevent circular reference
    if category.parent_id:
        if category.parent_id == category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category cannot be its own parent"
            )
        
        parent = await repo.get(db, category.parent_id)
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent category not found"
            )
    
    return await repo.update(db, db_obj=db_category, obj_in=category)

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)):
    category = await repo.get(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    await repo.delete(db, category_id)
    return None