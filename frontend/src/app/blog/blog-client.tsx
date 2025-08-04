"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Shield, Eye, Search, Calendar, User, Tag, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
  featured_image: string | null;
}

interface BlogResponse {
  posts: BlogPost[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Окремий компонент для тегів з інтерактивністю
function TagButton({ 
  tag, 
  isSelected, 
  onSelect 
}: { 
  tag: string; 
  isSelected: boolean; 
  onSelect: (tag: string) => void; 
}) {
  return (
    <button
      onClick={() => onSelect(tag)}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        isSelected
          ? "bg-blue-600 text-white"
          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
      }`}
    >
      {tag}
    </button>
  );
}

// Окремий компонент для тегів в картці поста
function PostTagBadge({ 
  tag, 
  onSelect 
}: { 
  tag: string; 
  onSelect: (tag: string) => void; 
}) {
  return (
    <Badge
      variant="secondary"
      className="text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
      onClick={() => onSelect(tag)}
    >
      <Tag className="h-3 w-3 mr-1" />
      {tag}
    </Badge>
  );
}

export default function BlogClient() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    fetchPosts();
    fetchTags();
  }, [currentPage, selectedTag]);

  const fetchPosts = async () => {
  try {
    setLoading(true);
    const params = new URLSearchParams({
      page: currentPage.toString(),
      per_page: "6"
    });
    
    if (selectedTag) {
      params.append("tag", selectedTag);
    }

    console.log('🔍 Fetching posts from:', `/api/v1/blog/posts?${params}`);

    const response = await fetch(`/api/v1/blog/posts?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch blog posts`);
    }
    
    const data: BlogResponse = await response.json();
    
    console.log('📦 Raw API response:', data);
    console.log('📋 Posts array:', data.posts);
    console.log('📊 Total posts:', data.total);
    
    // 🔥 ПЕРЕВІРЯЄМО ЧИ Є ПОСТИ
    if (!data.posts || !Array.isArray(data.posts)) {
      console.error('❌ Posts is not an array:', data.posts);
      setPosts([]);
      setTotalPages(0);
      return;
    }
    
    // 🔥 ФІЛЬТРУЄМО ТІЛЬКИ PUBLISHED ПОСТИ (додаткова перевірка)
    const publishedPosts = data.posts.filter(post => {
      console.log(`📝 Post "${post.title}" has status: "${post.status}"`);
      return post.status === 'published';
    });
    
    console.log('✅ Published posts after filter:', publishedPosts);
    console.log('📊 Published posts count:', publishedPosts.length);
    
    setPosts(publishedPosts);
    setTotalPages(data.total_pages || 1);
    
    if (publishedPosts.length === 0) {
      console.warn('⚠️ No published posts found! Check if posts have status="published"');
    }
    
  } catch (err) {
    console.error('❌ Error fetching posts:', err);
    setError(err instanceof Error ? err.message : "An error occurred");
  } finally {
    setLoading(false);
  }
};

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/v1/blog/tags");
      if (response.ok) {
        const tags = await response.json();
        setAvailableTags(tags);
      }
    } catch (err) {
      console.error("Failed to fetch tags:", err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search functionality can be implemented here
    // For now, we'll just filter on the frontend
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(selectedTag === tag ? null : tag);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const clearFilters = () => {
    setSelectedTag(null);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchTerm === "" || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading && posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading blog posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <Search className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-semibold">Error Loading Posts</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button onClick={fetchPosts} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        <div className="text-center mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <div><strong>Debug Info:</strong></div>
        <div>API Posts: {posts.length} | Loading: {loading ? 'yes' : 'no'} | Error: {error || 'none'}</div>
        {posts.length > 0 && (
          <div className="mt-1">
            Statuses: {posts.map(p => `"${p.title.substring(0, 20)}..." (${p.status})`).join(' | ')}
          </div>
        )}
        <div className="mt-1">Filtered: {filteredPosts.length} posts shown</div>
      </div>
      {/* Search and Filters */}
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search blog posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
          {(selectedTag || searchTerm) && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
              Filter by tag:
            </span>
            {availableTags.map((tag) => (
              <TagButton
                key={tag}
                tag={tag}
                isSelected={selectedTag === tag}
                onSelect={handleTagSelect}
              />
            ))}
          </div>
        )}
      </div>

      {/* Blog Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No posts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || selectedTag
              ? "Try adjusting your search or filters."
              : "No blog posts have been published yet."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl font-semibold mb-2 line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(post.published_at || post.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <PostTagBadge
                        key={tag}
                        tag={tag}
                        onSelect={handleTagSelect}
                      />
                    ))}
                  </div>
                )}

                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                >
                  <Link href={`/blog/${post.slug}`}>
                    Read More
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 py-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="w-10"
              >
                {page}
              </Button>
            ))}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
        <h3 className="text-xl font-semibold mb-4 text-center">
          Try Our Network Tools
        </h3>
        <p className="text-center mb-6 text-gray-600 dark:text-gray-400">
          Test your network security and learn more about your internet connection:
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link 
            href="/ip-location"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all shadow-xs h-9 px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <Globe className="h-4 w-4" />
            Check IP Location
          </Link>
          <Link 
            href="/port-checker"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all shadow-xs h-9 px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <Shield className="h-4 w-4" />
            Scan Ports
          </Link>
          <Link 
            href="/dns-lookup"
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all shadow-xs h-9 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Search className="h-4 w-4" />
            DNS Lookup
          </Link>
        </div>
      </div>
    </div>
  );
}
