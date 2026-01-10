"""
Unit tests for utility functions
"""
import pytest
from app.utils.slug import generate_slug
from app.utils.cache import get_cache_key, invalidate_cache_pattern


@pytest.mark.unit
class TestSlugUtils:
    """Test slug generation utilities"""
    
    def test_generate_slug_basic(self):
        """Test basic slug generation"""
        assert generate_slug("Hello World") == "hello-world"
        assert generate_slug("Test Post Title") == "test-post-title"
    
    def test_generate_slug_special_chars(self):
        """Test slug with special characters"""
        assert generate_slug("Hello! World?") == "hello-world"
        assert generate_slug("Test@Post#Title") == "testposttitle"
        assert generate_slug("One & Two") == "one-two"
    
    def test_generate_slug_unicode(self):
        """Test slug with unicode characters"""
        assert generate_slug("Café Paris") == "cafe-paris"
        assert generate_slug("Über Test") == "uber-test"
        assert generate_slug("Résumé") == "resume"
    
    def test_generate_slug_numbers(self):
        """Test slug with numbers"""
        assert generate_slug("Post 123") == "post-123"
        assert generate_slug("2024 Guide") == "2024-guide"
    
    def test_generate_slug_multiple_spaces(self):
        """Test slug with multiple spaces"""
        assert generate_slug("Hello    World") == "hello-world"
        assert generate_slug("Test  Post   Title") == "test-post-title"
    
    def test_generate_slug_leading_trailing_spaces(self):
        """Test slug with leading/trailing spaces"""
        assert generate_slug("  Hello World  ") == "hello-world"
        assert generate_slug("   Test   ") == "test"
    
    def test_generate_slug_empty(self):
        """Test slug generation with empty string"""
        assert generate_slug("") == ""
        assert generate_slug("   ") == ""
    
    def test_generate_slug_only_special_chars(self):
        """Test slug with only special characters"""
        assert generate_slug("!!!") == ""
        assert generate_slug("@#$%") == ""


@pytest.mark.unit
class TestCacheUtils:
    """Test cache utility functions"""
    
    def test_get_cache_key_simple(self):
        """Test simple cache key generation"""
        key = get_cache_key("posts", "list")
        assert key == "posts:list"
    
    def test_get_cache_key_with_params(self):
        """Test cache key with parameters"""
        key = get_cache_key("posts", "detail", id=123)
        assert "posts:detail" in key
        assert "123" in key
    
    def test_get_cache_key_with_multiple_params(self):
        """Test cache key with multiple parameters"""
        key = get_cache_key("posts", "list", page=1, limit=10, status="published")
        assert "posts:list" in key
        assert all(str(v) in key for v in [1, 10, "published"])
    
    def test_get_cache_key_consistency(self):
        """Test cache key generation is consistent"""
        key1 = get_cache_key("posts", "list", page=1, limit=10)
        key2 = get_cache_key("posts", "list", page=1, limit=10)
        assert key1 == key2
    
    def test_cache_key_ordering(self):
        """Test cache key is same regardless of param order"""
        key1 = get_cache_key("posts", "list", page=1, limit=10, status="published")
        key2 = get_cache_key("posts", "list", status="published", limit=10, page=1)
        assert key1 == key2
    
    def test_invalidate_cache_pattern(self):
        """Test cache pattern invalidation"""
        pattern = invalidate_cache_pattern("posts")
        assert "posts:*" in pattern or "posts" in pattern
    
    def test_cache_key_special_chars(self):
        """Test cache key with special characters"""
        key = get_cache_key("posts", "search", query="hello world!")
        assert key is not None
        assert "posts:search" in key


@pytest.mark.unit
class TestPasswordValidation:
    """Test password validation utilities"""
    
    def test_valid_passwords(self):
        """Test valid password patterns"""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        valid_passwords = [
            "Password123!",
            "StrongP@ss1",
            "MyP@ssw0rd",
            "Test1234!@"
        ]
        
        for password in valid_passwords:
            hashed = pwd_context.hash(password)
            assert pwd_context.verify(password, hashed)
    
    def test_password_hashing_unique(self):
        """Test password hashing produces unique hashes"""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        password = "TestPassword123!"
        hash1 = pwd_context.hash(password)
        hash2 = pwd_context.hash(password)
        
        # Different hashes due to salt
        assert hash1 != hash2
        # But both verify correctly
        assert pwd_context.verify(password, hash1)
        assert pwd_context.verify(password, hash2)
    
    def test_password_verification_fails(self):
        """Test wrong password doesn't verify"""
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        password = "CorrectPassword123!"
        hashed = pwd_context.hash(password)
        
        assert not pwd_context.verify("WrongPassword123!", hashed)


@pytest.mark.unit
class TestEmailValidation:
    """Test email validation utilities"""
    
    def test_valid_emails(self):
        """Test valid email formats"""
        import re
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        valid_emails = [
            "test@example.com",
            "user.name@example.com",
            "user+tag@example.co.uk",
            "test123@test-domain.com"
        ]
        
        for email in valid_emails:
            assert re.match(email_regex, email)
    
    def test_invalid_emails(self):
        """Test invalid email formats"""
        import re
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        invalid_emails = [
            "notanemail",
            "@example.com",
            "user@",
            "user @example.com",
            "user@.com"
        ]
        
        for email in invalid_emails:
            assert not re.match(email_regex, email)
