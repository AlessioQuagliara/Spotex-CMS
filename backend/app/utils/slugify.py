"""
Slug generation utility
"""
import re
import unicodedata


def slugify(text: str) -> str:
    """
    Convert text to URL-safe slug
    
    Args:
        text: Text to convert
        
    Returns:
        URL-safe slug
    """
    # Normalize unicode characters
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Convert to lowercase
    text = text.lower()
    
    # Replace spaces and special characters with hyphens
    text = re.sub(r'[^a-z0-9]+', '-', text)
    
    # Remove leading/trailing hyphens
    text = text.strip('-')
    
    # Remove consecutive hyphens
    text = re.sub(r'-+', '-', text)
    
    return text
