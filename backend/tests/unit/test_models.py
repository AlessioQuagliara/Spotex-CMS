"""
Unit tests for database models
"""
import pytest
from datetime import datetime
from app.models.user import User
from app.models.post import Post
from app.models.category import Category
from app.models.page import Page
from app.models.media import Media


@pytest.mark.unit
class TestUserModel:
    """Test User model"""
    
    def test_user_creation(self, db):
        """Test creating a user"""
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password="hashed_password",
            full_name="Test User",
            role="author"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.role == "author"
        assert user.is_active is True
        assert isinstance(user.created_at, datetime)
    
    def test_user_email_unique(self, db, test_user):
        """Test email uniqueness constraint"""
        duplicate_user = User(
            email=test_user.email,
            username="different",
            hashed_password="password"
        )
        db.add(duplicate_user)
        
        with pytest.raises(Exception):
            db.commit()
    
    def test_user_roles(self, db):
        """Test different user roles"""
        roles = ["admin", "editor", "author", "subscriber"]
        
        for role in roles:
            user = User(
                email=f"{role}@example.com",
                username=role,
                hashed_password="password",
                role=role
            )
            db.add(user)
            db.commit()
            assert user.role == role


@pytest.mark.unit
class TestPostModel:
    """Test Post model"""
    
    def test_post_creation(self, db, test_user, test_category):
        """Test creating a post"""
        post = Post(
            title="Test Post",
            slug="test-post",
            content="Post content",
            excerpt="Post excerpt",
            status="draft",
            author_id=test_user.id,
            category_id=test_category.id
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        
        assert post.id is not None
        assert post.title == "Test Post"
        assert post.slug == "test-post"
        assert post.status == "draft"
        assert post.views == 0
        assert isinstance(post.created_at, datetime)
    
    def test_post_slug_unique(self, db, test_user, test_category):
        """Test slug uniqueness"""
        post1 = Post(
            title="Post 1",
            slug="same-slug",
            content="Content 1",
            author_id=test_user.id,
            category_id=test_category.id
        )
        db.add(post1)
        db.commit()
        
        post2 = Post(
            title="Post 2",
            slug="same-slug",
            content="Content 2",
            author_id=test_user.id,
            category_id=test_category.id
        )
        db.add(post2)
        
        with pytest.raises(Exception):
            db.commit()
    
    def test_post_author_relationship(self, test_post, test_user):
        """Test post-author relationship"""
        assert test_post.author_id == test_user.id
        assert test_post.author.email == test_user.email
    
    def test_post_category_relationship(self, test_post, test_category):
        """Test post-category relationship"""
        assert test_post.category_id == test_category.id
        assert test_post.category.name == test_category.name
    
    def test_post_views_increment(self, db, test_post):
        """Test incrementing post views"""
        initial_views = test_post.views
        test_post.views += 1
        db.commit()
        db.refresh(test_post)
        
        assert test_post.views == initial_views + 1


@pytest.mark.unit
class TestCategoryModel:
    """Test Category model"""
    
    def test_category_creation(self, db):
        """Test creating a category"""
        category = Category(
            name="Test Category",
            slug="test-category",
            description="Test description"
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        
        assert category.id is not None
        assert category.name == "Test Category"
        assert category.slug == "test-category"
        assert isinstance(category.created_at, datetime)
    
    def test_category_slug_unique(self, db, test_category):
        """Test category slug uniqueness"""
        duplicate = Category(
            name="Different Name",
            slug=test_category.slug
        )
        db.add(duplicate)
        
        with pytest.raises(Exception):
            db.commit()
    
    def test_category_posts_relationship(self, test_category, test_post):
        """Test category-posts relationship"""
        assert len(test_category.posts) > 0
        assert test_post in test_category.posts


@pytest.mark.unit
class TestPageModel:
    """Test Page model"""
    
    def test_page_creation(self, db):
        """Test creating a page"""
        page = Page(
            title="Test Page",
            slug="test-page",
            content="Page content",
            template="default",
            status="published"
        )
        db.add(page)
        db.commit()
        db.refresh(page)
        
        assert page.id is not None
        assert page.title == "Test Page"
        assert page.template == "default"
        assert isinstance(page.created_at, datetime)
    
    def test_page_templates(self, db):
        """Test different page templates"""
        templates = ["default", "landing", "contact", "about"]
        
        for template in templates:
            page = Page(
                title=f"{template} page",
                slug=f"{template}-page",
                content="Content",
                template=template
            )
            db.add(page)
            db.commit()
            assert page.template == template


@pytest.mark.unit
class TestMediaModel:
    """Test Media model"""
    
    def test_media_creation(self, db, test_user):
        """Test creating media"""
        media = Media(
            filename="image.jpg",
            original_filename="original.jpg",
            file_path="/uploads/image.jpg",
            file_size=1024000,
            mime_type="image/jpeg",
            uploaded_by=test_user.id
        )
        db.add(media)
        db.commit()
        db.refresh(media)
        
        assert media.id is not None
        assert media.filename == "image.jpg"
        assert media.file_size == 1024000
        assert isinstance(media.created_at, datetime)
    
    def test_media_uploader_relationship(self, test_media, test_user):
        """Test media-uploader relationship"""
        assert test_media.uploaded_by == test_user.id
        assert test_media.uploader.email == test_user.email
    
    def test_media_file_size_validation(self, db, test_user):
        """Test file size is positive"""
        media = Media(
            filename="large.jpg",
            original_filename="large.jpg",
            file_path="/uploads/large.jpg",
            file_size=10485760,  # 10MB
            mime_type="image/jpeg",
            uploaded_by=test_user.id
        )
        db.add(media)
        db.commit()
        
        assert media.file_size > 0
