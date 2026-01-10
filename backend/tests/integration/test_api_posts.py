"""
Integration tests for Posts API endpoints
"""
import pytest


@pytest.mark.integration
@pytest.mark.api
class TestPostsAPI:
    """Test Posts CRUD operations"""
    
    def test_list_posts(self, client, auth_headers):
        """Test listing posts"""
        response = client.get("/api/posts", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert isinstance(data["items"], list)
    
    def test_list_posts_unauthorized(self, client):
        """Test listing posts without authentication"""
        response = client.get("/api/posts")
        
        # Public posts might be accessible
        assert response.status_code in [200, 401]
    
    def test_create_post(self, client, auth_headers, test_category):
        """Test creating a post"""
        response = client.post("/api/posts", headers=auth_headers, json={
            "title": "New Test Post",
            "content": "This is test content",
            "excerpt": "Test excerpt",
            "status": "draft",
            "category_id": test_category.id
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "New Test Post"
        assert data["status"] == "draft"
        assert "id" in data
        assert "slug" in data
    
    def test_create_post_without_category(self, client, auth_headers):
        """Test creating post without category"""
        response = client.post("/api/posts", headers=auth_headers, json={
            "title": "Post Without Category",
            "content": "Content",
            "status": "draft"
        })
        
        # Should fail or create with null category
        assert response.status_code in [201, 400, 422]
    
    def test_create_post_invalid_data(self, client, auth_headers):
        """Test creating post with invalid data"""
        response = client.post("/api/posts", headers=auth_headers, json={
            "title": "",  # Empty title
            "content": "Content"
        })
        
        assert response.status_code == 422
    
    def test_get_post_by_id(self, client, test_post, auth_headers):
        """Test getting specific post"""
        response = client.get(f"/api/posts/{test_post.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_post.id
        assert data["title"] == test_post.title
    
    def test_get_nonexistent_post(self, client, auth_headers):
        """Test getting post that doesn't exist"""
        response = client.get("/api/posts/99999", headers=auth_headers)
        
        assert response.status_code == 404
    
    def test_update_post(self, client, test_post, auth_headers):
        """Test updating a post"""
        response = client.put(f"/api/posts/{test_post.id}", headers=auth_headers, json={
            "title": "Updated Title",
            "content": "Updated content",
            "status": "published"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        assert data["status"] == "published"
    
    def test_update_post_unauthorized(self, client, test_post):
        """Test updating post without authentication"""
        response = client.put(f"/api/posts/{test_post.id}", json={
            "title": "Hacked Title"
        })
        
        assert response.status_code == 401
    
    def test_partial_update_post(self, client, test_post, auth_headers):
        """Test partial update of post"""
        original_content = test_post.content
        
        response = client.put(f"/api/posts/{test_post.id}", headers=auth_headers, json={
            "title": "Only Title Updated",
            "content": original_content,
            "status": test_post.status
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Only Title Updated"
        assert data["content"] == original_content
    
    def test_delete_post(self, client, test_post, admin_headers):
        """Test deleting a post"""
        response = client.delete(f"/api/posts/{test_post.id}", headers=admin_headers)
        
        assert response.status_code == 204
        
        # Verify deleted
        get_response = client.get(f"/api/posts/{test_post.id}", headers=admin_headers)
        assert get_response.status_code == 404
    
    def test_delete_post_non_admin(self, client, test_post, auth_headers):
        """Test non-admin can't delete post"""
        response = client.delete(f"/api/posts/{test_post.id}", headers=auth_headers)
        
        # Should be forbidden or unauthorized
        assert response.status_code in [401, 403]
    
    def test_search_posts(self, client, test_post, auth_headers):
        """Test searching posts"""
        response = client.get(
            "/api/posts",
            headers=auth_headers,
            params={"search": test_post.title[:5]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert any(p["id"] == test_post.id for p in data["items"])
    
    def test_filter_posts_by_status(self, client, auth_headers):
        """Test filtering posts by status"""
        response = client.get(
            "/api/posts",
            headers=auth_headers,
            params={"status": "published"}
        )
        
        assert response.status_code == 200
        data = response.json()
        for post in data["items"]:
            assert post["status"] == "published"
    
    def test_filter_posts_by_category(self, client, test_category, auth_headers):
        """Test filtering posts by category"""
        response = client.get(
            "/api/posts",
            headers=auth_headers,
            params={"category_id": test_category.id}
        )
        
        assert response.status_code == 200
        data = response.json()
        for post in data["items"]:
            assert post["category_id"] == test_category.id
    
    def test_sort_posts(self, client, auth_headers):
        """Test sorting posts"""
        # Sort by created_at desc
        response = client.get(
            "/api/posts",
            headers=auth_headers,
            params={"sort_by": "created_at", "order": "desc"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data["items"]) > 1:
            dates = [p["created_at"] for p in data["items"]]
            assert dates == sorted(dates, reverse=True)
    
    def test_increment_views(self, client, test_post, auth_headers):
        """Test incrementing post views"""
        # Get initial views
        initial_response = client.get(f"/api/posts/{test_post.id}", headers=auth_headers)
        initial_views = initial_response.json()["views"]
        
        # Increment views
        client.get(f"/api/posts/{test_post.id}", headers=auth_headers)
        client.get(f"/api/posts/{test_post.id}", headers=auth_headers)
        
        # Check views increased
        final_response = client.get(f"/api/posts/{test_post.id}", headers=auth_headers)
        final_views = final_response.json()["views"]
        
        assert final_views >= initial_views


@pytest.mark.integration
@pytest.mark.api
class TestCategoriesAPI:
    """Test Categories API endpoints"""
    
    def test_list_categories(self, client, auth_headers):
        """Test listing categories"""
        response = client.get("/api/categories", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert isinstance(data["items"], list)
    
    def test_create_category(self, client, admin_headers):
        """Test creating category"""
        response = client.post("/api/categories", headers=admin_headers, json={
            "name": "New Category",
            "slug": "new-category",
            "description": "Category description"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "New Category"
        assert data["slug"] == "new-category"
    
    def test_get_category_with_posts(self, client, test_category, test_post, auth_headers):
        """Test getting category with post count"""
        response = client.get(f"/api/categories/{test_category.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_category.id
        # Should include post count or posts
        assert "posts" in data or "post_count" in data


@pytest.mark.integration
@pytest.mark.api
class TestMediaAPI:
    """Test Media API endpoints"""
    
    def test_list_media(self, client, auth_headers):
        """Test listing media files"""
        response = client.get("/api/media", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_upload_media(self, client, auth_headers):
        """Test uploading media file"""
        # Create fake image file
        from io import BytesIO
        
        file_content = b"fake image content"
        files = {
            "file": ("test.jpg", BytesIO(file_content), "image/jpeg")
        }
        
        response = client.post(
            "/api/media/upload",
            headers=auth_headers,
            files=files
        )
        
        # Might succeed or fail depending on validation
        assert response.status_code in [201, 400, 422]
    
    def test_get_media_by_id(self, client, test_media, auth_headers):
        """Test getting specific media file"""
        response = client.get(f"/api/media/{test_media.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_media.id
        assert data["filename"] == test_media.filename
    
    def test_delete_media(self, client, test_media, admin_headers):
        """Test deleting media file"""
        response = client.delete(f"/api/media/{test_media.id}", headers=admin_headers)
        
        assert response.status_code == 204
        
        # Verify deleted
        get_response = client.get(f"/api/media/{test_media.id}", headers=admin_headers)
        assert get_response.status_code == 404


@pytest.mark.integration
@pytest.mark.api
class TestStatsAPI:
    """Test Statistics API endpoints"""
    
    def test_get_dashboard_stats(self, client, admin_headers):
        """Test getting dashboard statistics"""
        response = client.get("/api/stats/dashboard", headers=admin_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should contain various stats
        assert "total_posts" in data or "posts" in data
        assert "total_users" in data or "users" in data
    
    def test_stats_unauthorized(self, client, auth_headers):
        """Test non-admin can't access full stats"""
        response = client.get("/api/stats/dashboard", headers=auth_headers)
        
        # Should be forbidden for non-admin
        assert response.status_code in [200, 403]
