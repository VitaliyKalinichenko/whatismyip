from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List
from app.models.blog_models import (
    BlogPostResponse,
    BlogPostListResponse,
    BlogPostsResponse,
    BlogPostStatus
)
from app.utils.blog_storage import blog_storage
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/blog/posts", response_model=BlogPostsResponse)
async def get_published_blog_posts(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=50, description="Posts per page"),
    tag: Optional[str] = Query(None, description="Filter by tag")
):
    """
    Get paginated published blog posts - Public endpoint.
    """
    try:
        posts, total = blog_storage.get_posts(
            status=BlogPostStatus.PUBLISHED,
            page=page,
            per_page=per_page,
            tag=tag
        )
        
        posts_response = [
            BlogPostListResponse(
                id=post.id,
                title=post.title,
                slug=post.slug,
                excerpt=post.excerpt,
                author=post.author,
                status=post.status,
                tags=post.tags,
                created_at=post.created_at,
                updated_at=post.updated_at,
                published_at=post.published_at,
                featured_image=post.featured_image
            )
            for post in posts
        ]
        
        total_pages = (total + per_page - 1) // per_page
        
        return BlogPostsResponse(
            posts=posts_response,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"Failed to get published blog posts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve blog posts"
        )

@router.get("/blog/posts/{slug}", response_model=BlogPostResponse)
async def get_blog_post_by_slug(slug: str):
    """
    Get a specific published blog post by slug - Public endpoint.
    """
    try:
        blog_post = blog_storage.get_post_by_slug(slug)
        if not blog_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog post not found"
            )
        
        # Only return published posts to public
        if blog_post.status != BlogPostStatus.PUBLISHED:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog post not found"
            )
        
        return BlogPostResponse(
            id=blog_post.id,
            title=blog_post.title,
            slug=blog_post.slug,
            excerpt=blog_post.excerpt,
            content=blog_post.content,
            author=blog_post.author,
            status=blog_post.status,
            tags=blog_post.tags,
            created_at=blog_post.created_at,
            updated_at=blog_post.updated_at,
            published_at=blog_post.published_at,
            featured_image=blog_post.featured_image,
            seo_title=blog_post.seo_title,
            seo_description=blog_post.seo_description
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get blog post {slug}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve blog post"
        )

@router.get("/blog/tags", response_model=List[str])
async def get_blog_tags():
    """
    Get all blog tags from published posts - Public endpoint.
    """
    try:
        all_tags = blog_storage.get_tags()
        
        # Filter to only include tags from published posts
        published_posts, _ = blog_storage.get_published_posts(page=1, per_page=1000)
        published_tags = set()
        
        for post in published_posts:
            published_tags.update(post.tags)
        
        return sorted(list(published_tags))
        
    except Exception as e:
        logger.error(f"Failed to get blog tags: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve blog tags"
        )

@router.get("/blog/recent", response_model=List[BlogPostListResponse])
async def get_recent_blog_posts(limit: int = Query(5, ge=1, le=20, description="Number of recent posts")):
    """
    Get recent published blog posts - Public endpoint.
    """
    try:
        posts, _ = blog_storage.get_published_posts(page=1, per_page=limit)
        
        return [
            BlogPostListResponse(
                id=post.id,
                title=post.title,
                slug=post.slug,
                excerpt=post.excerpt,
                author=post.author,
                status=post.status,
                tags=post.tags,
                created_at=post.created_at,
                updated_at=post.updated_at,
                published_at=post.published_at,
                featured_image=post.featured_image
            )
            for post in posts
        ]
        
    except Exception as e:
        logger.error(f"Failed to get recent blog posts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recent blog posts"
        ) 