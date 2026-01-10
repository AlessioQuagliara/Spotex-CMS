"""
Structured Data Generators (JSON-LD)
Comprehensive collection of schema.org structured data generators
"""
from typing import List, Dict, Any, Optional
from datetime import datetime
from decimal import Decimal


def generate_product_structured_data(
    name: str,
    description: str,
    image: str,
    price: Decimal,
    currency: str = "EUR",
    availability: str = "InStock",
    sku: Optional[str] = None,
    brand: Optional[str] = None,
    rating_value: Optional[float] = None,
    review_count: Optional[int] = None,
    url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate Product structured data
    
    Args:
        availability: InStock, OutOfStock, PreOrder, Discontinued
    """
    data = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": name,
        "description": description,
        "image": image,
        "offers": {
            "@type": "Offer",
            "price": str(price),
            "priceCurrency": currency,
            "availability": f"https://schema.org/{availability}",
            "url": url
        }
    }
    
    if sku:
        data["sku"] = sku
    
    if brand:
        data["brand"] = {
            "@type": "Brand",
            "name": brand
        }
    
    if rating_value and review_count:
        data["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": rating_value,
            "reviewCount": review_count,
            "bestRating": 5,
            "worstRating": 1
        }
    
    return data


def generate_event_structured_data(
    name: str,
    description: str,
    start_date: datetime,
    location: str,
    end_date: Optional[datetime] = None,
    location_address: Optional[str] = None,
    image: Optional[str] = None,
    organizer_name: Optional[str] = None,
    offers_url: Optional[str] = None,
    price: Optional[Decimal] = None,
    currency: str = "EUR",
    availability: str = "InStock"
) -> Dict[str, Any]:
    """
    Generate Event structured data
    """
    data = {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": name,
        "description": description,
        "startDate": start_date.isoformat(),
        "location": {
            "@type": "Place",
            "name": location
        }
    }
    
    if end_date:
        data["endDate"] = end_date.isoformat()
    
    if location_address:
        data["location"]["address"] = {
            "@type": "PostalAddress",
            "streetAddress": location_address
        }
    
    if image:
        data["image"] = image
    
    if organizer_name:
        data["organizer"] = {
            "@type": "Organization",
            "name": organizer_name
        }
    
    if offers_url or price:
        data["offers"] = {
            "@type": "Offer",
            "url": offers_url,
            "price": str(price) if price else None,
            "priceCurrency": currency,
            "availability": f"https://schema.org/{availability}"
        }
    
    return data


def generate_video_structured_data(
    name: str,
    description: str,
    thumbnail_url: str,
    upload_date: datetime,
    duration: str,
    content_url: Optional[str] = None,
    embed_url: Optional[str] = None,
    view_count: Optional[int] = None
) -> Dict[str, Any]:
    """
    Generate VideoObject structured data
    
    Args:
        duration: ISO 8601 format (e.g., "PT1H30M" for 1 hour 30 minutes)
    """
    data = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": name,
        "description": description,
        "thumbnailUrl": thumbnail_url,
        "uploadDate": upload_date.isoformat(),
        "duration": duration
    }
    
    if content_url:
        data["contentUrl"] = content_url
    
    if embed_url:
        data["embedUrl"] = embed_url
    
    if view_count:
        data["interactionStatistic"] = {
            "@type": "InteractionCounter",
            "interactionType": {"@type": "WatchAction"},
            "userInteractionCount": view_count
        }
    
    return data


def generate_recipe_structured_data(
    name: str,
    description: str,
    image: str,
    author_name: str,
    date_published: datetime,
    prep_time: str,
    cook_time: str,
    total_time: str,
    recipe_yield: str,
    ingredients: List[str],
    instructions: List[str],
    recipe_category: Optional[str] = None,
    recipe_cuisine: Optional[str] = None,
    rating_value: Optional[float] = None,
    review_count: Optional[int] = None
) -> Dict[str, Any]:
    """
    Generate Recipe structured data
    
    Args:
        prep_time: ISO 8601 duration (e.g., "PT15M" for 15 minutes)
        cook_time: ISO 8601 duration
        total_time: ISO 8601 duration
        recipe_yield: String like "4 servings" or "1 loaf"
    """
    data = {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": name,
        "description": description,
        "image": image,
        "author": {
            "@type": "Person",
            "name": author_name
        },
        "datePublished": date_published.isoformat(),
        "prepTime": prep_time,
        "cookTime": cook_time,
        "totalTime": total_time,
        "recipeYield": recipe_yield,
        "recipeIngredient": ingredients,
        "recipeInstructions": [
            {
                "@type": "HowToStep",
                "text": instruction
            }
            for instruction in instructions
        ]
    }
    
    if recipe_category:
        data["recipeCategory"] = recipe_category
    
    if recipe_cuisine:
        data["recipeCuisine"] = recipe_cuisine
    
    if rating_value and review_count:
        data["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": rating_value,
            "reviewCount": review_count,
            "bestRating": 5
        }
    
    return data


def generate_review_structured_data(
    item_reviewed_name: str,
    item_reviewed_type: str,
    rating_value: float,
    author_name: str,
    date_published: datetime,
    review_body: str,
    best_rating: int = 5
) -> Dict[str, Any]:
    """
    Generate Review structured data
    
    Args:
        item_reviewed_type: Product, Book, Movie, Organization, etc.
    """
    return {
        "@context": "https://schema.org",
        "@type": "Review",
        "itemReviewed": {
            "@type": item_reviewed_type,
            "name": item_reviewed_name
        },
        "reviewRating": {
            "@type": "Rating",
            "ratingValue": rating_value,
            "bestRating": best_rating
        },
        "author": {
            "@type": "Person",
            "name": author_name
        },
        "datePublished": date_published.isoformat(),
        "reviewBody": review_body
    }


def generate_local_business_structured_data(
    name: str,
    address: str,
    telephone: str,
    price_range: str = "$$",
    rating_value: Optional[float] = None,
    review_count: Optional[int] = None,
    image: Optional[str] = None,
    url: Optional[str] = None,
    opening_hours: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Generate LocalBusiness structured data
    
    Args:
        price_range: $ to $$$$
        opening_hours: ["Mo-Fr 09:00-18:00", "Sa 10:00-16:00"]
    """
    data = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": name,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": address
        },
        "telephone": telephone,
        "priceRange": price_range
    }
    
    if image:
        data["image"] = image
    
    if url:
        data["url"] = url
    
    if opening_hours:
        data["openingHours"] = opening_hours
    
    if rating_value and review_count:
        data["aggregateRating"] = {
            "@type": "AggregateRating",
            "ratingValue": rating_value,
            "reviewCount": review_count
        }
    
    return data


