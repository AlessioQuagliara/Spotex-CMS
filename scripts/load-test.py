#!/usr/bin/env python3
"""
Performance testing with Locust
Load testing for API endpoints
"""
from locust import HttpUser, task, between
import random


class APIUser(HttpUser):
    """Simulate API user behavior"""
    
    wait_time = between(1, 3)
    host = "http://localhost:8000"
    
    def on_start(self):
        """Login and get auth token"""
        response = self.client.post("/api/auth/login", data={
            "username": "test@example.com",
            "password": "password123"
        })
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task(3)
    def list_posts(self):
        """Test GET /api/posts endpoint (most common)"""
        self.client.get(
            "/api/posts",
            headers=self.headers,
            name="/api/posts"
        )
    
    @task(2)
    def get_post_detail(self):
        """Test GET /api/posts/{id} endpoint"""
        post_id = random.randint(1, 100)
        self.client.get(
            f"/api/posts/{post_id}",
            headers=self.headers,
            name="/api/posts/{id}"
        )
    
    @task(1)
    def search_posts(self):
        """Test search functionality"""
        queries = ["test", "blog", "tutorial", "guide", "news"]
        query = random.choice(queries)
        
        self.client.get(
            f"/api/posts?search={query}",
            headers=self.headers,
            name="/api/posts?search"
        )
    
    @task(1)
    def filter_posts(self):
        """Test filtering"""
        statuses = ["published", "draft"]
        status = random.choice(statuses)
        
        self.client.get(
            f"/api/posts?status={status}",
            headers=self.headers,
            name="/api/posts?status"
        )
    
    @task(1)
    def list_categories(self):
        """Test GET /api/categories endpoint"""
        self.client.get(
            "/api/categories",
            headers=self.headers,
            name="/api/categories"
        )
    
    @task(1)
    def get_dashboard_stats(self):
        """Test GET /api/stats/dashboard endpoint"""
        self.client.get(
            "/api/stats/dashboard",
            headers=self.headers,
            name="/api/stats/dashboard"
        )


class WriterUser(HttpUser):
    """Simulate user creating/updating content"""
    
    wait_time = between(5, 15)
    host = "http://localhost:8000"
    
    def on_start(self):
        """Login"""
        response = self.client.post("/api/auth/login", data={
            "username": "author@example.com",
            "password": "password123"
        })
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task(2)
    def create_post(self):
        """Test POST /api/posts endpoint"""
        post_data = {
            "title": f"Test Post {random.randint(1, 10000)}",
            "content": "This is test content for performance testing",
            "excerpt": "Test excerpt",
            "status": "draft",
            "category_id": random.randint(1, 5)
        }
        
        self.client.post(
            "/api/posts",
            json=post_data,
            headers=self.headers,
            name="/api/posts [POST]"
        )
    
    @task(1)
    def update_post(self):
        """Test PUT /api/posts/{id} endpoint"""
        post_id = random.randint(1, 100)
        update_data = {
            "title": f"Updated Post {post_id}",
            "content": "Updated content",
            "status": "published"
        }
        
        self.client.put(
            f"/api/posts/{post_id}",
            json=update_data,
            headers=self.headers,
            name="/api/posts/{id} [PUT]"
        )


class AdminUser(HttpUser):
    """Simulate admin operations"""
    
    wait_time = between(10, 20)
    host = "http://localhost:8000"
    
    def on_start(self):
        """Login as admin"""
        response = self.client.post("/api/auth/login", data={
            "username": "admin@example.com",
            "password": "admin123"
        })
        
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task
    def view_all_users(self):
        """Test GET /api/users endpoint"""
        self.client.get(
            "/api/users",
            headers=self.headers,
            name="/api/users"
        )
    
    @task
    def view_stats(self):
        """Test admin statistics"""
        self.client.get(
            "/api/stats/dashboard",
            headers=self.headers,
            name="/api/stats/dashboard [admin]"
        )
    
    @task
    def manage_cache(self):
        """Test cache management"""
        self.client.get(
            "/api/cache",
            headers=self.headers,
            name="/api/cache"
        )


if __name__ == "__main__":
    import os
    os.system("locust -f scripts/load-test.py --host=http://localhost:8000")
