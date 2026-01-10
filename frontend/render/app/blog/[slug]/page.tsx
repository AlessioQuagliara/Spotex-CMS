/**
 * Blog Post Page with SEO optimization
 */
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  generateMetadata as genMeta,
  generateArticleStructuredData,
  generateBreadcrumbStructuredData,
  calculateReadingTime,
} from '@/lib/seo';
import { StructuredDataComponent } from '@/components/seo/structured-data';
import { Calendar, User, Clock, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data - Replace with API call
async function getPost(slug: string) {
  // TODO: Fetch from API
  return {
    id: 1,
    title: 'Guida completa a Next.js 15',
    slug: 'guida-nextjs-15',
    content: `
      <h2>Introduzione</h2>
      <p>Next.js 15 introduce nuove funzionalità rivoluzionarie...</p>
      <h2>Cosa c'è di nuovo</h2>
      <p>Le principali novità includono...</p>
    `,
    excerpt: 'Scopri tutte le novità di Next.js 15 con esempi pratici e guide dettagliate',
    featured_image: '/images/nextjs-15.jpg',
    published_at: '2026-01-10T10:00:00Z',
    updated_at: '2026-01-10T15:00:00Z',
    author: {
      id: 1,
      username: 'Mario Rossi',
    },
    category: {
      id: 1,
      name: 'Web Development',
      slug: 'web-development',
    },
    tags: ['nextjs', 'react', 'javascript', 'web'],
    seo_title: 'Guida Next.js 15 - Tutorial completo 2026',
    seo_description:
      'Tutorial completo su Next.js 15: scopri le nuove funzionalità, esempi pratici e best practices per sviluppatori',
    seo_keywords: 'nextjs, next.js 15, react, tutorial, javascript, web development',
    views: 1250,
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);

  if (!post) {
    return {
      title: 'Post non trovato',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';

  return genMeta(
    {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      keywords: post.seo_keywords,
      canonical: `/blog/${post.slug}`,
      image: post.featured_image,
      ogType: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      author: post.author.username,
      section: post.category.name,
    },
    baseUrl
  );
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';
  const readingTime = calculateReadingTime(post.content);

  // Generate structured data
  const articleStructuredData = generateArticleStructuredData(
    {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      publishedDate: post.published_at,
      modifiedDate: post.updated_at,
      authorName: post.author.username,
      image: post.featured_image,
    },
    baseUrl
  );

  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: 'Home', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.category.name, url: `/category/${post.category.slug}` },
    { name: post.title, url: `/blog/${post.slug}` },
  ]);

  return (
    <>
      <StructuredDataComponent data={[articleStructuredData, breadcrumbStructuredData]} />

      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-8">
          <a href="/" className="hover:text-foreground">
            Home
          </a>
          <span>/</span>
          <a href="/blog" className="hover:text-foreground">
            Blog
          </a>
          <span>/</span>
          <a href={`/category/${post.category.slug}`} className="hover:text-foreground">
            {post.category.name}
          </a>
          <span>/</span>
          <span className="text-foreground">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{post.author.username}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={post.published_at}>
                {new Date(post.published_at).toLocaleDateString('it-IT', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{readingTime} min di lettura</span>
            </div>
          </div>

          {post.featured_image && (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full rounded-lg"
              loading="eager"
            />
          )}
        </header>

        {/* Content */}
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Share buttons (optional) */}
        <div className="mt-8 pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">Condividi questo articolo:</p>
          <div className="flex gap-2">
            {/* Add social share buttons here */}
          </div>
        </div>
      </article>
    </>
  );
}
