"""
SEO Schemas for structured data
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


class ArticleStructuredData(BaseModel):
    """Article structured data schema"""
    headline: str
    description: str
    image: Optional[str] = None
    date_published: datetime
    date_modified: Optional[datetime] = None
    author_name: str
    author_url: Optional[str] = None
    publisher_name: str = "CMS"
    publisher_logo: str = "/logo.png"
    url: str
    keywords: Optional[str] = None


class ProductStructuredData(BaseModel):
    """Product structured data schema"""
    name: str
    description: str
    image: str
    sku: Optional[str] = None
    brand: Optional[str] = None
    price: Decimal
    currency: str = "EUR"
    availability: str = "InStock"  # InStock, OutOfStock, PreOrder
    rating_value: Optional[float] = Field(None, ge=0, le=5)
    review_count: Optional[int] = Field(None, ge=0)
    url: str


class EventStructuredData(BaseModel):
    """Event structured data schema"""
    name: str
    description: str
    start_date: datetime
    end_date: Optional[datetime] = None
    location: str
    location_address: Optional[str] = None
    image: Optional[str] = None
    organizer_name: Optional[str] = None
    offers_url: Optional[str] = None
    price: Optional[Decimal] = None
    currency: str = "EUR"
    availability: str = "InStock"
    url: str


class VideoStructuredData(BaseModel):
    """Video structured data schema"""
    name: str
    description: str
    thumbnail_url: str
    upload_date: datetime
    duration: str  # ISO 8601 format: PT1H30M
    content_url: Optional[str] = None
    embed_url: Optional[str] = None
    view_count: Optional[int] = None


class RecipeStructuredData(BaseModel):
    """Recipe structured data schema"""
    name: str
    description: str
    image: str
    author_name: str
    date_published: datetime
    prep_time: str  # ISO 8601: PT15M
    cook_time: str  # ISO 8601: PT30M
    total_time: str  # ISO 8601: PT45M
    recipe_yield: str  # "4 servings"
    recipe_category: Optional[str] = None
    recipe_cuisine: Optional[str] = None
    ingredients: List[str]
    instructions: List[str]
    rating_value: Optional[float] = Field(None, ge=0, le=5)
    review_count: Optional[int] = None


class ReviewStructuredData(BaseModel):
    """Review structured data schema"""
    item_reviewed_name: str
    item_reviewed_type: str  # Product, Book, Movie, etc.
    rating_value: float = Field(..., ge=0, le=5)
    best_rating: int = 5
    author_name: str
    date_published: datetime
    review_body: str


class OrganizationStructuredData(BaseModel):
    """Organization structured data schema"""
    name: str
    url: str
    logo: Optional[str] = None
    description: Optional[str] = None
    email: Optional[str] = None
    telephone: Optional[str] = None
    address: Optional[str] = None
    social_urls: Optional[List[str]] = None


class FAQItemSchema(BaseModel):
    """FAQ item schema"""
    question: str
    answer: str


class BreadcrumbItemSchema(BaseModel):
    """Breadcrumb item schema"""
    name: str
    url: str


class OpenGraphTags(BaseModel):
    """Open Graph tags schema"""
    title: str
    description: str
    type: str = "website"  # website, article, product, video, etc.
    url: str
    image: Optional[str] = None
    image_width: Optional[int] = 1200
    image_height: Optional[int] = 630
    site_name: str = "CMS"
    locale: str = "it_IT"
    locale_alternate: Optional[List[str]] = None
    
    # Article specific
    article_published_time: Optional[datetime] = None
    article_modified_time: Optional[datetime] = None
    article_author: Optional[str] = None
    article_section: Optional[str] = None
    article_tag: Optional[List[str]] = None
    
    # Product specific
    product_price_amount: Optional[Decimal] = None
    product_price_currency: str = "EUR"
    product_availability: Optional[str] = None
    product_brand: Optional[str] = None
    
    # Video specific
    video_url: Optional[str] = None
    video_secure_url: Optional[str] = None
    video_type: Optional[str] = None
    video_width: Optional[int] = None
    video_height: Optional[int] = None
    video_duration: Optional[int] = None


class TwitterCardTags(BaseModel):
    """Twitter Card tags schema"""
    card: str = "summary_large_image"  # summary, summary_large_image, app, player
    site: Optional[str] = None  # @username
    creator: Optional[str] = None  # @username
    title: str
    description: str
    image: Optional[str] = None
    image_alt: Optional[str] = None
    
    # Player card specific
    player: Optional[str] = None
    player_width: Optional[int] = None
    player_height: Optional[int] = None


class MetaTagsResponse(BaseModel):
    """Complete meta tags response"""
    title: str
    description: str
    keywords: Optional[str] = None
    canonical: str
    robots: str = "index, follow"
    
    # Open Graph
    og: OpenGraphTags
    
    # Twitter Card
    twitter: TwitterCardTags
    
    # Structured data (JSON-LD)
    structured_data: Dict[str, Any]
    
    # Additional structured data
    breadcrumb: Optional[Dict[str, Any]] = None
    organization: Optional[Dict[str, Any]] = None
    faq: Optional[Dict[str, Any]] = None
