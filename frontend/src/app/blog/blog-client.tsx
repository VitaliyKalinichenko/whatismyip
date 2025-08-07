/*
  ✅ Full SSR Blog Page with Pagination, Tag Filtering, and Search
  ✅ Built for Next.js App Router (`app/blog/page.tsx`)
  ✅ Uses `searchParams` for pagination, search, and tag filters
  ✅ No `use client`, fully SSR
  ✅ Compatible with /api/v1/blog/posts and /api/v1/blog/tags
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function fetchBlogData(page: number, tag: string | null, search: string | null): Promise<{ posts: BlogPost[]; tags: string[]; totalPages: number; currentPage: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: "6",
  });
  if (tag) params.append("tag", tag);
  if (search) params.append("search", search);

  const [postsRes, tagsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/blog/posts?${params.toString()}`, { next: { revalidate: 60 } }),
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/blog/tags`, { next: { revalidate: 60 } }),
  ]);

  if (!postsRes.ok || !tagsRes.ok) throw new Error("Failed to fetch blog data");

  const postData: BlogResponse = await postsRes.json();
  const publishedPosts = postData.posts.filter((post) => post.status === "published");
  const tags = await tagsRes.json();

  return {
    posts: publishedPosts,
    tags,
    totalPages: postData.total_pages,
    currentPage: postData.page,
  };
}

export default async function BlogPage({
  searchParams
}: {
  searchParams?: { page?: string; tag?: string; search?: string };
} = {}) {
  const page = parseInt(searchParams?.page || "1");
  const tag = searchParams?.tag || null;
  const search = searchParams?.search || null;

  let posts: BlogPost[] = [];
  let tags: string[] = [];
  let totalPages = 1;
  let currentPage = page;

  try {
    const data = await fetchBlogData(page, tag, search);
    posts = data.posts;
    tags = data.tags;
    totalPages = data.totalPages;
    currentPage = data.currentPage;
  } catch (e) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* Search + Filter */}
      <form className="flex flex-col md:flex-row gap-4" method="get">
        <Input
          name="search"
          placeholder="Search blog posts..."
          defaultValue={search || ""}
          className="md:flex-1"
        />
        <Button type="submit">Search</Button>
        {(search || tag) && (
          <Link href="/blog" className="btn btn-outline">
            Clear Filters
          </Link>
        )}
      </form>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <Link
              key={t}
              href={`/blog?tag=${t}`}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${t === tag ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"}`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No posts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try changing your filters or search.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
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
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/blog/${post.slug}`}>
                    Read More <ChevronRight className="h-4 w-4 ml-2" />
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
            asChild
            disabled={currentPage === 1}
          >
            <Link href={`/blog?page=${currentPage - 1}${tag ? `&tag=${tag}` : ""}${search ? `&search=${search}` : ""}`}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Link>
          </Button>

          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link href={`/blog?page=${pageNum}${tag ? `&tag=${tag}` : ""}${search ? `&search=${search}` : ""}`}>
                  {pageNum}
                </Link>
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            asChild
            disabled={currentPage === totalPages}
          >
            <Link href={`/blog?page=${currentPage + 1}${tag ? `&tag=${tag}` : ""}${search ? `&search=${search}` : ""}`}>
              Next <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
