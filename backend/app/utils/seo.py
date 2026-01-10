"""
SEO utility functions
"""
from typing import Optional, Dict, Any
import re
from html import unescape
from datetime import datetime


def clean_text_for_meta(text: str, max_length: int = 160) -> str:
    """
    Clean text for meta description
    Remove HTML tags, limit length, add ellipsis
    """
    if not text:
        return ""
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Unescape HTML entities
    text = unescape(text)
    
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text)
    
    # Trim
    text = text.strip()
    
    # Limit length
    if len(text) > max_length:
        text = text[:max_length].rsplit(' ', 1)[0] + '...'
    
    return text


def generate_meta_title(title: str, site_name: str = "CMS", separator: str = "|") -> str:
    """
    Generate formatted meta title with site name
    """
    if not title:
        return site_name
    
    # Limit title length (55-60 chars optimal for Google)
    max_title_length = 55 - len(site_name) - len(separator) - 2
    
    if len(title) > max_title_length:
        title = title[:max_title_length].rsplit(' ', 1)[0] + '...'
    
    return f"{title} {separator} {site_name}"


def generate_slug(text: str) -> str:
    """
    Generate SEO-friendly slug from text
    """
    # Convert to lowercase
    slug = text.lower()
    
    # Replace spaces with hyphens
    slug = re.sub(r'\s+', '-', slug)
    
    # Remove special characters
    slug = re.sub(r'[^\w\-]', '', slug)
    
    # Remove multiple hyphens
    slug = re.sub(r'-+', '-', slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    return slug


def extract_keywords(text: str, max_keywords: int = 10) -> list:
    """
    Extract keywords from text (simple implementation)
    """
    if not text:
        return []
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    
    # Split into words
    words = text.split()
    
    # Common stop words (Italian & English)
    stop_words = {
        'il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'da', 'a', 'in', 'con', 'su', 'per',
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
        'è', 'sono', 'si', 'che', 'non', 'del', 'dei', 'della', 'delle', 'nel', 'nella', 'nei', 'nelle',
        'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
    }
    
    # Filter words
    keywords = [
        word for word in words 
        if len(word) > 3 and word not in stop_words
    ]
    
    # Count frequency
    word_freq = {}
    for word in keywords:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    # Sort by frequency
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    
    # Return top keywords
    return [word for word, _ in sorted_words[:max_keywords]]


def generate_breadcrumb_structured_data(
    items: list,
    base_url: str = "https://example.com"
) -> Dict[str, Any]:
    """
    Generate breadcrumb structured data (JSON-LD)
    
    Args:
        items: List of tuples [(name, url), ...]
    """
    item_list = []
    
    for i, (name, url) in enumerate(items, 1):
        item_list.append({
            "@type": "ListItem",
            "position": i,
            "name": name,
            "item": f"{base_url}{url}" if not url.startswith('http') else url
        })
    
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": item_list
    }


def generate_organization_structured_data(
    name: str = "CMS",
    url: str = "https://example.com",
    logo: Optional[str] = None,
    social_urls: Optional[list] = None
) -> Dict[str, Any]:
    """
    Generate organization structured data (JSON-LD)
    """
    data = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": name,
        "url": url,
    }
    
    if logo:
        data["logo"] = logo
    
    if social_urls:
        data["sameAs"] = social_urls
    
    return data


def generate_article_structured_data(
    title: str,
    description: str,
    url: str,
    published_date: datetime,
    modified_date: Optional[datetime] = None,
    author_name: str = "Unknown",
    image: Optional[str] = None,
    organization_name: str = "CMS",
    organization_logo: str = "https://example.com/logo.png"
) -> Dict[str, Any]:
    """
    Generate article structured data (JSON-LD)
    """
    data = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "url": url,
        "datePublished": published_date.isoformat(),
        "author": {
            "@type": "Person",
            "name": author_name
        },
        "publisher": {
            "@type": "Organization",
            "name": organization_name,
            "logo": {
                "@type": "ImageObject",
                "url": organization_logo
            }
        }
    }
    
    if modified_date:
        data["dateModified"] = modified_date.isoformat()
    
    if image:
        data["image"] = image
    
    return data


def generate_faq_structured_data(faqs: list) -> Dict[str, Any]:
    """
    Generate FAQ structured data (JSON-LD)
    
    Args:
        faqs: List of tuples [(question, answer), ...]
    """
    main_entity = []
    
    for question, answer in faqs:
        main_entity.append({
            "@type": "Question",
            "name": question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": answer
            }
        })
    
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": main_entity
    }


def calculate_reading_time(content: str, words_per_minute: int = 200) -> int:
    """
    Calculate estimated reading time in minutes
    """
    if not content:
        return 0
    
    # Remove HTML tags
    text = re.sub(r'<[^>]+>', '', content)
    
    # Count words
    words = len(text.split())
    
    # Calculate minutes
    minutes = max(1, round(words / words_per_minute))
    
    return minutes


def validate_meta_tags(meta: Dict[str, Any]) -> Dict[str, list]:
    """
    Validate meta tags and return warnings/errors
    """
    warnings = []
    errors = []
    
    # Title validation
    if not meta.get('title'):
        errors.append("Missing meta title")
    elif len(meta['title']) > 60:
        warnings.append(f"Meta title too long ({len(meta['title'])} chars, recommended: 50-60)")
    elif len(meta['title']) < 30:
        warnings.append(f"Meta title too short ({len(meta['title'])} chars, recommended: 50-60)")
    
    # Description validation
    if not meta.get('description'):
        errors.append("Missing meta description")
    elif len(meta['description']) > 160:
        warnings.append(f"Meta description too long ({len(meta['description'])} chars, recommended: 150-160)")
    elif len(meta['description']) < 120:
        warnings.append(f"Meta description too short ({len(meta['description'])} chars, recommended: 150-160)")
    
    # Image validation
    if not meta.get('image'):
        warnings.append("Missing Open Graph image")
    
    # Keywords validation
    if meta.get('keywords'):
        keyword_count = len(meta['keywords'].split(','))
        if keyword_count > 10:
            warnings.append(f"Too many keywords ({keyword_count}, recommended: 5-10)")
    
    return {
        "warnings": warnings,
        "errors": errors
    }
