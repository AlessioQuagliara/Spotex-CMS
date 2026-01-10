"""
Pytest configuration and shared fixtures
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import sys
import os

# Add app to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.main import app
from app.database.database import Base, get_db
from app.models.user import User
from app.models.post import Post
from app.models.category import Category
from app.models.page import Page
from app.models.media import Media
from app.middleware.auth import create_access_token

# Test database
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """Create test database and tables"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """Create test client with test database"""
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    """Create test user"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=pwd_context.hash("password123"),
        full_name="Test User",
        role="author",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db):
    """Create admin user"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    user = User(
        email="admin@example.com",
        username="admin",
        hashed_password=pwd_context.hash("admin123"),
        full_name="Admin User",
        role="admin",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_token(test_user):
    """Generate auth token for test user"""
    return create_access_token(data={"sub": test_user.email})


@pytest.fixture
def admin_token(admin_user):
    """Generate auth token for admin user"""
    return create_access_token(data={"sub": admin_user.email})


@pytest.fixture
def test_category(db):
    """Create test category"""
    category = Category(
        name="Test Category",
        slug="test-category",
        description="Test category description"
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.fixture
def test_post(db, test_user, test_category):
    """Create test post"""
    post = Post(
        title="Test Post",
        slug="test-post",
        content="Test post content",
        excerpt="Test excerpt",
        status="published",
        author_id=test_user.id,
        category_id=test_category.id,
        featured_image="https://example.com/image.jpg",
        meta_title="Test Meta Title",
        meta_description="Test meta description",
        views=0
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@pytest.fixture
def test_page(db):
    """Create test page"""
    page = Page(
        title="Test Page",
        slug="test-page",
        content="Test page content",
        template="default",
        status="published",
        meta_title="Test Page Meta",
        meta_description="Test page meta description"
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


@pytest.fixture
def test_media(db, test_user):
    """Create test media"""
    media = Media(
        filename="test-image.jpg",
        original_filename="test-image.jpg",
        file_path="/uploads/test-image.jpg",
        file_size=1024000,
        mime_type="image/jpeg",
        alt_text="Test image",
        uploaded_by=test_user.id
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    return media


@pytest.fixture
def auth_headers(auth_token):
    """Return authorization headers"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def admin_headers(admin_token):
    """Return admin authorization headers"""
    return {"Authorization": f"Bearer {admin_token}"}
