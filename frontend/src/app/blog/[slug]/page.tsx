import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, Tag, ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { Metadata } from 'next';
import { ShareButton } from './share-button';
import { sanitizeHtml } from '@/lib/security';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
  featured_image: string | null;
  seo_title?: string;
  seo_description?: string;
}

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// Function to fetch blog post data
async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://whatismyip.world' 
      : 'http://localhost:8000';

    const response = await fetch(`${baseUrl}/api/v1/blog/posts/${slug}`, {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch blog post');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

// Generate metadata for SEO & OpenGraph
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getBlogPost(params.slug);

  const fallbackImage = "/og-image.png";

  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
      icons: {
        icon: "/favicon.ico",
        shortcut: "/favicon.ico",
        apple: "/apple-touch-icon.png",
      },
      openGraph: {
        title: 'Blog Post Not Found',
        description: 'The requested blog post could not be found.',
        images: [
          {
            url: fallbackImage,
            width: 1200,
            height: 630,
            alt: "Blog Article - whatismyip.world",
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Blog Post Not Found',
        description: 'The requested blog post could not be found.',
        images: [fallbackImage],
      },
    };
  }

  const ogImage = post.featured_image && post.featured_image.trim() !== ''
    ? post.featured_image
    : fallbackImage;

  return {
    title: post.seo_title || post.title,
    description: post.seo_description || post.excerpt,
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: [post.author],
      tags: post.tags || [],
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      images: [ogImage],
    },
  };
}

// Format date helper function
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
};

// Calculate reading time
const calculateReadingTime = (content: string) => {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
};

// Main component
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getBlogPost(params.slug);

  if (!post || !post.content) {
    notFound();
  }

  const sanitizedContent = sanitizeHtml(post.content || '');
  const readingTime = calculateReadingTime(post.content);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto overflow-hidden">
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="pb-6">
              <div className="space-y-4">
                {/* Title */}
                <CardTitle className="text-3xl md:text-4xl font-bold leading-tight">
                  {post.title}
                </CardTitle>

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(post.published_at || post.created_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {readingTime} min read
                  </div>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* Featured Image */}
              {post.featured_image && post.featured_image.trim() !== '' && (
                <div className="mb-8">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose prose-lg max-w-full dark:prose-invert prose-headings:font-semibold prose-p:leading-7 prose-li:leading-6 prose-img:max-w-full prose-img:h-auto prose-pre:overflow-x-auto prose-pre:max-w-full prose-table:max-w-full prose-table:overflow-x-auto blog-content">
                <div 
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                  className="break-words overflow-wrap-anywhere"
                />
              </div>

              {/* Share Actions */}
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <ShareButton title={post.title} excerpt={post.excerpt || ''} />
              </div>
            </CardContent>
          </Card>

          {/* Navigation to other posts */}
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link href="/blog">
                View All Posts
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