def generate_course_structured_data(
    name: str,
    description: str,
    provider_name: str,
    provider_url: str,
    price: Optional[Decimal] = None,
    currency: str = "EUR"
) -> Dict[str, Any]:
    """
    Generate Course structured data
    """
    data = {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": name,
        "description": description,
        "provider": {
            "@type": "Organization",
            "name": provider_name,
            "url": provider_url
        }
    }
    
    if price:
        data["offers"] = {
            "@type": "Offer",
            "price": str(price),
            "priceCurrency": currency
        }
    
    return data


def generate_job_posting_structured_data(
    title: str,
    description: str,
    hiring_organization: str,
    location: str,
    date_posted: datetime,
    employment_type: str = "FULL_TIME",
    salary_value: Optional[Decimal] = None,
    salary_currency: str = "EUR",
    salary_unit: str = "YEAR"
) -> Dict[str, Any]:
    """
    Generate JobPosting structured data
    
    Args:
        employment_type: FULL_TIME, PART_TIME, CONTRACTOR, TEMPORARY, INTERN, VOLUNTEER, PER_DIEM, OTHER
        salary_unit: HOUR, DAY, WEEK, MONTH, YEAR
    """
    data = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": title,
        "description": description,
        "datePosted": date_posted.isoformat(),
        "employmentType": employment_type,
        "hiringOrganization": {
            "@type": "Organization",
            "name": hiring_organization
        },
        "jobLocation": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressLocality": location
            }
        }
    }
    
    if salary_value:
        data["baseSalary"] = {
            "@type": "MonetaryAmount",
            "currency": salary_currency,
            "value": {
                "@type": "QuantitativeValue",
                "value": str(salary_value),
                "unitText": salary_unit
            }
        }
    
    return data


def generate_website_structured_data(
    name: str,
    url: str,
    description: Optional[str] = None,
    search_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generate WebSite structured data with search action
    """
    data = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": name,
        "url": url
    }
    
    if description:
        data["description"] = description
    
    if search_url:
        data["potentialAction"] = {
            "@type": "SearchAction",
            "target": f"{search_url}?q={{search_term_string}}",
            "query-input": "required name=search_term_string"
        }
    
    return data


def generate_blog_posting_structured_data(
    headline: str,
    description: str,
    image: str,
    author_name: str,
    date_published: datetime,
    date_modified: Optional[datetime] = None,
    keywords: Optional[str] = None,
    url: Optional[str] = None,
    publisher_name: str = "CMS",
    publisher_logo: str = "/logo.png"
) -> Dict[str, Any]:
    """
    Generate BlogPosting structured data (more specific than Article)
    """
    data = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": headline,
        "description": description,
        "image": image,
        "author": {
            "@type": "Person",
            "name": author_name
        },
        "publisher": {
            "@type": "Organization",
            "name": publisher_name,
            "logo": {
                "@type": "ImageObject",
                "url": publisher_logo
            }
        },
        "datePublished": date_published.isoformat()
    }
    
    if date_modified:
        data["dateModified"] = date_modified.isoformat()
    
    if keywords:
        data["keywords"] = keywords
    
    if url:
        data["mainEntityOfPage"] = {
            "@type": "WebPage",
            "@id": url
        }
    
    return data


def generate_how_to_structured_data(
    name: str,
    description: str,
    image: str,
    total_time: str,
    steps: List[Dict[str, str]],
    tools: Optional[List[str]] = None,
    supplies: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Generate HowTo structured data
    
    Args:
        total_time: ISO 8601 duration (e.g., "PT1H")
        steps: List of dicts with 'name' and 'text' keys
        tools: List of tool names
        supplies: List of supply names
    """
    data = {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": name,
        "description": description,
        "image": image,
        "totalTime": total_time,
        "step": [
            {
                "@type": "HowToStep",
                "name": step["name"],
                "text": step["text"]
            }
            for step in steps
        ]
    }
    
    if tools:
        data["tool"] = [{"@type": "HowToTool", "name": tool} for tool in tools]
    
    if supplies:
        data["supply"] = [{"@type": "HowToSupply", "name": supply} for supply in supplies]
    
    return data
