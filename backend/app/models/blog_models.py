from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class BlogPostStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

class BlogPost(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    excerpt: str = Field(..., min_length=10, max_length=500)
    content: str = Field(..., min_length=50)
    author: str = Field(..., min_length=1, max_length=100)
    status: BlogPostStatus = BlogPostStatus.DRAFT
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    featured_image: Optional[str] = None
    seo_title: Optional[str] = Field(None, max_length=60)
    seo_description: Optional[str] = Field(None, max_length=160)

    @validator('slug')
    def validate_slug(cls, v):
        import re
        if not re.match(r'^[a-z0-9-]+$', v):
            raise ValueError('Slug must contain only lowercase letters, numbers, and hyphens')
        return v

    @validator('tags', pre=True, always=True)
    def validate_tags(cls, v):
        if v is None:
            return []
        if len(v) > 10:
            raise ValueError('Maximum 10 tags allowed')
        return v

class BlogPostCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    excerpt: str = Field(..., min_length=10, max_length=500)
    content: str = Field(..., min_length=50)
    tags: List[str] = Field(default_factory=list)
    status: BlogPostStatus = BlogPostStatus.DRAFT
    featured_image: Optional[str] = None
    seo_title: Optional[str] = Field(None, max_length=60)
    seo_description: Optional[str] = Field(None, max_length=160)

class BlogPostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    excerpt: Optional[str] = Field(None, min_length=10, max_length=500)
    content: Optional[str] = Field(None, min_length=50)
    tags: Optional[List[str]] = None
    status: Optional[BlogPostStatus] = None
    featured_image: Optional[str] = None
    seo_title: Optional[str] = Field(None, max_length=60)
    seo_description: Optional[str] = Field(None, max_length=160)

class BlogPostResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str
    content: str
    author: str
    status: BlogPostStatus
    tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    featured_image: Optional[str]
    seo_title: Optional[str]
    seo_description: Optional[str]

class BlogPostListResponse(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str
    author: str
    status: BlogPostStatus
    tags: List[str] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    featured_image: Optional[str]

class BlogPostsResponse(BaseModel):
    posts: List[BlogPostListResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

# Admin Authentication Models
class UserRole(str, Enum):
    ADMIN = "admin"
    EDITOR = "editor"

class AdminUser(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.ADMIN
    is_active: bool = True
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    role: UserRole = UserRole.ADMIN

class AdminLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: AdminUser

class TokenData(BaseModel):
    user_id: str
    email: str
    role: str
    exp: int

# Blog Analytics Models
class BlogAnalytics(BaseModel):
    total_posts: int
    published_posts: int
    draft_posts: int
    total_views: int
    popular_tags: List[Dict[str, Any]]
    recent_posts: List[BlogPostListResponse]

# Error Models
class BlogError(BaseModel):
    error: str
    detail: str
    timestamp: datetime
