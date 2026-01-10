"""
Integration tests for authentication API endpoints
"""
import pytest
from datetime import datetime, timedelta
from jose import jwt


@pytest.mark.integration
@pytest.mark.auth
class TestAuthenticationFlow:
    """Test complete authentication flow"""
    
    def test_register_success(self, client):
        """Test successful user registration"""
        response = client.post("/api/auth/register", json={
            "email": "newuser@example.com",
            "username": "newuser",
            "password": "Password123!",
            "full_name": "New User"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["username"] == "newuser"
        assert "password" not in data
        assert "hashed_password" not in data
    
    def test_register_duplicate_email(self, client, test_user):
        """Test registration with duplicate email"""
        response = client.post("/api/auth/register", json={
            "email": test_user.email,
            "username": "different",
            "password": "Password123!",
            "full_name": "Different User"
        })
        
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()
    
    def test_register_invalid_email(self, client):
        """Test registration with invalid email"""
        response = client.post("/api/auth/register", json={
            "email": "notanemail",
            "username": "testuser",
            "password": "Password123!",
            "full_name": "Test User"
        })
        
        assert response.status_code == 422
    
    def test_register_weak_password(self, client):
        """Test registration with weak password"""
        response = client.post("/api/auth/register", json={
            "email": "test@example.com",
            "username": "testuser",
            "password": "weak",
            "full_name": "Test User"
        })
        
        assert response.status_code == 422
    
    def test_login_success(self, client, test_user):
        """Test successful login"""
        response = client.post("/api/auth/login", data={
            "username": test_user.email,
            "password": "password123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self, client, test_user):
        """Test login with wrong password"""
        response = client.post("/api/auth/login", data={
            "username": test_user.email,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self, client):
        """Test login with nonexistent user"""
        response = client.post("/api/auth/login", data={
            "username": "nonexistent@example.com",
            "password": "password123"
        })
        
        assert response.status_code == 401
    
    def test_refresh_token(self, client, test_user):
        """Test token refresh"""
        # First login
        login_response = client.post("/api/auth/login", data={
            "username": test_user.email,
            "password": "password123"
        })
        refresh_token = login_response.json()["refresh_token"]
        
        # Refresh token
        response = client.post("/api/auth/refresh", json={
            "refresh_token": refresh_token
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_get_current_user(self, client, auth_headers):
        """Test getting current user profile"""
        response = client.get("/api/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "email" in data
        assert "username" in data
        assert "password" not in data
    
    def test_get_current_user_unauthorized(self, client):
        """Test accessing profile without token"""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 401
    
    def test_get_current_user_invalid_token(self, client):
        """Test accessing profile with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.database
class TestDatabaseTransactions:
    """Test database transaction handling"""
    
    def test_rollback_on_error(self, client, auth_headers):
        """Test database rollback on error"""
        # Try to create post with invalid category
        response = client.post("/api/posts", headers=auth_headers, json={
            "title": "Test Post",
            "content": "Test content",
            "status": "draft",
            "category_id": 99999  # Non-existent category
        })
        
        assert response.status_code in [400, 404, 422]
        
        # Verify no post was created
        posts_response = client.get("/api/posts", headers=auth_headers)
        initial_count = posts_response.json()["total"]
        
        # The failed post should not be in database
        assert all(p["title"] != "Test Post" for p in posts_response.json()["items"])
    
    def test_concurrent_updates(self, client, test_post, auth_headers):
        """Test handling concurrent updates"""
        # Get original post
        response1 = client.get(f"/api/posts/{test_post.id}", headers=auth_headers)
        original = response1.json()
        
        # Update from "client 1"
        update1 = client.put(f"/api/posts/{test_post.id}", headers=auth_headers, json={
            "title": "Updated by Client 1",
            "content": original["content"],
            "status": original["status"]
        })
        assert update1.status_code == 200
        
        # Update from "client 2"
        update2 = client.put(f"/api/posts/{test_post.id}", headers=auth_headers, json={
            "title": "Updated by Client 2",
            "content": original["content"],
            "status": original["status"]
        })
        assert update2.status_code == 200
        
        # Verify last update wins
        final = client.get(f"/api/posts/{test_post.id}", headers=auth_headers)
        assert final.json()["title"] == "Updated by Client 2"
    
    def test_cascade_delete(self, client, test_post, admin_headers):
        """Test cascade delete behavior"""
        post_id = test_post.id
        
        # Delete post
        delete_response = client.delete(f"/api/posts/{post_id}", headers=admin_headers)
        assert delete_response.status_code == 204
        
        # Verify post is deleted
        get_response = client.get(f"/api/posts/{post_id}", headers=admin_headers)
        assert get_response.status_code == 404


@pytest.mark.integration
@pytest.mark.api
class TestAPIEndpointIntegration:
    """Test API endpoint integration"""
    
    def test_create_and_retrieve_post(self, client, auth_headers, test_category):
        """Test creating and retrieving a post"""
        # Create post
        create_response = client.post("/api/posts", headers=auth_headers, json={
            "title": "Integration Test Post",
            "content": "Test content",
            "excerpt": "Test excerpt",
            "status": "published",
            "category_id": test_category.id
        })
        
        assert create_response.status_code == 201
        post_data = create_response.json()
        post_id = post_data["id"]
        
        # Retrieve post
        get_response = client.get(f"/api/posts/{post_id}", headers=auth_headers)
        assert get_response.status_code == 200
        
        retrieved = get_response.json()
        assert retrieved["title"] == "Integration Test Post"
        assert retrieved["status"] == "published"
    
    def test_update_and_verify_post(self, client, test_post, auth_headers):
        """Test updating and verifying post changes"""
        # Update post
        update_response = client.put(f"/api/posts/{test_post.id}", headers=auth_headers, json={
            "title": "Updated Title",
            "content": test_post.content,
            "status": "published"
        })
        
        assert update_response.status_code == 200
        
        # Verify update
        get_response = client.get(f"/api/posts/{test_post.id}", headers=auth_headers)
        updated = get_response.json()
        assert updated["title"] == "Updated Title"
        assert updated["updated_at"] != updated["created_at"]
    
    def test_search_posts(self, client, auth_headers, test_post):
        """Test post search functionality"""
        # Search by title
        response = client.get(
            "/api/posts",
            headers=auth_headers,
            params={"search": test_post.title}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] > 0
        assert any(p["id"] == test_post.id for p in data["items"])
    
    def test_pagination(self, client, auth_headers, db, test_user, test_category):
        """Test pagination across endpoints"""
        from app.models.post import Post
        
        # Create multiple posts
        for i in range(15):
            post = Post(
                title=f"Post {i}",
                slug=f"post-{i}",
                content=f"Content {i}",
                status="published",
                author_id=test_user.id,
                category_id=test_category.id
            )
            db.add(post)
        db.commit()
        
        # Test pagination
        page1 = client.get("/api/posts?page=1&limit=10", headers=auth_headers)
        page2 = client.get("/api/posts?page=2&limit=10", headers=auth_headers)
        
        assert page1.status_code == 200
        assert page2.status_code == 200
        
        data1 = page1.json()
        data2 = page2.json()
        
        assert len(data1["items"]) == 10
        assert len(data2["items"]) > 0
        assert data1["items"][0]["id"] != data2["items"][0]["id"]
    
    def test_filtering_and_sorting(self, client, auth_headers, test_category):
        """Test filtering and sorting"""
        # Filter by category
        response = client.get(
            "/api/posts",
            headers=auth_headers,
            params={
                "category_id": test_category.id,
                "status": "published",
                "sort_by": "created_at",
                "order": "desc"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify filtering
        for post in data["items"]:
            assert post["category_id"] == test_category.id
            assert post["status"] == "published"
