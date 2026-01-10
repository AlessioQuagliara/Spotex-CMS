from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import Optional, List
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate
from .base import BaseRepository

class CategoryRepository(BaseRepository[Category, CategoryCreate, CategoryUpdate]):
    def __init__(self):
        super().__init__(Category)
    
    async def get_by_slug(self, db: AsyncSession, slug: str) -> Optional[Category]:
        result = await db.execute(select(self.model).filter(self.model.slug == slug))
        return result.scalar_one_or_none()
    
    async def get_tree(self, db: AsyncSession) -> List[Category]:
        # Ottieni tutte le categorie
        result = await db.execute(select(self.model))
        all_categories = result.scalars().all()
        
        # Crea un dizionario per accesso rapido
        categories_dict = {cat.id: cat for cat in all_categories}
        
        # Costruisci relazioni parent-child
        for cat in all_categories:
            cat._subcategories = []
        
        for cat in all_categories:
            if cat.parent_id and cat.parent_id in categories_dict:
                categories_dict[cat.parent_id]._subcategories.append(cat)
        
        # Filtra solo le root categories
        root_categories = [cat for cat in all_categories if cat.parent_id is None]
        
        # Funzione ricorsiva per costruire l'albero
        def build_tree(category):
            return {
                "id": category.id,
                "name": category.name,
                "slug": category.slug,
                "description": category.description,
                "subcategories": [
                    build_tree(sub) for sub in category._subcategories
                ]
            }
        
        return [build_tree(cat) for cat in root_categories]