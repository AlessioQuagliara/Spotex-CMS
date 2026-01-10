"""
SEO API endpoints - Sitemap and robots.txt
"""
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime
from typing import List
from app.database.database import get_db
from app.models.post import Post
from app.models.page import Page
from app.models.category import Category
from app.models.i18n import Language
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom

router = APIRouter()


def generate_sitemap_xml(urls: List[dict]) -> str:
    """Generate XML sitemap from URLs list"""
    urlset = Element('urlset')
    urlset.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    urlset.set('xmlns:xhtml', 'http://www.w3.org/1999/xhtml')
    urlset.set('xmlns:image', 'http://www.google.com/schemas/sitemap-image/1.1')
    
    for url_data in urls:
        url = SubElement(urlset, 'url')
        
        loc = SubElement(url, 'loc')
        loc.text = url_data['loc']
        
        if url_data.get('lastmod'):
            lastmod = SubElement(url, 'lastmod')
            lastmod.text = url_data['lastmod']
        
        if url_data.get('changefreq'):
            changefreq = SubElement(url, 'changefreq')
            changefreq.text = url_data['changefreq']
        
        if url_data.get('priority'):
            priority = SubElement(url, 'priority')
            priority.text = str(url_data['priority'])
        
        # Add alternate language links
        if url_data.get('alternates'):
            for lang, alt_url in url_data['alternates'].items():
                link = SubElement(url, '{http://www.w3.org/1999/xhtml}link')
                link.set('rel', 'alternate')
                link.set('hreflang', lang)
                link.set('href', alt_url)
        
        # Add image if exists
        if url_data.get('image'):
            image = SubElement(url, '{http://www.google.com/schemas/sitemap-image/1.1}image')
            image_loc = SubElement(image, '{http://www.google.com/schemas/sitemap-image/1.1}loc')
            image_loc.text = url_data['image']
            
            if url_data.get('image_title'):
                image_title = SubElement(image, '{http://www.google.com/schemas/sitemap-image/1.1}title')
                image_title.text = url_data['image_title']
    
    # Pretty print XML
    xml_str = tostring(urlset, encoding='unicode')
    dom = minidom.parseString(xml_str)
    return dom.toprettyxml(indent="  ", encoding='UTF-8').decode('utf-8')


@router.get("/sitemap.xml")
async def get_sitemap(
    db: Session = Depends(get_db),
    base_url: str = "https://example.com"
):
    """
    Generate dynamic XML sitemap with all published content
    Includes multi-language support and images
    """
    urls = []
    
    # Homepage
    urls.append({
        'loc': base_url,
        'changefreq': 'daily',
        'priority': 1.0,
        'lastmod': datetime.now().strftime('%Y-%m-%d')
    })
    
    # Get active languages for alternates
    languages = db.query(Language).filter(Language.is_active == True).all()
    lang_codes = [lang.code.value for lang in languages]
    
    # Published posts
    posts = db.query(Post).filter(Post.is_published == True).all()
    for post in posts:
        post_data = {
            'loc': f"{base_url}/blog/{post.slug}",
            'changefreq': 'weekly',
            'priority': 0.8,
            'lastmod': post.updated_at.strftime('%Y-%m-%d') if post.updated_at else None,
        }
        
        # Add featured image
        if post.featured_image:
            post_data['image'] = f"{base_url}{post.featured_image}"
            post_data['image_title'] = post.title
        
        # Add language alternates
        if post.translations:
            alternates = {}
            for translation in post.translations:
                lang_code = translation.language_code
                alternates[lang_code] = f"{base_url}/{lang_code}/blog/{translation.slug}"
            if alternates:
                post_data['alternates'] = alternates
        
        urls.append(post_data)
    
    # Published pages
    pages = db.query(Page).filter(Page.is_published == True).all()
    for page in pages:
        priority = 0.9 if page.is_homepage else 0.7
        
        page_data = {
            'loc': f"{base_url}/{page.slug}" if not page.is_homepage else base_url,
            'changefreq': 'monthly',
            'priority': priority,
            'lastmod': page.updated_at.strftime('%Y-%m-%d') if page.updated_at else None,
        }
        
        # Add language alternates
        if page.translations:
            alternates = {}
            for translation in page.translations:
                lang_code = translation.language_code
                alternates[lang_code] = f"{base_url}/{lang_code}/{translation.slug}"
            if alternates:
                page_data['alternates'] = alternates
        
        urls.append(page_data)
    
    # Categories
    categories = db.query(Category).all()
    for category in categories:
        urls.append({
            'loc': f"{base_url}/category/{category.slug}",
            'changefreq': 'weekly',
            'priority': 0.6,
        })
    
    # Generate XML
    xml_content = generate_sitemap_xml(urls)
    
    return Response(
        content=xml_content,
        media_type="application/xml",
        headers={"Content-Type": "application/xml; charset=utf-8"}
    )


