"""
File validation utilities
"""
import magic
from pathlib import Path
from typing import Optional
from app.core.config import settings


def validate_file_type(file_path: Path, allowed_types: Optional[list] = None) -> bool:
    """
    Validate file type using python-magic
    
    Args:
        file_path: Path to file
        allowed_types: List of allowed MIME types
        
    Returns:
        True if valid, False otherwise
    """
    if not file_path.exists():
        return False
    
    try:
        mime = magic.from_file(str(file_path), mime=True)
        
        if allowed_types:
            return mime in allowed_types
        
        return True
    except:
        return False


def get_file_mime_type(file_path: Path) -> Optional[str]:
    """
    Get file MIME type
    
    Args:
        file_path: Path to file
        
    Returns:
        MIME type or None
    """
    try:
        return magic.from_file(str(file_path), mime=True)
    except:
        return None
