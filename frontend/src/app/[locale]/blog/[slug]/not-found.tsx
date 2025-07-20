import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/blog" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <FileQuestion className="h-16 w-16 text-gray-400" />
              </div>
              <CardTitle className="text-3xl font-bold">
                Blog Post Not Found
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Sorry, the blog post you're looking for doesn't exist or has been moved.
              </p>
              
              <div className="space-y-4">
                <Button asChild size="lg">
                  <Link href="/blog">
                    View All Blog Posts
                  </Link>
                </Button>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>
                    If you followed a link to get here, please report the broken link.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 