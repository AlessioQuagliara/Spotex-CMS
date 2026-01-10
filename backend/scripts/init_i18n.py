"""
Database initialization script for i18n tables
"""
from sqlalchemy.orm import Session
from app.models.i18n import Language, LanguageCode, Direction, CurrencyRate
from datetime import datetime


def init_languages(db: Session):
    """Initialize default languages"""
    languages = [
        Language(
            code=LanguageCode.EN,
            name="English",
            native_name="English",
            direction=Direction.LTR,
            is_default=True,
            is_active=True,
            flag_emoji="🇬🇧"
        ),
        Language(
            code=LanguageCode.IT,
            name="Italian",
            native_name="Italiano",
            direction=Direction.LTR,
            is_default=False,
            is_active=True,
            flag_emoji="🇮🇹"
        ),
        Language(
            code=LanguageCode.ES,
            name="Spanish",
            native_name="Español",
            direction=Direction.LTR,
            is_default=False,
            is_active=True,
            flag_emoji="🇪🇸"
        ),
        Language(
            code=LanguageCode.FR,
            name="French",
            native_name="Français",
            direction=Direction.LTR,
            is_default=False,
            is_active=True,
            flag_emoji="🇫🇷"
        ),
        Language(
            code=LanguageCode.DE,
            name="German",
            native_name="Deutsch",
            direction=Direction.LTR,
            is_default=False,
            is_active=True,
            flag_emoji="🇩🇪"
        ),
        Language(
            code=LanguageCode.PT,
            name="Portuguese",
            native_name="Português",
            direction=Direction.LTR,
            is_default=False,
            is_active=True,
            flag_emoji="🇵🇹"
        ),
        Language(
            code=LanguageCode.AR,
            name="Arabic",
            native_name="العربية",
            direction=Direction.RTL,
            is_default=False,
            is_active=True,
            flag_emoji="🇸🇦"
        ),
        Language(
            code=LanguageCode.HE,
            name="Hebrew",
            native_name="עברית",
            direction=Direction.RTL,
            is_default=False,
            is_active=True,
            flag_emoji="🇮🇱"
        ),
        Language(
            code=LanguageCode.ZH,
            name="Chinese",
            native_name="中文",
            direction=Direction.LTR,
            is_default=False,
            is_active=True,
            flag_emoji="🇨🇳"
        ),
        Language(
            code=LanguageCode.JA,
            name="Japanese",
            native_name="日本語",
            direction=Direction.LTR,
            is_default=False,
            is_active=True,
            flag_emoji="🇯🇵"
        ),
        Language(
            code=LanguageCode.RU,
            name="Russian",
            native_name="Русский",
            direction=Direction.LTR,
            is_default=False,
            is_active=True,
            flag_emoji="🇷🇺"
        ),
    ]
    
    for language in languages:
        existing = db.query(Language).filter(Language.code == language.code).first()
        if not existing:
            db.add(language)
    
    db.commit()
    print("✅ Languages initialized")


def init_currency_rates(db: Session):
    """Initialize default currency rates (base: USD)"""
    rates = [
        CurrencyRate(from_currency="USD", to_currency="USD", rate=1.0, source="manual"),
        CurrencyRate(from_currency="USD", to_currency="EUR", rate=0.92, source="manual"),
        CurrencyRate(from_currency="USD", to_currency="GBP", rate=0.79, source="manual"),
        CurrencyRate(from_currency="USD", to_currency="JPY", rate=149.50, source="manual"),
        CurrencyRate(from_currency="USD", to_currency="CNY", rate=7.24, source="manual"),
        CurrencyRate(from_currency="USD", to_currency="CHF", rate=0.88, source="manual"),
        CurrencyRate(from_currency="USD", to_currency="CAD", rate=1.36, source="manual"),
        CurrencyRate(from_currency="USD", to_currency="AUD", rate=1.52, source="manual"),
        CurrencyRate(from_currency="USD", to_currency="SAR", rate=3.75, source="manual"),
        CurrencyRate(from_currency="USD", to_currency="AED", rate=3.67, source="manual"),
    ]
    
    for rate in rates:
        existing = db.query(CurrencyRate).filter(
            CurrencyRate.from_currency == rate.from_currency,
            CurrencyRate.to_currency == rate.to_currency
        ).first()
        if not existing:
            db.add(rate)
    
    db.commit()
    print("✅ Currency rates initialized")


if __name__ == "__main__":
    from app.database.database import SessionLocal
    
    db = SessionLocal()
    try:
        print("Initializing i18n data...")
        init_languages(db)
        init_currency_rates(db)
        print("✅ All i18n data initialized successfully")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()