@router.get("/robots.txt")
async def get_robots(base_url: str = "https://example.com"):
    """
    Generate robots.txt file
    """
    content = f"""User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /login
Disallow: /register

Sitemap: {base_url}/sitemap.xml

# Crawl-delay for well-behaved bots
Crawl-delay: 1

# Block AI crawlers (optional)
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /
"""
    
    return Response(
        content=content,
        media_type="text/plain",
        headers={"Content-Type": "text/plain; charset=utf-8"}
    )


@router.get("/seo/meta/{content_type}/{slug}")
async def get_meta_tags(
    content_type: str,
    slug: str,
    db: Session = Depends(get_db),
    base_url: str = "https://example.com"
):
    """
    Get SEO meta tags for a specific content (post or page)
    Returns Open Graph, Twitter Cards, and structured data
    """
    content = None
    url = ""
    
    if content_type == "post":
        content = db.query(Post).filter(
            and_(Post.slug == slug, Post.is_published == True)
        ).first()
        url = f"{base_url}/blog/{slug}"
    elif content_type == "page":
        content = db.query(Page).filter(
            and_(Page.slug == slug, Page.is_published == True)
        ).first()
        url = f"{base_url}/{slug}"
    
    if not content:
        return {"error": "Content not found"}
    
    # Basic meta
    meta = {
        "title": content.seo_title or content.title,
        "description": content.seo_description or (content.excerpt if hasattr(content, 'excerpt') else None),
        "keywords": content.seo_keywords if hasattr(content, 'seo_keywords') else None,
        "canonical": url,
        
        # Open Graph
        "og": {
            "title": content.seo_title or content.title,
            "description": content.seo_description or (content.excerpt if hasattr(content, 'excerpt') else None),
            "url": url,
            "type": "article" if content_type == "post" else "website",
            "site_name": "CMS",
        },
        
        # Twitter Card
        "twitter": {
            "card": "summary_large_image",
            "title": content.seo_title or content.title,
            "description": content.seo_description or (content.excerpt if hasattr(content, 'excerpt') else None),
        },
    }
    
    # Add image if available
    if hasattr(content, 'featured_image') and content.featured_image:
        meta["og"]["image"] = f"{base_url}{content.featured_image}"
        meta["twitter"]["image"] = f"{base_url}{content.featured_image}"
    
    # Add article specific data
    if content_type == "post":
        # Open Graph Article
        meta["og"]["article"] = {
            "published_time": content.published_at.isoformat() if content.published_at else None,
            "modified_time": content.updated_at.isoformat() if content.updated_at else None,
            "author": content.author.username if content.author else None,
            "section": content.category.name if content.category else None,
            "tag": getattr(content, 'tags', []),
        }
        
        # Open Graph extras
        meta["og"]["locale"] = "it_IT"
        meta["og"]["locale:alternate"] = ["en_US", "es_ES", "fr_FR"]
        
        # Structured data (JSON-LD) - Article with rich data
        meta["structured_data"] = {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": content.title,
            "description": content.excerpt,
            "image": {
                "@type": "ImageObject",
                "url": f"{base_url}{content.featured_image}" if content.featured_image else None,
                "width": 1200,
                "height": 630
            },
            "datePublished": content.published_at.isoformat() if content.published_at else None,
            "dateModified": content.updated_at.isoformat() if content.updated_at else None,
            "author": {
                "@type": "Person",
                "name": content.author.username if content.author else "Unknown",
                "url": f"{base_url}/author/{content.author_id}" if content.author else None
            },
            "publisher": {
                "@type": "Organization",
                "name": "CMS",
                "logo": {
                    "@type": "ImageObject",
                    "url": f"{base_url}/logo.png"
                }
            },
            "mainEntityOfPage": {
                "@type": "WebPage",
                "@id": url
            },
            "wordCount": len(content.content.split()) if hasattr(content, 'content') else 0,
            "keywords": content.seo_keywords if hasattr(content, 'seo_keywords') else None,
        }
        
        # Add breadcrumb
        meta["breadcrumb"] = {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": base_url
                },
                {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Blog",
                    "item": f"{base_url}/blog"
                },
                {
                    "@type": "ListItem",
                    "position": 3,
                    "name": content.title,
                    "item": url
                }
            ]
        }
    
    return meta
