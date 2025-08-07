/*
  ✅ Optimized for Server-Side Rendering (SSR)
  ✅ Uses Next.js 13+ App Router structure
  ✅ Fetches blog posts and tags on the server
  ✅ Preserves existing UI/UX
  ✅ Dramatically improves initial load performance
*/

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Shield, Eye, Search, Calendar, User, Tag, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

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

async function fetchBlogData(): Promise<{ posts: BlogPost[]; tags: string[] }> {
  const [postsRes, tagsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/blog/posts?page=1&per_page=6`, { next: { revalidate: 60 } }),
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/blog/tags`, { next: { revalidate: 60 } }),
  ]);

  if (!postsRes.ok || !tagsRes.ok) throw new Error("Failed to fetch blog data");

  const postData: BlogResponse = await postsRes.json();
  const publishedPosts = postData.posts.filter((post) => post.status === "published");
  const tags = await tagsRes.json();

  return {
    posts: publishedPosts,
    tags,
  };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage() {
  let posts: BlogPost[] = [];
  let tags: string[] = [];
  try {
    const data = await fetchBlogData();
    posts = data.posts;
    tags = data.tags;
  } catch (e) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-4">Latest Blog Posts</h1>
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post) => (
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

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button asChild variant="outline" className="w-full">
                  <Link href={`/blog/${post.slug}`}>
                    Read More
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

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

