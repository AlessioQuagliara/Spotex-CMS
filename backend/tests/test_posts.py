"""
Test posts endpoints
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_post(client: AsyncClient, auth_headers):
    """Test creating a post"""
    response = await client.post(
        "/api/v1/posts/",
        headers=auth_headers,
        json={
            "title": "Test Post",
            "slug": "test-post",
            "content": "This is test content",
            "excerpt": "Test excerpt",
            "is_published": True
        }
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test Post"
    assert data["slug"] == "test-post"


@pytest.mark.asyncio
async def test_list_posts(client: AsyncClient):
    """Test listing posts"""
    response = await client.get("/api/v1/posts/")
    
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data


@pytest.mark.asyncio
async def test_get_post_by_slug(client: AsyncClient, auth_headers):
    """Test getting post by slug"""
    # Create post first
    create_response = await client.post(
        "/api/v1/posts/",
        headers=auth_headers,
        json={
            "title": "Slug Test",
            "slug": "slug-test",
            "content": "Content"
        }
    )
    
    # Get by slug
    response = await client.get("/api/v1/posts/slug/slug-test")
    
    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == "slug-test"


@pytest.mark.asyncio
async def test_update_post(client: AsyncClient, auth_headers):
    """Test updating a post"""
    # Create post
    create_response = await client.post(
        "/api/v1/posts/",
        headers=auth_headers,
        json={
            "title": "Original Title",
            "slug": "original-slug",
            "content": "Content"
        }
    )
    post_id = create_response.json()["id"]
    
    # Update post
    response = await client.put(
        f"/api/v1/posts/{post_id}",
        headers=auth_headers,
        json={"title": "Updated Title"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Updated Title"


@pytest.mark.asyncio
async def test_delete_post(client: AsyncClient, auth_headers):
    """Test deleting a post"""
    # Create post
    create_response = await client.post(
        "/api/v1/posts/",
        headers=auth_headers,
        json={
            "title": "To Delete",
            "slug": "to-delete",
            "content": "Content"
        }
    )
    post_id = create_response.json()["id"]
    
    # Delete post
    response = await client.delete(
        f"/api/v1/posts/{post_id}",
        headers=auth_headers
    )
    
    assert response.status_code == 200
    
    # Verify deleted
    get_response = await client.get(f"/api/v1/posts/{post_id}")
    assert get_response.status_code == 404
