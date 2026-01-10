"""
Product management service for admin operations
"""
import csv
import io
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, update, delete
from decimal import Decimal

from app.models.product import Product, ProductVariant, InventoryTransaction
from app.models.category import Category


class ProductBulkService:
    """Service for bulk product operations"""
    
    @staticmethod
    async def bulk_update_prices(
        db: AsyncSession,
        store_id: int,
        product_ids: List[int],
        adjustment_type: str,
        adjustment_value: Decimal,
        apply_to_compare_price: bool = False
    ) -> Dict[str, Any]:
        """Bulk update product prices"""
        result = await db.execute(
            select(Product).where(
                Product.id.in_(product_ids),
                Product.store_id == store_id
            )
        )
        products = result.scalars().all()
        
        success = 0
        failed = 0
        errors = []
        
        for product in products:
            try:
                if adjustment_type == 'percentage':
                    # Apply percentage adjustment
                    multiplier = 1 + (float(adjustment_value) / 100)
                    product.price = float(Decimal(str(product.price)) * Decimal(str(multiplier)))
                    
                    if apply_to_compare_price and product.compare_price:
                        product.compare_price = float(Decimal(str(product.compare_price)) * Decimal(str(multiplier)))
                
                elif adjustment_type == 'fixed':
                    # Add/subtract fixed amount
                    product.price = float(Decimal(str(product.price)) + adjustment_value)
                    
                    if apply_to_compare_price and product.compare_price:
                        product.compare_price = float(Decimal(str(product.compare_price)) + adjustment_value)
                
                elif adjustment_type == 'set':
                    # Set absolute price
                    product.price = float(adjustment_value)
                
                # Ensure price is positive
                if product.price <= 0:
                    raise ValueError("Price cannot be zero or negative")
                
                success += 1
            except Exception as e:
                failed += 1
                errors.append({
                    'product_id': product.id,
                    'product_name': product.name,
                    'error': str(e)
                })
        
        await db.commit()
        
        return {
            'success': success,
            'failed': failed,
            'total': len(product_ids),
            'errors': errors
        }
    
    @staticmethod
    async def bulk_update_category(
        db: AsyncSession,
        store_id: int,
        product_ids: List[int],
        category_id: int
    ) -> Dict[str, Any]:
        """Bulk update product category"""
        # Verify category exists
        category_result = await db.execute(
            select(Category).where(Category.id == category_id)
        )
        category = category_result.scalar_one_or_none()
        
        if not category:
            return {
                'success': 0,
                'failed': len(product_ids),
                'total': len(product_ids),
                'errors': [{'error': 'Category not found'}]
            }
        
        result = await db.execute(
            update(Product)
            .where(
                Product.id.in_(product_ids),
                Product.store_id == store_id
            )
            .values(category_id=category_id)
        )
        
        await db.commit()
        
        return {
            'success': result.rowcount,
            'failed': 0,
            'total': len(product_ids),
            'errors': []
        }
    
    @staticmethod
    async def bulk_update_tags(
        db: AsyncSession,
        store_id: int,
        product_ids: List[int],
        tags: List[str],
        action: str
    ) -> Dict[str, Any]:
        """Bulk update product tags"""
        result = await db.execute(
            select(Product).where(
                Product.id.in_(product_ids),
                Product.store_id == store_id
            )
        )
        products = result.scalars().all()
        
        success = 0
        
        for product in products:
            current_tags = product.tags or []
            
            if action == 'add':
                # Add tags without duplicates
                new_tags = list(set(current_tags + tags))
                product.tags = new_tags
            
            elif action == 'remove':
                # Remove specified tags
                new_tags = [tag for tag in current_tags if tag not in tags]
                product.tags = new_tags
            
            elif action == 'replace':
                # Replace all tags
                product.tags = tags
            
            success += 1
        
        await db.commit()
        
        return {
            'success': success,
            'failed': 0,
            'total': len(product_ids),
            'errors': []
        }
    
    @staticmethod
    async def bulk_update_status(
        db: AsyncSession,
        store_id: int,
        product_ids: List[int],
        is_active: bool,
        is_featured: Optional[bool] = None
    ) -> Dict[str, Any]:
        """Bulk update product status"""
        values = {'is_active': is_active}
        
        if is_featured is not None:
            values['is_featured'] = is_featured
        
        result = await db.execute(
            update(Product)
            .where(
                Product.id.in_(product_ids),
                Product.store_id == store_id
            )
            .values(**values)
        )
        
        await db.commit()
        
        return {
            'success': result.rowcount,
            'failed': 0,
            'total': len(product_ids),
            'errors': []
        }
    
    @staticmethod
    async def bulk_delete_products(
        db: AsyncSession,
        store_id: int,
        product_ids: List[int],
        permanent: bool = False
    ) -> Dict[str, Any]:
        """Bulk delete products"""
        if permanent:
            # Permanent delete
            result = await db.execute(
                delete(Product).where(
                    Product.id.in_(product_ids),
                    Product.store_id == store_id
                )
            )
        else:
            # Soft delete (deactivate)
            result = await db.execute(
                update(Product)
                .where(
                    Product.id.in_(product_ids),
                    Product.store_id == store_id
                )
                .values(is_active=False)
            )
        
        await db.commit()
        
        return {
            'success': result.rowcount,
            'failed': 0,
            'total': len(product_ids),
            'errors': []
        }


