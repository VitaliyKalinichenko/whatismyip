from fastapi import APIRouter, HTTPException, Depends, status, Query, Request
from typing import Optional, List
from app.models.blog_models import (
    BlogPost, 
    BlogPostCreate, 
    BlogPostUpdate, 
    BlogPostResponse,
    BlogPostsResponse,
    BlogPostStatus,
    BlogAnalytics,
    AdminUser
)
from app.utils.auth import get_current_admin_user
from app.utils.blog_storage import blog_storage
from app.utils.security import sanitize_html_content, sanitize_command_input
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize sample posts if none exist
blog_storage.init_sample_posts()

@router.post("/admin/blog/posts", response_model=BlogPostResponse)
async def create_blog_post(
    post_data: BlogPostCreate,
    request: Request,
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """
    Create a new blog post - Admin only.
    """
    try:
        # 🔒 SECURITY FIX - Sanitize blog content to prevent XSS
        sanitized_data = post_data.dict()
        
        # Sanitize title
        if sanitized_data.get('title'):
            sanitized_data['title'] = sanitize_command_input(
                sanitized_data['title'], 
                max_length=200,
                request=request
            )
        
        # Sanitize excerpt
        if sanitized_data.get('excerpt'):
            sanitized_data['excerpt'] = sanitize_command_input(
                sanitized_data['excerpt'], 
                max_length=500,
                request=request
            )
        
        # Sanitize content (allow HTML but remove dangerous elements)
        if sanitized_data.get('content'):
            sanitized_data['content'] = sanitize_html_content(
                sanitized_data['content'], 
                max_length=50000,
                request=request
            )
        
        # Sanitize SEO fields
        if sanitized_data.get('seo_title'):
            sanitized_data['seo_title'] = sanitize_command_input(
                sanitized_data['seo_title'], 
                max_length=200,
                request=request
            )
        
        if sanitized_data.get('seo_description'):
            sanitized_data['seo_description'] = sanitize_command_input(
                sanitized_data['seo_description'], 
                max_length=500,
                request=request
            )
        
        # Sanitize tags
        if sanitized_data.get('tags'):
            sanitized_tags = []
            for tag in sanitized_data['tags']:
                if isinstance(tag, str) and len(tag) <= 50:
                    sanitized_tag = sanitize_command_input(tag, max_length=50, request=request)
                    if sanitized_tag:
                        sanitized_tags.append(sanitized_tag)
            sanitized_data['tags'] = sanitized_tags[:10]  # Limit to 10 tags
        
        # Create sanitized post data
        sanitized_post_data = BlogPostCreate(**sanitized_data)
        
        blog_post = blog_storage.create_post(sanitized_post_data, current_user.full_name)
        
        logger.info(f"Blog post created: {blog_post.title} by {current_user.email}")
        
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
        logger.error(f"Failed to create blog post: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create blog post"
        )

@router.get("/admin/blog/posts", response_model=BlogPostsResponse)
async def get_blog_posts_admin(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(10, ge=1, le=50, description="Posts per page"),
    status_filter: Optional[BlogPostStatus] = Query(None, description="Filter by status"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """
    Get paginated blog posts for admin - Admin only.
    """
    try:
        posts, total = blog_storage.get_posts(
            status=status_filter,
            page=page,
            per_page=per_page,
            tag=tag
        )
        
        posts_response = [
            {
                "id": post.id,
                "title": post.title,
                "slug": post.slug,
                "excerpt": post.excerpt,
                "author": post.author,
                "status": post.status,
                "tags": post.tags,
                "created_at": post.created_at,
                "updated_at": post.updated_at,
                "published_at": post.published_at,
                "featured_image": post.featured_image
            }
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
        logger.error(f"Failed to get blog posts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve blog posts"
        )

@router.get("/admin/blog/posts/{post_id}", response_model=BlogPostResponse)
async def get_blog_post_admin(
    post_id: str,
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """
    Get a specific blog post for admin - Admin only.
    """
    try:
        blog_post = blog_storage.get_post(post_id)
        if not blog_post:
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
        logger.error(f"Failed to get blog post {post_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve blog post"
        )

@router.put("/admin/blog/posts/{post_id}", response_model=BlogPostResponse)
async def update_blog_post(
    post_id: str,
    post_data: BlogPostUpdate,
    request: Request,
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """
    Update a blog post - Admin only.
    """
    try:
        # 🔒 SECURITY FIX - Sanitize blog content to prevent XSS
        sanitized_data = post_data.dict(exclude_unset=True)
        
        # Sanitize title
        if sanitized_data.get('title'):
            sanitized_data['title'] = sanitize_command_input(
                sanitized_data['title'], 
                max_length=200,
                request=request
            )
        
        # Sanitize excerpt
        if sanitized_data.get('excerpt'):
            sanitized_data['excerpt'] = sanitize_command_input(
                sanitized_data['excerpt'], 
                max_length=500,
                request=request
            )
        
        # Sanitize content (allow HTML but remove dangerous elements)
        if sanitized_data.get('content'):
            sanitized_data['content'] = sanitize_html_content(
                sanitized_data['content'], 
                max_length=50000,
                request=request
            )
        
        # Sanitize SEO fields
        if sanitized_data.get('seo_title'):
            sanitized_data['seo_title'] = sanitize_command_input(
                sanitized_data['seo_title'], 
                max_length=200,
                request=request
            )
        
        if sanitized_data.get('seo_description'):
            sanitized_data['seo_description'] = sanitize_command_input(
                sanitized_data['seo_description'], 
                max_length=500,
                request=request
            )
        
        # Sanitize tags
        if sanitized_data.get('tags'):
            sanitized_tags = []
            for tag in sanitized_data['tags']:
                if isinstance(tag, str) and len(tag) <= 50:
                    sanitized_tag = sanitize_command_input(tag, max_length=50, request=request)
                    if sanitized_tag:
                        sanitized_tags.append(sanitized_tag)
            sanitized_data['tags'] = sanitized_tags[:10]  # Limit to 10 tags
        
        # Create sanitized post data
        sanitized_post_data = BlogPostUpdate(**sanitized_data)
        
        blog_post = blog_storage.update_post(post_id, sanitized_post_data)
        if not blog_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog post not found"
            )
        
        logger.info(f"Blog post updated: {blog_post.title} by {current_user.email}")
        
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
        logger.error(f"Failed to update blog post {post_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update blog post"
        )

@router.delete("/admin/blog/posts/{post_id}")
async def delete_blog_post(
    post_id: str,
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """
    Delete a blog post - Admin only.
    """
    try:
        success = blog_storage.delete_post(post_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog post not found"
            )
        
        logger.info(f"Blog post deleted: {post_id} by {current_user.email}")
        
        return {"message": "Blog post deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete blog post {post_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete blog post"
        )

@router.get("/admin/blog/tags", response_model=List[str])
async def get_blog_tags(
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """
    Get all blog tags - Admin only.
    """
    try:
        tags = blog_storage.get_tags()
        return tags
        
    except Exception as e:
        logger.error(f"Failed to get blog tags: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve blog tags"
        )

@router.get("/admin/blog/analytics", response_model=BlogAnalytics)
async def get_blog_analytics(
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """
    Get blog analytics data - Admin only.
    """
    try:
        analytics = blog_storage.get_analytics()
        
        return BlogAnalytics(
            total_posts=analytics["total_posts"],
            published_posts=analytics["published_posts"],
            draft_posts=analytics["draft_posts"],
            total_views=analytics["total_views"],
            popular_tags=analytics["popular_tags"],
            recent_posts=analytics["recent_posts"]
        )
        
    except Exception as e:
        logger.error(f"Failed to get blog analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve blog analytics"
        )

@router.post("/admin/blog/posts/{post_id}/publish")
async def publish_blog_post(
    post_id: str,
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """
    Publish a blog post - Admin only.
    """
    try:
        post_data = BlogPostUpdate(status=BlogPostStatus.PUBLISHED)
        blog_post = blog_storage.update_post(post_id, post_data)
        
        if not blog_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog post not found"
            )
        
        logger.info(f"Blog post published: {blog_post.title} by {current_user.email}")
        
        return {
            "message": "Blog post published successfully",
            "post_id": post_id,
            "published_at": blog_post.published_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to publish blog post {post_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to publish blog post"
        )

@router.post("/admin/blog/posts/{post_id}/unpublish")
async def unpublish_blog_post(
    post_id: str,
    current_user: AdminUser = Depends(get_current_admin_user)
):
    """
    Unpublish a blog post (set to draft) - Admin only.
    """
    try:
        post_data = BlogPostUpdate(status=BlogPostStatus.DRAFT)
        blog_post = blog_storage.update_post(post_id, post_data)
        
        if not blog_post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Blog post not found"
            )
        
        logger.info(f"Blog post unpublished: {blog_post.title} by {current_user.email}")
        
        return {
            "message": "Blog post unpublished successfully",
            "post_id": post_id,
            "status": blog_post.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to unpublish blog post {post_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unpublish blog post"
        ) 