"""
Generate sitemap.xml from database
Run this script periodically or after content updates
"""
from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.models.post import Post
from app.models.page import Page
from app.models.category import Category
from xml.etree.ElementTree import Element, SubElement, ElementTree
from xml.dom import minidom
from datetime import datetime
import os


def prettify_xml(elem):
    """Return a pretty-printed XML string"""
    rough_string = ElementTree.tostring(elem, encoding='unicode')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")


def generate_sitemap(db: Session, base_url: str = "https://example.com", output_file: str = "./sitemap.xml"):
    """Generate sitemap.xml file"""
    
    # Create root element
    urlset = Element('urlset')
    urlset.set('xmlns', 'http://www.sitemaps.org/schemas/sitemap/0.9')
    urlset.set('xmlns:xhtml', 'http://www.w3.org/1999/xhtml')
    
    # Homepage
    url = SubElement(urlset, 'url')
    SubElement(url, 'loc').text = base_url
    SubElement(url, 'changefreq').text = 'daily'
    SubElement(url, 'priority').text = '1.0'
    SubElement(url, 'lastmod').text = datetime.now().strftime('%Y-%m-%d')
    
    # Published posts
    posts = db.query(Post).filter(Post.is_published == True).all()
    print(f"📝 Adding {len(posts)} posts to sitemap...")
    
    for post in posts:
        url = SubElement(urlset, 'url')
        SubElement(url, 'loc').text = f"{base_url}/blog/{post.slug}"
        SubElement(url, 'changefreq').text = 'weekly'
        SubElement(url, 'priority').text = '0.8'
        if post.updated_at:
            SubElement(url, 'lastmod').text = post.updated_at.strftime('%Y-%m-%d')
    
    # Published pages
    pages = db.query(Page).filter(Page.is_published == True).all()
    print(f"📄 Adding {len(pages)} pages to sitemap...")
    
    for page in pages:
        url = SubElement(urlset, 'url')
        loc = f"{base_url}/{page.slug}" if not page.is_homepage else base_url
        SubElement(url, 'loc').text = loc
        SubElement(url, 'changefreq').text = 'monthly'
        SubElement(url, 'priority').text = '0.9' if page.is_homepage else '0.7'
        if page.updated_at:
            SubElement(url, 'lastmod').text = page.updated_at.strftime('%Y-%m-%d')
    
    # Categories
    categories = db.query(Category).all()
    print(f"📁 Adding {len(categories)} categories to sitemap...")
    
    for category in categories:
        url = SubElement(urlset, 'url')
        SubElement(url, 'loc').text = f"{base_url}/category/{category.slug}"
        SubElement(url, 'changefreq').text = 'weekly'
        SubElement(url, 'priority').text = '0.6'
    
    # Write to file
    xml_str = prettify_xml(urlset)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(xml_str)
    
    print(f"✅ Sitemap generated: {output_file}")
    print(f"   Total URLs: {len(posts) + len(pages) + len(categories) + 1}")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        # You can customize these values
        BASE_URL = os.getenv("BASE_URL", "https://example.com")
        OUTPUT_FILE = os.getenv("SITEMAP_OUTPUT", "./frontend/render/public/sitemap.xml")
        
        print("🗺️  Generating sitemap...")
        generate_sitemap(db, BASE_URL, OUTPUT_FILE)
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        db.close()
