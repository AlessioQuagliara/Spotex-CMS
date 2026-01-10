"""
Internationalization API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from decimal import Decimal
import requests

from app.database.database import get_db
from app.models.i18n import Language, PostTranslation, CategoryTranslation, PageTranslation, Translation, CurrencyRate
from app.schemas.i18n import (
    LanguageCreate, LanguageUpdate, Language as LanguageSchema, LanguageList,
    PostTranslationCreate, PostTranslationUpdate, PostTranslation as PostTranslationSchema,
    CategoryTranslationCreate, CategoryTranslation as CategoryTranslationSchema,
    PageTranslationCreate, PageTranslation as PageTranslationSchema,
    TranslationCreate, TranslationUpdate, Translation as TranslationSchema, TranslationImport,
    CurrencyRateCreate, CurrencyRateUpdate, CurrencyRate as CurrencyRateSchema,
    CurrencyConversion
)
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/i18n", tags=["Internationalization"])


# Languages
@router.get("/languages", response_model=LanguageList)
def list_languages(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = False,
    db: Session = Depends(get_db)
):
    """List all languages"""
    query = db.query(Language)
    
    if active_only:
        query = query.filter(Language.is_active == True)
    
    total = query.count()
    languages = query.offset(skip).limit(limit).all()
    
    return {
        "items": languages,
        "total": total,
        "page": skip // limit + 1 if limit else 1,
        "limit": limit
    }


@router.post("/languages", response_model=LanguageSchema, status_code=201)
def create_language(
    language: LanguageCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Create new language"""
    # Check if language code already exists
    existing = db.query(Language).filter(Language.code == language.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Language code already exists")
    
    # If setting as default, unset other defaults
    if language.is_default:
        db.query(Language).update({"is_default": False})
    
    db_language = Language(**language.dict())
    db.add(db_language)
    db.commit()
    db.refresh(db_language)
    
    return db_language


@router.get("/languages/{code}", response_model=LanguageSchema)
def get_language(code: str, db: Session = Depends(get_db)):
    """Get language by code"""
    language = db.query(Language).filter(Language.code == code).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    return language


@router.put("/languages/{code}", response_model=LanguageSchema)
def update_language(
    code: str,
    language_update: LanguageUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Update language"""
    language = db.query(Language).filter(Language.code == code).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    # If setting as default, unset other defaults
    if language_update.is_default:
        db.query(Language).filter(Language.code != code).update({"is_default": False})
    
    for field, value in language_update.dict(exclude_unset=True).items():
        setattr(language, field, value)
    
    db.commit()
    db.refresh(language)
    
    return language


@router.delete("/languages/{code}", status_code=204)
def delete_language(
    code: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Delete language"""
    language = db.query(Language).filter(Language.code == code).first()
    if not language:
        raise HTTPException(status_code=404, detail="Language not found")
    
    if language.is_default:
        raise HTTPException(status_code=400, detail="Cannot delete default language")
    
    db.delete(language)
    db.commit()
    
    return None


# Post Translations
@router.get("/posts/{post_id}/translations", response_model=List[PostTranslationSchema])
def list_post_translations(post_id: int, db: Session = Depends(get_db)):
    """List all translations for a post"""
    translations = db.query(PostTranslation).filter(PostTranslation.post_id == post_id).all()
    return translations


@router.post("/posts/{post_id}/translations", response_model=PostTranslationSchema, status_code=201)
def create_post_translation(
    post_id: int,
    translation: PostTranslationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create post translation"""
    # Check if translation already exists
    existing = db.query(PostTranslation).filter(
        PostTranslation.post_id == post_id,
        PostTranslation.language_code == translation.language_code
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Translation already exists for this language")
    
    translation.post_id = post_id
    db_translation = PostTranslation(**translation.dict())
    db.add(db_translation)
    db.commit()
    db.refresh(db_translation)
    
    return db_translation


@router.get("/posts/{post_id}/translations/{lang}", response_model=PostTranslationSchema)
def get_post_translation(post_id: int, lang: str, db: Session = Depends(get_db)):
    """Get post translation by language"""
    translation = db.query(PostTranslation).filter(
        PostTranslation.post_id == post_id,
        PostTranslation.language_code == lang
    ).first()
    
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    
    return translation


@router.put("/posts/{post_id}/translations/{lang}", response_model=PostTranslationSchema)
def update_post_translation(
    post_id: int,
    lang: str,
    translation_update: PostTranslationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update post translation"""
    translation = db.query(PostTranslation).filter(
        PostTranslation.post_id == post_id,
        PostTranslation.language_code == lang
    ).first()
    
    if not translation:
        raise HTTPException(status_code=404, detail="Translation not found")
    
    for field, value in translation_update.dict(exclude_unset=True).items():
        setattr(translation, field, value)
    
    db.commit()
    db.refresh(translation)
    
    return translation


# UI Translations
@router.get("/translations", response_model=List[TranslationSchema])
def list_translations(
    language_code: Optional[str] = None,
    namespace: str = "common",
    db: Session = Depends(get_db)
):
    """List UI translations"""
    query = db.query(Translation).filter(Translation.namespace == namespace)
    
    if language_code:
        query = query.filter(Translation.language_code == language_code)
    
    return query.all()


@router.get("/translations/export")
def export_translations(
    language_code: str,
    namespace: str = "common",
    db: Session = Depends(get_db)
):
    """Export translations as JSON"""
    translations = db.query(Translation).filter(
        Translation.language_code == language_code,
        Translation.namespace == namespace
    ).all()
    
    return {
        "language": language_code,
        "namespace": namespace,
        "translations": {t.key: t.value for t in translations}
    }


@router.post("/translations/import", status_code=201)
def import_translations(
    data: TranslationImport,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Bulk import translations"""
    imported = 0
    updated = 0
    
    for key, value in data.translations.items():
        existing = db.query(Translation).filter(
            Translation.key == key,
            Translation.language_code == data.language_code,
            Translation.namespace == data.namespace
        ).first()
        
        if existing:
            existing.value = value
            updated += 1
        else:
            translation = Translation(
                key=key,
                language_code=data.language_code,
                value=value,
                namespace=data.namespace
            )
            db.add(translation)
            imported += 1
    
    db.commit()
    
    return {
        "imported": imported,
        "updated": updated,
        "total": imported + updated
    }


# Currency
@router.get("/currency/rates", response_model=List[CurrencyRateSchema])
def list_currency_rates(
    from_currency: Optional[str] = None,
    to_currency: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List currency rates"""
    query = db.query(CurrencyRate)
    
    if from_currency:
        query = query.filter(CurrencyRate.from_currency == from_currency)
    if to_currency:
        query = query.filter(CurrencyRate.to_currency == to_currency)
    
    return query.all()


@router.post("/currency/rates", response_model=CurrencyRateSchema, status_code=201)
def create_currency_rate(
    rate: CurrencyRateCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Create or update currency rate"""
    existing = db.query(CurrencyRate).filter(
        CurrencyRate.from_currency == rate.from_currency,
        CurrencyRate.to_currency == rate.to_currency
    ).first()
    
    if existing:
        existing.rate = rate.rate
        existing.source = rate.source
        db.commit()
        db.refresh(existing)
        return existing
    
    db_rate = CurrencyRate(**rate.dict())
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    
    return db_rate


@router.post("/currency/convert", response_model=CurrencyConversion)
def convert_currency(conversion: CurrencyConversion, db: Session = Depends(get_db)):
    """Convert currency"""
    if conversion.from_currency == conversion.to_currency:
        conversion.converted_amount = conversion.amount
        conversion.rate = "1.0"
        return conversion
    
    # Try to get rate from database
    rate_record = db.query(CurrencyRate).filter(
        CurrencyRate.from_currency == conversion.from_currency,
        CurrencyRate.to_currency == conversion.to_currency
    ).first()
    
    if rate_record:
        rate = Decimal(rate_record.rate)
        conversion.rate = str(rate)
        conversion.converted_amount = float(Decimal(str(conversion.amount)) * rate)
        return conversion
    
    # Fallback: try to fetch from external API (example: exchangerate-api.com)
    try:
        response = requests.get(
            f"https://api.exchangerate-api.com/v4/latest/{conversion.from_currency}",
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            if conversion.to_currency in data.get("rates", {}):
                rate = Decimal(str(data["rates"][conversion.to_currency]))
                conversion.rate = str(rate)
                conversion.converted_amount = float(Decimal(str(conversion.amount)) * rate)
                
                # Save to database for future use
                db_rate = CurrencyRate(
                    from_currency=conversion.from_currency,
                    to_currency=conversion.to_currency,
                    rate=str(rate),
                    source="exchangerate-api"
                )
                db.add(db_rate)
                db.commit()
                
                return conversion
    except Exception:
        pass
    
    raise HTTPException(status_code=400, detail="Currency conversion rate not available")


@router.post("/currency/sync-rates", status_code=200)
def sync_currency_rates(
    base_currency: str = "USD",
    db: Session = Depends(get_db),
    current_user = Depends(require_admin)
):
    """Sync currency rates from external API"""
    try:
        response = requests.get(
            f"https://api.exchangerate-api.com/v4/latest/{base_currency}",
            timeout=10
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to fetch rates")
        
        data = response.json()
        rates = data.get("rates", {})
        
        synced = 0
        for currency, rate in rates.items():
            existing = db.query(CurrencyRate).filter(
                CurrencyRate.from_currency == base_currency,
                CurrencyRate.to_currency == currency
            ).first()
            
            if existing:
                existing.rate = str(rate)
                existing.source = "exchangerate-api"
            else:
                db_rate = CurrencyRate(
                    from_currency=base_currency,
                    to_currency=currency,
                    rate=str(rate),
                    source="exchangerate-api"
                )
                db.add(db_rate)
            
            synced += 1
        
        db.commit()
        
        return {
            "synced": synced,
            "base_currency": base_currency,
            "timestamp": data.get("time_last_updated")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync rates: {str(e)}")
