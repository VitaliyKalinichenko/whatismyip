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
    
    def init_sample_posts(self):
        """Initialize with sample blog posts if none exist."""
        if not self.posts:
            sample_posts = [
                {
                    "title": "How to Hide Your IP Address",
                    "excerpt": "Learn various methods to protect your privacy and hide your IP address online, including VPNs, proxies, and Tor browser.",
                    "content": """# How to Hide Your IP Address

Your IP address is like your digital fingerprint - it reveals your location, ISP, and can be used to track your online activities. Here are the most effective ways to hide your IP address and protect your privacy online.

## Why Hide Your IP Address?

- **Privacy Protection**: Prevent websites and advertisers from tracking your location and browsing habits
- **Bypass Geo-restrictions**: Access content that may be blocked in your region
- **Enhanced Security**: Protect yourself from cyber attacks and surveillance
- **Anonymous Browsing**: Browse the web without revealing your identity

## Methods to Hide Your IP Address

### 1. Virtual Private Network (VPN)
A VPN is the most popular and effective method to hide your IP address. It creates an encrypted tunnel between your device and the internet, routing your traffic through a server in a different location.

**Benefits:**
- Strong encryption
- Easy to use
- Works with all devices
- Can choose server locations

**Recommended VPN Services:**
- ExpressVPN
- NordVPN
- CyberGhost
- Surfshark

### 2. Proxy Servers
Proxy servers act as intermediaries between your device and the internet, hiding your real IP address.

**Types of Proxies:**
- **HTTP Proxies**: For web browsing
- **SOCKS Proxies**: For all types of internet traffic
- **Transparent Proxies**: Don't hide your IP (avoid these)

### 3. Tor Browser
The Tor browser routes your traffic through multiple servers (nodes) before reaching its destination, making it extremely difficult to trace back to you.

**Advantages:**
- Free to use
- Highly anonymous
- Built-in privacy features

**Disadvantages:**
- Slower browsing speeds
- Some websites block Tor traffic

### 4. Mobile Hotspot
Using your mobile phone's hotspot gives you a different IP address than your home network.

## Best Practices for IP Privacy

1. **Use HTTPS websites** whenever possible
2. **Disable location services** for unnecessary apps
3. **Use privacy-focused browsers** like Firefox or Brave
4. **Enable DNS over HTTPS** in your browser
5. **Regularly clear cookies** and browser data

## Conclusion

Hiding your IP address is an essential step in protecting your online privacy. While there are multiple methods available, using a reputable VPN service is generally the most effective and user-friendly approach for most people.

Remember that complete anonymity online is challenging to achieve, but these methods significantly enhance your privacy and security.""",
                    "tags": ["privacy", "vpn", "security", "anonymity"]
                },
                {
                    "title": "IP Geolocation Explained",
                    "excerpt": "Understand how IP geolocation works, its accuracy levels, and why your location might sometimes appear incorrect.",
                    "content": """# IP Geolocation Explained

IP geolocation is the process of determining the geographic location of an internet-connected device based on its IP address. This technology powers many online services, from content delivery to fraud prevention.

## How IP Geolocation Works

IP geolocation works by mapping IP addresses to geographic locations using several data sources:

### 1. Regional Internet Registries (RIRs)
- **IANA**: Internet Assigned Numbers Authority
- **ARIN**: American Registry for Internet Numbers
- **RIPE NCC**: Europe, Middle East, and Central Asia
- **APNIC**: Asia-Pacific region
- **LACNIC**: Latin America and Caribbean
- **AFRINIC**: Africa region

### 2. ISP Data
Internet Service Providers provide location information about their IP address ranges to geolocation databases.

### 3. Active Probing
Geolocation services use network measurements and routing information to estimate locations.

### 4. User-Contributed Data
Some services collect location data from users who voluntarily share their information.

## Accuracy Levels

IP geolocation accuracy varies significantly:

### Country Level
- **Accuracy**: 95-99%
- **Use Cases**: Content licensing, basic fraud prevention

### Region/State Level
- **Accuracy**: 80-90%
- **Use Cases**: Regional content delivery, weather services

### City Level
- **Accuracy**: 50-80%
- **Use Cases**: Local advertising, city-specific services

### Postal Code Level
- **Accuracy**: 20-40%
- **Use Cases**: Targeted marketing, local business recommendations

## Factors Affecting Accuracy

### 1. Connection Type
- **Fixed broadband**: More accurate
- **Mobile networks**: Less accurate due to tower locations
- **Satellite internet**: Often shows incorrect locations

### 2. ISP Practices
- **Static IP blocks**: More accurate
- **Dynamic IP allocation**: Less accurate
- **Proxy services**: Can show ISP location instead of user location

### 3. VPN and Proxy Usage
- **VPN servers**: Show VPN server location
- **Proxy servers**: Show proxy server location
- **Tor networks**: Show exit node location

## Why Geolocation Might Be Wrong

### Common Reasons:
1. **Outdated databases**: IP address assignments change over time
2. **ISP routing**: Traffic routed through distant servers
3. **Corporate networks**: Show headquarters location
4. **Mobile carriers**: Show tower or central office location
5. **Privacy tools**: VPNs, proxies, and Tor obscure real location

## Improving Geolocation Accuracy

### For Developers:
1. **Use multiple providers**: Combine data from different sources
2. **Implement fallbacks**: Use GPS, Wi-Fi, or user input when available
3. **Update regularly**: Keep geolocation databases current
4. **Consider user feedback**: Allow users to correct location data

### For Users:
1. **Disable VPN/proxy**: If you want accurate location
2. **Use direct connection**: Avoid corporate or shared networks
3. **Check with ISP**: Verify your registered address
4. **Update location settings**: In browsers and applications

## Privacy Implications

IP geolocation raises important privacy concerns:

### Data Collection
- **Website tracking**: Sites can log your approximate location
- **Advertising**: Location-based ad targeting
- **Analytics**: Geographic user behavior analysis

### Protection Methods
- **VPN services**: Hide your real location
- **Proxy servers**: Route traffic through different locations
- **Tor browser**: Anonymize your connection

## Legal and Ethical Considerations

### Legitimate Uses:
- **Content licensing**: Enforcing regional content restrictions
- **Fraud prevention**: Detecting suspicious login locations
- **Emergency services**: Locating users in crisis situations
- **Network optimization**: Routing traffic efficiently

### Potential Misuse:
- **Unauthorized tracking**: Monitoring user movements
- **Discrimination**: Blocking users based on location
- **Surveillance**: Government or corporate monitoring

## Conclusion

IP geolocation is a powerful but imperfect technology. While it provides valuable functionality for many online services, users should be aware of its limitations and privacy implications. Understanding how it works helps you make informed decisions about your online privacy and security.

For the most accurate location services, consider using GPS-enabled devices and applications that combine multiple location sources while respecting user privacy preferences.""",
                    "tags": ["geolocation", "privacy", "ip-address", "technology"]
                }
            ]
            
            for post_data in sample_posts:
                post_create = BlogPostCreate(
                    title=post_data["title"],
                    excerpt=post_data["excerpt"],
                    content=post_data["content"],
                    tags=post_data["tags"],
                    status=BlogPostStatus.PUBLISHED
                )
                self.create_post(post_create, "System Administrator")
            
            logger.info(f"Initialized {len(sample_posts)} sample blog posts")

# Global storage instance
blog_storage = BlogStorage() 