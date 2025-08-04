import json
import os
import secrets
from datetime import datetime
from typing import List, Optional, Dict, Any
from app.models.blog_models import BlogPost, BlogPostCreate, BlogPostUpdate, BlogPostStatus, BlogPostListResponse
import logging

logger = logging.getLogger(__name__)

# Storage directory
STORAGE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data")
POSTS_FILE = os.path.join(STORAGE_DIR, "blog_posts.json")

class BlogStorage:
    def __init__(self):
        self.ensure_storage_exists()
        self.posts = self.load_posts()
    
    def ensure_storage_exists(self):
        """Ensure storage directory and file exist."""
        os.makedirs(STORAGE_DIR, exist_ok=True)
        if not os.path.exists(POSTS_FILE):
            with open(POSTS_FILE, 'w') as f:
                json.dump({}, f)
    
    def load_posts(self) -> Dict[str, Dict[str, Any]]:
        """Load all blog posts from storage."""
        try:
            with open(POSTS_FILE, 'r') as f:
                return json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            return {}
    
    def save_posts(self):
        """Save all blog posts to storage."""
        try:
            with open(POSTS_FILE, 'w') as f:
                json.dump(self.posts, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save posts: {e}")
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
        while any(post.get('slug') == slug for post in self.posts.values()):
            slug = f"{base_slug}-{counter}"
            counter += 1
        
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
            "metadata": {},
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
            "published_at": now.isoformat() if post_data.status == BlogPostStatus.PUBLISHED else None,
            "featured_image": post_data.featured_image,
            "seo_title": post_data.seo_title,
            "seo_description": post_data.seo_description
        }
        
        self.posts[post_id] = post_dict
        self.save_posts()
        
        return BlogPost(**post_dict)
    
    def get_post(self, post_id: str) -> Optional[BlogPost]:
        """Get a single blog post by ID."""
        post_data = self.posts.get(post_id)
        if post_data:
            return BlogPost(**post_data)
        return None
    
    def get_post_by_slug(self, slug: str) -> Optional[BlogPost]:
        """Get a single blog post by slug."""
        for post_data in self.posts.values():
            if post_data.get('slug') == slug:
                return BlogPost(**post_data)
        return None
    
    def update_post(self, post_id: str, post_data: BlogPostUpdate) -> Optional[BlogPost]:
        """Update an existing blog post."""
        if post_id not in self.posts:
            return None
        
        post_dict = self.posts[post_id]
        update_data = post_data.dict(exclude_unset=True)
        
        # Handle slug update if title changed
        if "title" in update_data and update_data["title"] != post_dict["title"]:
            update_data["slug"] = self.generate_slug(update_data["title"])
        
        # Handle published_at timestamp
        if "status" in update_data:
            if update_data["status"] == BlogPostStatus.PUBLISHED.value and post_dict["published_at"] is None:
                update_data["published_at"] = datetime.utcnow().isoformat()
            elif update_data["status"] != BlogPostStatus.PUBLISHED.value:
                update_data["published_at"] = None
        
        # Update the post
        post_dict.update(update_data)
        post_dict["updated_at"] = datetime.utcnow().isoformat()
        
        self.posts[post_id] = post_dict
        self.save_posts()
        
        return BlogPost(**post_dict)
    
    def delete_post(self, post_id: str) -> bool:
        """Delete a blog post."""
        if post_id in self.posts:
            del self.posts[post_id]
            self.save_posts()
            return True
        return False
    
    def get_posts(self, 
                  status: Optional[BlogPostStatus] = None,
                  page: int = 1,
                  per_page: int = 10,
                  tag: Optional[str] = None) -> tuple[List[BlogPost], int]:
        """Get paginated list of blog posts."""
        posts_list = list(self.posts.values())
        
        # Filter by status
        if status:
            posts_list = [p for p in posts_list if p.get('status') == status.value]
        
        # Filter by tag
        if tag:
            posts_list = [p for p in posts_list if tag in p.get('tags', [])]
        
        # Sort by updated_at (most recent first)
        posts_list.sort(key=lambda x: x.get('updated_at', ''), reverse=True)
        
        # Pagination
        total = len(posts_list)
        start = (page - 1) * per_page
        end = start + per_page
        paginated_posts = posts_list[start:end]
        
        # Convert to BlogPost objects
        blog_posts = [BlogPost(**post_data) for post_data in paginated_posts]
        
        return blog_posts, total
    
    def get_published_posts(self, page: int = 1, per_page: int = 10) -> tuple[List[BlogPost], int]:
        """Get paginated list of published blog posts."""
        return self.get_posts(status=BlogPostStatus.PUBLISHED, page=page, per_page=per_page)
    
    def get_tags(self) -> List[str]:
        """Get all unique tags used in blog posts."""
        all_tags = set()
        for post in self.posts.values():
            all_tags.update(post.get('tags', []))
        return sorted(list(all_tags))
    
    def get_analytics(self) -> Dict[str, Any]:
        """Get blog analytics data."""
        posts_list = list(self.posts.values())
        
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
                created_at=datetime.fromisoformat(p["created_at"]),
                updated_at=datetime.fromisoformat(p["updated_at"]),
                published_at=datetime.fromisoformat(p["published_at"]) if p.get("published_at") else None,
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
    
    # 🔥 ЗАКОМЕНТОВАНА ФУНКЦІЯ - НЕ СТВОРЮЄМО SAMPLE ПОСТИ
    def init_sample_posts(self):
        """Initialize with sample blog posts if none exist."""
        # ЗАКОМЕНТОВАНО ДЛЯ ВИПРАВЛЕННЯ ПРОБЛЕМИ З ДУБЛЮВАННЯМ ПОСТІВ
        # Тепер пости створюються тільки через адмін панель в Supabase
        logger.info("Sample posts initialization skipped - posts managed through admin panel")
        return
        
        # if not self.posts:
        #     sample_posts = [
        #         {
        #             "title": "How to Hide Your IP Address",
        #             "excerpt": "Learn various methods to protect your privacy and hide your IP address online, including VPNs, proxies, and Tor browser.",
        #             "content": """# How to Hide Your IP Address...""",
        #             "tags": ["privacy", "vpn", "security", "anonymity"]
        #         },
        #         {
        #             "title": "IP Geolocation Explained",
        #             "excerpt": "Understand how IP geolocation works, its accuracy levels, and why your location might sometimes appear incorrect.",
        #             "content": """# IP Geolocation Explained...""",
        #             "tags": ["geolocation", "privacy", "ip-address", "technology"]
        #         }
        #     ]
        #     
        #     for post_data in sample_posts:
        #         post_create = BlogPostCreate(
        #             title=post_data["title"],
        #             excerpt=post_data["excerpt"],
        #             content=post_data["content"],
        #             tags=post_data["tags"],
        #             status=BlogPostStatus.PUBLISHED
        #         )
        #         self.create_post(post_create, "System Administrator")
        #     
        #     logger.info(f"Initialized {len(sample_posts)} sample blog posts")

# Global storage instance
blog_storage = BlogStorage()
