"""
Translation export utility
Export all translations to JSON files for frontend
"""
from sqlalchemy.orm import Session
from app.models.i18n import Translation, Language
import json
import os
from collections import defaultdict


def export_translations(db: Session, output_dir: str = "./frontend/admin/public/locales"):
    """Export all translations to JSON files organized by language and namespace"""
    
    # Create output directory if not exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Get all active languages
    languages = db.query(Language).filter(Language.is_active == True).all()
    
    for language in languages:
        lang_code = language.code.value
        lang_dir = os.path.join(output_dir, lang_code)
        os.makedirs(lang_dir, exist_ok=True)
        
        # Get translations for this language
        translations = db.query(Translation).filter(
            Translation.language_code == lang_code
        ).all()
        
        # Group by namespace
        by_namespace = defaultdict(dict)
        for translation in translations:
            by_namespace[translation.namespace][translation.key] = translation.value
        
        # Write to files
        for namespace, trans_dict in by_namespace.items():
            file_path = os.path.join(lang_dir, f"{namespace}.json")
            
            # Convert flat keys to nested structure
            nested = {}
            for key, value in trans_dict.items():
                parts = key.split('.')
                current = nested
                for part in parts[:-1]:
                    if part not in current:
                        current[part] = {}
                    current = current[part]
                current[parts[-1]] = value
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(nested, f, ensure_ascii=False, indent=2)
            
            print(f"✅ Exported {lang_code}/{namespace}.json ({len(trans_dict)} keys)")
    
    print(f"✅ All translations exported to {output_dir}")


if __name__ == "__main__":
    from app.database.database import SessionLocal
    
    db = SessionLocal()
    try:
        export_translations(db)
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()
