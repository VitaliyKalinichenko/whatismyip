import { generateMetadata as generateMeta, pageMetadata } from '@/lib/metadata';
import BlogClient from './blog-client';

// Export metadata for SEO
export const metadata = generateMeta(pageMetadata.blog);

export default function BlogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* SEO H1 Tag */}
          <h1 className="text-4xl font-bold mb-8 text-center text-foreground">
            {pageMetadata.blog.h1}
          </h1>
          
          {/* Dynamic Blog Content */}
          <BlogClient />
        </div>
      </div>
  );
} 