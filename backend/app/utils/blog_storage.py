import os
import secrets
import httpx
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models.blog_models import BlogPost, BlogPostCreate, BlogPostUpdate, BlogPostStatus, BlogPostListResponse
import logging

logger = logging.getLogger(__name__)

class BlogStorage:
    def __init__(self):
        # Get Supabase credentials from environment
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_ANON_KEY")
        
        if not self.supabase_url or not self.supabase_key:
            logger.error("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
            raise ValueError("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required")
        
        # Setup REST API endpoint
        self.api_url = f"{self.supabase_url}/rest/v1"
        self.headers = {
            "apikey": self.supabase_key,
            "Authorization": f"Bearer {self.supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        logger.info("BlogStorage initialized with Supabase REST API")
    
    def _make_request(self, method: str, endpoint: str, data: dict = None, params: dict = None):
        """Make HTTP request to Supabase REST API."""
        url = f"{self.api_url}/{endpoint}"
        
        try:
            with httpx.Client() as client:
                if method == "GET":
                    response = client.get(url, headers=self.headers, params=params)
                elif method == "POST":
                    response = client.post(url, headers=self.headers, json=data)
                elif method == "PATCH":
                    response = client.patch(url, headers=self.headers, json=data, params=params)
                elif method == "DELETE":
                    response = client.delete(url, headers=self.headers, params=params)
                
                response.raise_for_status()
                return response.json() if response.content else []
                
        except Exception as e:
            logger.error(f"Supabase API request failed: {e}")
            raise
    
    def generate_slug(self, title: str) -> str:
        """Generate a URL-friendly slug from title."""
        import re
        slug = re.sub(r'[^a-zA-Z0-9\s-]', '', title.lower())
        slug = re.sub(r'\s+', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        slug = slug.strip('-')
        
        # Ensure uniqueness
        base_slug = slug
        counter = 1
        while True:
            try:
                existing = self._make_request("GET", "posts", params={"slug": f"eq.{slug}", "select": "id"})
                if not existing:
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            except Exception:
                break
        
        return slug
    
    def create_post(self, post_data: BlogPostCreate, author: str) -> BlogPost:
        """Create a new blog post."""
        post_id = secrets.token_urlsafe(16)
        slug = self.generate_slug(post_data.title)
        now = datetime.utcnow()
        
        post_dict = {
            "id": post_id,
            "title": post_data.title,
            "slug": slug,
            "excerpt": post_data.excerpt,
            "content": post_data.content,
            "author": author,
            "status": post_data.status.value,
            "tags": post_data.tags,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "published_at": now.isoformat() if post_data.status == BlogPostStatus.PUBLISHED else None,
            "featured_image": post_data.featured_image,
            "seo_title": post_data.seo_title,
            "seo_description": post_data.seo_description
        }
        
        result = self._make_request("POST", "posts", data=post_dict)
        logger.info(f"Created blog post: {post_data.title}")
        return BlogPost(**result[0])
    
    def get_post(self, post_id: str) -> Optional[BlogPost]:
        """Get a single blog post by ID."""
        try:
            result = self._make_request("GET", "posts", params={"id": f"eq.{post_id}"})
            if result:
                return BlogPost(**result[0])
            return None
        except Exception as e:
            logger.error(f"Failed to get post {post_id}: {e}")
            return None
    
    def get_post_by_slug(self, slug: str) -> Optional[BlogPost]:
        """Get a single blog post by slug."""
        try:
            result = self._make_request("GET", "posts", params={"slug": f"eq.{slug}"})
            if result:
                return BlogPost(**result[0])
            return None
        except Exception as e:
            logger.error(f"Failed to get post by slug {slug}: {e}")
            return None
    
    def update_post(self, post_id: str, post_data: BlogPostUpdate) -> Optional[BlogPost]:
        """Update an existing blog post."""
        try:
            # Get existing post
            existing = self._make_request("GET", "posts", params={"id": f"eq.{post_id}"})
            if not existing:
                return None
            
            post_dict = existing[0]
            update_data = post_data.dict(exclude_unset=True)
            
            # Handle slug update if title changed
            if "title" in update_data and update_data["title"] != post_dict["title"]:
                update_data["slug"] = self.generate_slug(update_data["title"])
            
            # Handle published_at timestamp
            if "status" in update_data:
                if update_data["status"] == BlogPostStatus.PUBLISHED.value and not post_dict.get("published_at"):
                    update_data["published_at"] = datetime.utcnow().isoformat()
                elif update_data["status"] != BlogPostStatus.PUBLISHED.value:
                    update_data["published_at"] = None
            
            # Update timestamp
            update_data["updated_at"] = datetime.utcnow().isoformat()
            
            # Update in database
            result = self._make_request("PATCH", "posts", data=update_data, params={"id": f"eq.{post_id}"})
            
            if result:
                logger.info(f"Updated blog post: {post_id}")
                return BlogPost(**result[0])
            return None
            
        except Exception as e:
            logger.error(f"Failed to update post {post_id}: {e}")
            return None
    
    def delete_post(self, post_id: str) -> bool:
        """Delete a blog post."""
        try:
            result = self._make_request("DELETE", "posts", params={"id": f"eq.{post_id}"})
            logger.info(f"Deleted blog post: {post_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete post {post_id}: {e}")
            return False
    
    def get_posts(self, 
                  status: Optional[BlogPostStatus] = None,
                  page: int = 1,
                  per_page: int = 10,
                  tag: Optional[str] = None) -> tuple[List[BlogPost], int]:
        """Get paginated list of blog posts."""
        try:
            # Build query parameters - ВИПРАВЛЕНИЙ СИНТАКСИС
            params = {
                "select": "*",
                "order": "updated_at.desc"
            }
            
            # Filter by status - ВИПРАВЛЕНИЙ СИНТАКСИС
            if status:
                params["status"] = f"eq.{status.value}"
            
            # Filter by tag - ВИПРАВЛЕНИЙ СИНТАКСИС (якщо потрібно)
            if tag:
                params["tags"] = f"cs.{{{tag}}}"
            
            # Get ALL posts first (without pagination for simplicity)
            url = f"{self.api_url}/posts"
            
            with httpx.Client() as client:
                response = client.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                result = response.json() if response.content else []
            
            # Apply pagination in Python (easier than Supabase syntax)
            total = len(result)
            start = (page - 1) * per_page
            end = start + per_page
            paginated_result = result[start:end]
            
       # Convert to BlogPost objects
            blog_posts = []
            for post_data in paginated_result:
                try:
        # Додаємо відсутні поля з значеннями за замовчуванням
                   post_data_clean = {
                       'id': post_data.get('id', ''),
                       'title': post_data.get('title', ''),
                       'slug': post_data.get('slug', ''),
                       'excerpt': post_data.get('excerpt', ''),
                       'content': post_data.get('content', ''),
                       'author': post_data.get('author', ''),
                       'status': post_data.get('status', 'draft'),
                       'tags': post_data.get('tags', []),
                       'created_at': post_data.get('created_at', ''),
                       'updated_at': post_data.get('updated_at', ''),
                       'published_at': post_data.get('published_at'),
                       'featured_image': post_data.get('featured_image'),
                       'seo_title': post_data.get('seo_title'),
                       'seo_description': post_data.get('seo_description'),
                  }
        
                  blog_posts.append(BlogPost(**post_data_clean))
                  logger.info(f"Successfully parsed post: {post_data.get('title', 'unknown')}")
        
              except Exception as e:
                  logger.error(f"Failed to parse post {post_data.get('id', 'unknown')}: {e}")
                  logger.error(f"Post data: {post_data}")  # Показуємо що саме не парситься
                  continue
    
    def get_published_posts(self, page: int = 1, per_page: int = 10) -> tuple[List[BlogPost], int]:
        """Get paginated list of published blog posts."""
        return self.get_posts(status=BlogPostStatus.PUBLISHED, page=page, per_page=per_page)
    
    def get_tags(self) -> List[str]:
        """Get all unique tags used in blog posts."""
        try:
            # Get all posts and extract tags
            result = self._make_request("GET", "posts", params={"select": "tags"})
            
            all_tags = set()
            for post in result:
                if post.get('tags'):
                    all_tags.update(post['tags'])
            
            return sorted(list(all_tags))
            
        except Exception as e:
            logger.error(f"Failed to get tags: {e}")
            return []
    
    def get_analytics(self) -> Dict[str, Any]:
        """Get blog analytics data."""
        try:
            # Get all posts for analytics
            result = self._make_request("GET", "posts")
            posts_list = result
            
            total_posts = len(posts_list)
            published_posts = len([p for p in posts_list if p.get('status') == BlogPostStatus.PUBLISHED.value])
            draft_posts = len([p for p in posts_list if p.get('status') == BlogPostStatus.DRAFT.value])
            
            # Get popular tags
            tag_counts = {}
            for post in posts_list:
                for tag in post.get('tags', []):
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
            
            popular_tags = [
                {"tag": tag, "count": count}
                for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:5]
            ]
            
            # Get recent posts
            recent_posts = sorted(posts_list, key=lambda x: x.get('updated_at', ''), reverse=True)[:5]
            recent_posts_list = [
                BlogPostListResponse(
                    id=p["id"],
                    title=p["title"],
                    slug=p["slug"],
                    excerpt=p["excerpt"],
                    author=p["author"],
                    status=BlogPostStatus(p["status"]),
                    tags=p.get("tags", []),
                    created_at=datetime.fromisoformat(p["created_at"].replace('Z', '+00:00')),
                    updated_at=datetime.fromisoformat(p["updated_at"].replace('Z', '+00:00')),
                    published_at=datetime.fromisoformat(p["published_at"].replace('Z', '+00:00')) if p.get("published_at") else None,
                    featured_image=p.get("featured_image")
                )
                for p in recent_posts
            ]
            
            return {
                "total_posts": total_posts,
                "published_posts": published_posts,
                "draft_posts": draft_posts,
                "total_views": 0,  # Would need view tracking
                "popular_tags": popular_tags,
                "recent_posts": recent_posts_list
            }
            
        except Exception as e:
            logger.error(f"Failed to get analytics: {e}")
            return {
                "total_posts": 0,
                "published_posts": 0,
                "draft_posts": 0,
                "total_views": 0,
                "popular_tags": [],
                "recent_posts": []
            }
    
    def init_sample_posts(self):
        """Sample posts initialization - now skipped since posts are in Supabase."""
        logger.info("Sample posts initialization skipped - reading from Supabase")
        return

# Global storage instance
blog_storage = BlogStorage()