class ProductImportExportService:
    """Service for product import/export CSV"""
    
    @staticmethod
    async def import_products(
        db: AsyncSession,
        store_id: int,
        products: List[Dict[str, Any]],
        update_existing: bool = True,
        create_categories: bool = True
    ) -> Dict[str, Any]:
        """Import products from CSV data"""
        imported = 0
        updated = 0
        failed = 0
        errors = []
        
        for idx, product_data in enumerate(products):
            try:
                sku = product_data.get('sku')
                
                # Check if product exists
                result = await db.execute(
                    select(Product).where(
                        Product.sku == sku,
                        Product.store_id == store_id
                    )
                )
                existing_product = result.scalar_one_or_none()
                
                # Handle category
                category_id = None
                category_name = product_data.get('category')
                
                if category_name:
                    category_result = await db.execute(
                        select(Category).where(Category.name == category_name)
                    )
                    category = category_result.scalar_one_or_none()
                    
                    if not category and create_categories:
                        # Create category
                        category = Category(
                            name=category_name,
                            slug=category_name.lower().replace(' ', '-')
                        )
                        db.add(category)
                        await db.flush()
                    
                    if category:
                        category_id = category.id
                
                # Parse tags
                tags = []
                if product_data.get('tags'):
                    tags = [tag.strip() for tag in product_data['tags'].split(',')]
                
                if existing_product and update_existing:
                    # Update existing product
                    existing_product.name = product_data['name']
                    existing_product.description = product_data.get('description')
                    existing_product.price = float(product_data['price'])
                    existing_product.compare_price = float(product_data['compare_price']) if product_data.get('compare_price') else None
                    existing_product.cost_price = float(product_data['cost_price']) if product_data.get('cost_price') else None
                    existing_product.stock_quantity = int(product_data.get('stock_quantity', 0))
                    existing_product.track_inventory = product_data.get('track_inventory', True)
                    existing_product.low_stock_threshold = int(product_data.get('low_stock_threshold', 10))
                    existing_product.category_id = category_id
                    existing_product.tags = tags
                    existing_product.is_active = product_data.get('is_active', True)
                    existing_product.is_featured = product_data.get('is_featured', False)
                    existing_product.weight = float(product_data['weight']) if product_data.get('weight') else None
                    existing_product.meta_title = product_data.get('meta_title')
                    existing_product.meta_description = product_data.get('meta_description')
                    
                    updated += 1
                
                elif not existing_product:
                    # Create new product
                    new_product = Product(
                        store_id=store_id,
                        sku=sku,
                        name=product_data['name'],
                        description=product_data.get('description'),
                        price=float(product_data['price']),
                        compare_price=float(product_data['compare_price']) if product_data.get('compare_price') else None,
                        cost_price=float(product_data['cost_price']) if product_data.get('cost_price') else None,
                        stock_quantity=int(product_data.get('stock_quantity', 0)),
                        track_inventory=product_data.get('track_inventory', True),
                        low_stock_threshold=int(product_data.get('low_stock_threshold', 10)),
                        category_id=category_id,
                        tags=tags,
                        is_active=product_data.get('is_active', True),
                        is_featured=product_data.get('is_featured', False),
                        weight=float(product_data['weight']) if product_data.get('weight') else None,
                        meta_title=product_data.get('meta_title'),
                        meta_description=product_data.get('meta_description')
                    )
                    db.add(new_product)
                    imported += 1
                
                else:
                    # Skip if exists and update not allowed
                    continue
            
            except Exception as e:
                failed += 1
                errors.append({
                    'row': idx + 1,
                    'sku': product_data.get('sku', 'N/A'),
                    'error': str(e)
                })
        
        await db.commit()
        
        return {
            'total_rows': len(products),
            'imported': imported,
            'updated': updated,
            'failed': failed,
            'errors': errors
        }
    
    @staticmethod
    async def export_products_to_csv(
        db: AsyncSession,
        store_id: int,
        product_ids: Optional[List[int]] = None,
        category_id: Optional[int] = None,
        is_active: Optional[bool] = None
    ) -> str:
        """Export products to CSV string"""
        # Build query
        filters = [Product.store_id == store_id]
        
        if product_ids:
            filters.append(Product.id.in_(product_ids))
        
        if category_id:
            filters.append(Product.category_id == category_id)
        
        if is_active is not None:
            filters.append(Product.is_active == is_active)
        
        result = await db.execute(
            select(Product, Category.name.label('category_name'))
            .outerjoin(Category, Category.id == Product.category_id)
            .where(and_(*filters))
            .order_by(Product.id)
        )
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'sku', 'name', 'description', 'category', 'price', 'compare_price',
            'cost_price', 'stock_quantity', 'track_inventory', 'low_stock_threshold',
            'tags', 'is_active', 'is_featured', 'weight', 'meta_title', 'meta_description'
        ])
        
        # Write data
        for product, category_name in result.fetchall():
            writer.writerow([
                product.sku or '',
                product.name,
                product.description or '',
                category_name or '',
                product.price,
                product.compare_price or '',
                product.cost_price or '',
                product.stock_quantity,
                product.track_inventory,
                product.low_stock_threshold,
                ','.join(product.tags) if product.tags else '',
                product.is_active,
                product.is_featured,
                product.weight or '',
                product.meta_title or '',
                product.meta_description or ''
            ])
        
        return output.getvalue()
    
    @staticmethod
    def parse_csv_file(csv_content: str) -> List[Dict[str, Any]]:
        """Parse CSV content to list of dicts"""
        input_file = io.StringIO(csv_content)
        reader = csv.DictReader(input_file)
        
        products = []
        for row in reader:
            # Convert string booleans
            row['track_inventory'] = row.get('track_inventory', 'true').lower() == 'true'
            row['is_active'] = row.get('is_active', 'true').lower() == 'true'
            row['is_featured'] = row.get('is_featured', 'false').lower() == 'true'
            
            products.append(row)
        
        return products


class ProductImageService:
    """Service for product image management"""
    
    @staticmethod
    async def update_product_images(
        db: AsyncSession,
        product_id: int,
        images: List[Dict[str, Any]],
        action: str
    ) -> Dict[str, Any]:
        """Update product images"""
        result = await db.execute(
            select(Product).where(Product.id == product_id)
        )
        product = result.scalar_one_or_none()
        
        if not product:
            return {'error': 'Product not found'}
        
        current_images = product.images or []
        
        if action == 'add':
            # Add new images
            current_images.extend(images)
        
        elif action == 'remove':
            # Remove images by URL
            urls_to_remove = [img['url'] for img in images]
            current_images = [img for img in current_images if img['url'] not in urls_to_remove]
        
        elif action == 'replace':
            # Replace all images
            current_images = images
        
        elif action == 'reorder':
            # Reorder images based on position
            current_images = sorted(images, key=lambda x: x.get('position', 0))
        
        product.images = current_images
        await db.commit()
        
        return {'success': True, 'images_count': len(current_images)}
