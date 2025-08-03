"use client";

// Note: Admin pages are client components and should not be indexed
// Metadata is handled by the layout.tsx file

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { logger } from "@/lib/logger";
import { supabase } from '@/lib/supabaseClient';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  LogOut, 
  Settings, 
  BarChart3, 
  FileText, 
  Calendar,
  Search,
  Filter,
  Save,
  X
} from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  status: "draft" | "published" | "archived";
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
  featured_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  last_login: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<"dashboard" | "posts" | "create" | "edit" | "settings">("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    tags: [] as string[],
    status: "draft" as "draft" | "published" | "archived",
    featured_image: "",
    seo_title: "",
    seo_description: ""
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    router.push("/admin-login");
  };

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const userData = localStorage.getItem("admin_user");

    if (!token || !userData) {
      router.push("/admin-login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      loadPostsFromSupabase();
      loadAnalytics();
    } catch (error) {
      console.error("Invalid user data:", error);
      handleLogout();
    }
  }, []);

  const loadAnalytics = async () => {
    try {
      const { data: allPosts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load analytics:', error);
        return;
      }

      const totalPosts = allPosts.length;
      const publishedPosts = allPosts.filter(post => post.status === 'published').length;
      const draftPosts = allPosts.filter(post => post.status === 'draft').length;
      const recentPosts = allPosts.slice(0, 5);

      setAnalytics({
        total_posts: totalPosts,
        published_posts: publishedPosts,
        draft_posts: draftPosts,
        recent_posts: recentPosts
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || formData.title.length < 1 || formData.title.length > 200) {
      alert("Title must be between 1 and 200 characters");
      return;
    }

    if (!formData.excerpt || formData.excerpt.length < 10 || formData.excerpt.length > 500) {
      alert("Excerpt must be between 10 and 500 characters");
      return;
    }

    if (!formData.content || formData.content.length < 50) {
      alert("Content must be at least 50 characters");
      return;
    }

    if ((formData.tags || []).length > 10) {
      alert("Maximum 10 tags allowed");
      return;
    }

    const slug = formData.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');

    const postData = {
      ...formData,
      slug,
      author: user?.full_name || 'Admin',
      published_at: formData.status === 'published' ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert([postData])
        .select('*'); // 🔥 ВАЖЛИВО: отримуємо створений запис з правильним ID

      if (error) {
        console.error('Failed to create post:', error);
        alert(`Failed to create post: ${error.message}`);
        return;
      }

      console.log('Created post:', data); // Для дебагу
      alert('Post created successfully!');
      setCurrentView("posts");
      resetForm();
      await loadPostsFromSupabase();
      await loadAnalytics();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('An unexpected error occurred while creating the post');
    }
  };

  const loadPostsFromSupabase = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load posts:', error);
        alert(`Failed to load posts: ${error.message}`);
        setLoading(false);
        return;
      }

      console.log('Loaded posts:', data); // Для дебагу
      setPosts(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading posts:', error);
      setLoading(false);
      alert('An unexpected error occurred while loading posts');
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    // Валідація, як у CreatePost
    if (!formData.title || formData.title.length < 1 || formData.title.length > 200) {
      alert("Title must be between 1 and 200 characters");
      return;
    }

    if (!formData.excerpt || formData.excerpt.length < 10 || formData.excerpt.length > 500) {
      alert("Excerpt must be between 10 and 500 characters");
      return;
    }

    if (!formData.content || formData.content.length < 50) {
      alert("Content must be at least 50 characters");
      return;
    }

    if ((formData.tags || []).length > 10) {
      alert("Maximum 10 tags allowed");
      return;
    }

    const updateData = {
      ...formData,
      updated_at: new Date().toISOString(),
      published_at: formData.status === 'published' 
        ? (editingPost.published_at || new Date().toISOString())
        : null
    };

    try {
      console.log('Updating post with ID:', editingPost.id); // Для дебагу
      console.log('Update data:', updateData); // Для дебагу

      const { data, error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', editingPost.id)
        .select('*'); // 🔥 ВАЖЛИВО: отримуємо оновлений запис

      if (error) {
        console.error('Failed to update post:', error);
        alert(`Failed to update post: ${error.message}`);
        return;
      }

      console.log('Updated post:', data); // Для дебагу
      alert("Post updated successfully!");
      setCurrentView("posts");
      setEditingPost(null);
      resetForm();
      await loadPostsFromSupabase();
      await loadAnalytics();
    } catch (error) {
      console.error('Error updating post:', error);
      alert('An unexpected error occurred while updating the post');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      console.log('Deleting post with ID:', postId); // Для дебагу

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) {
        console.error('Failed to delete post:', error);
        alert(`Failed to delete post: ${error.message}`);
        return;
      }

      alert("Post deleted successfully!");
      await loadPostsFromSupabase();
      await loadAnalytics();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An unexpected error occurred while deleting the post');
    }
  };

  // 🔥 ГОЛОВНЕ ВИПРАВЛЕННЯ: Функції publish/unpublish з детальним логуванням
  const handlePublishPost = async (postId: string) => {
    try {
      console.log('Publishing post with ID:', postId); // Для дебагу
      
      // Спочатку перевіряємо, чи існує пост
      const { data: existingPost, error: checkError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (checkError) {
        console.error('Post not found:', checkError);
        alert(`Post not found: ${checkError.message}`);
        return;
      }

      console.log('Found post to publish:', existingPost); // Для дебагу

      const { data, error } = await supabase
        .from('posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select('*'); // 🔥 ВАЖЛИВО: отримуємо оновлений запис

      if (error) {
        console.error('Failed to publish post:', error);
        alert(`Failed to publish post: ${error.message}`);
        return;
      }

      console.log('Published post result:', data); // Для дебагу

      // 🔥 ОНОВЛЮЄМО ПОСТ ЛОКАЛЬНО В STATE
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { 
                ...post, 
                status: 'published' as const, 
                published_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            : post
        )
      );

      alert("Post published successfully!");
      await loadAnalytics(); // Оновлюємо тільки статистику
    } catch (error) {
      console.error('Error publishing post:', error);
      alert("An unexpected error occurred while publishing the post");
    }
  };

  const handleUnpublishPost = async (postId: string) => {
    try {
      console.log('Unpublishing post with ID:', postId); // Для дебагу
      
      // Спочатку перевіряємо, чи існує пост
      const { data: existingPost, error: checkError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (checkError) {
        console.error('Post not found:', checkError);
        alert(`Post not found: ${checkError.message}`);
        return;
      }

      console.log('Found post to unpublish:', existingPost); // Для дебагу

      const { data, error } = await supabase
        .from('posts')
        .update({
          status: 'draft',
          published_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select('*'); // 🔥 ВАЖЛИВО: отримуємо оновлений запис

      if (error) {
        console.error('Failed to unpublish post:', error);
        alert(`Failed to unpublish post: ${error.message}`);
        return;
      }

      console.log('Unpublished post result:', data); // Для дебагу

      // 🔥 ОНОВЛЮЄМО ПОСТ ЛОКАЛЬНО В STATE
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { 
                ...post, 
                status: 'draft' as const, 
                published_at: null,
                updated_at: new Date().toISOString()
              }
            : post
        )
      );

      alert("Post unpublished successfully!");
      await loadAnalytics(); // Оновлюємо тільки статистику
    } catch (error) {
      console.error('Error unpublishing post:', error);
      alert("An unexpected error occurred while unpublishing the post");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert("New passwords do not match!");
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      alert("New password must be at least 8 characters long!");
      return;
    }
    
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/v1/admin/auth/change-password", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      if (response.ok) {
        alert("Password changed successfully!");
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: ""
        });
      } else {
        const error = await response.json();
        alert(`Failed to change password: ${error.detail}`);
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      alert("Failed to change password. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      tags: [],
      status: "draft",
      featured_image: "",
      seo_title: "",
      seo_description: ""
    });
  };

  const startEdit = (post: BlogPost) => {
    console.log('Starting edit for post:', post); // Для дебагу
    setEditingPost(post);
    setFormData({
      title: post.title || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      tags: post.tags || [],
      status: post.status || "draft",
      featured_image: post.featured_image || "",
      seo_title: post.seo_title || "",
      seo_description: post.seo_description || ""
    });
    setCurrentView("edit");
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {user?.full_name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === "dashboard"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2 inline" />
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView("posts")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === "posts"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileText className="h-4 w-4 mr-2 inline" />
              Posts
            </button>
            <button
              onClick={() => setCurrentView("create")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === "create"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Plus className="h-4 w-4 mr-2 inline" />
              Create Post
            </button>
            <button
              onClick={() => setCurrentView("settings")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                currentView === "settings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Settings className="h-4 w-4 mr-2 inline" />
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard View */}
        {currentView === "dashboard" && analytics && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h2>
            
            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Total Posts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{analytics.total_posts}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Published</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{analytics.published_posts}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">Drafts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{analytics.draft_posts}</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Posts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recent_posts.map((post: any) => (
                    <div key={post.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{post.title}</h3>
                        <p className="text-sm text-gray-500">
                          {post.author} • {new Date(post.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(post.status)}>{post.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Posts View */}
        {currentView === "posts" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Posts</h2>
              <Button
                onClick={() => setCurrentView("create")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Posts List */}
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPosts.map((post) => (
                  <li key={post.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {post.title}
                          </h3>
                          <Badge className={`ml-2 ${getStatusColor(post.status)}`}>
                            {post.status}
                          </Badge>
                          {/* 🔥 ДОДАЛИ ID ДЛЯ ДЕБАГУ */}
                          <span className="ml-2 text-xs text-gray-400 font-mono">
                            ID: {post.id.substring(0, 8)}...
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{post.excerpt}</p>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <span>{post.author}</span>
                          <span className="mx-2">•</span>
                          <span>{new Date(post.updated_at).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span>{(post.tags || []).join(", ")}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {post.status === "published" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnpublishPost(post.id)}
                            className="text-green-600 hover:text-green-700"
                            title="Unpublish post"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePublishPost(post.id)}
                            className="text-yellow-600 hover:text-yellow-700"
                            title="Publish post"
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Create/Edit Post View */}
        {(currentView === "create" || currentView === "edit") && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentView === "create" ? "Create New Post" : "Edit Post"}
              </h2>
              <Button
                variant="ghost"
                onClick={() => {
                  setCurrentView("posts");
                  setEditingPost(null);
                  resetForm();
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>

            <form onSubmit={currentView === "create" ? handleCreatePost : handleUpdatePost} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Post Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title (1-200 characters)</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      maxLength={200}
                      required
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      {(formData.title || "").length}/200 characters
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Excerpt (10-500 characters)</Label>
                    <textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                      rows={3}
                      maxLength={500}
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      {(formData.excerpt || "").length}/500 characters (minimum 10)
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content">Content (minimum 50 characters)</Label>
                    <textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      rows={20}
                      className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                      required
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      {(formData.content || "").length} characters (minimum 50)
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma-separated, max 10)</Label>
                    <Input
                      id="tags"
                      value={(formData.tags || []).join(", ")}
                      onChange={(e) => setFormData({
                        ...formData, 
                        tags: e.target.value.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0)
                      })}
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      {(formData.tags || []).length}/10 tags
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="seo_title">SEO Title</Label>
                    <Input
                      id="seo_title"
                      value={formData.seo_title}
                      onChange={(e) => setFormData({...formData, seo_title: e.target.value})}
                      placeholder="Leave empty to use post title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="seo_description">SEO Description</Label>
                    <textarea
                      id="seo_description"
                      value={formData.seo_description}
                      onChange={(e) => setFormData({...formData, seo_description: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder="Leave empty to use post excerpt"
                    />
                  </div>

                  <div>
                    <Label htmlFor="featured_image">Featured Image URL</Label>
                    <Input
                      id="featured_image"
                      type="url"
                      value={formData.featured_image}
                      onChange={(e) => setFormData({...formData, featured_image: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                {currentView === "create" ? "Create Post" : "Update Post"}
              </Button>
            </form>
          </div>
        )}

     

        {/* Settings View */}
        {currentView === "settings" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
            
            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        current_password: e.target.value
                      })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        new_password: e.target.value
                      })}
                      minLength={8}
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        confirm_password: e.target.value
                      })}
                      required
                    />
                  </div>

                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Admin User Info */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Full Name:</strong> {user?.full_name}</p>
                  <p><strong>Role:</strong> {user?.role}</p>
                  <p><strong>Last Login:</strong> {user?.last_login ? new Date(user.last_login).toLocaleString() : "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
} 
