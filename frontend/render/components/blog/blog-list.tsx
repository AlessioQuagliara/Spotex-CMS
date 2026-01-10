"use client";

import { useLocalization } from "@/contexts/localization-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, ArrowRight } from "lucide-react";
import Image from "next/image";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  publishedAt: string;
  category: string;
  readTime: number;
  tags: string[];
}

interface BlogListProps {
  posts: BlogPost[];
}

export function BlogList({ posts }: BlogListProps) {
  const { t, formatDate } = useLocalization();

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">{t("blog.latestPosts")}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden group">
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={post.image}
                alt={post.title}
                fill
                className="object-cover transition-transform group-hover:scale-110"
              />
              <Badge className="absolute top-4 left-4">
                {post.category}
              </Badge>
            </div>
            
            <CardContent className="p-6">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {post.author}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime} min
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                {post.title}
              </h3>
              
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {formatDate(post.publishedAt)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = `/blog/${post.slug}`)}
                >
                  {t("blog.readMore")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
