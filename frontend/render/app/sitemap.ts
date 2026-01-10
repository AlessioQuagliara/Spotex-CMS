/**
 * Next.js Sitemap Generation
 * Automatically generates sitemap.xml
 */
import { MetadataRoute } from 'next';

// TODO: Fetch from API
async function getAllPosts() {
  return [
    {
      slug: 'guida-nextjs-15',
      updated_at: '2026-01-10T15:00:00Z',
    },
    {
      slug: 'react-best-practices',
      updated_at: '2026-01-08T10:00:00Z',
    },
  ];
}

async function getAllPages() {
  return [
    {
      slug: 'about',
      updated_at: '2026-01-05T12:00:00Z',
    },
    {
      slug: 'contact',
      updated_at: '2026-01-05T12:00:00Z',
    },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://example.com';

  const posts = await getAllPosts();
  const pages = await getAllPages();

  const postUrls = posts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const pageUrls = pages.map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: new Date(page.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...postUrls,
    ...pageUrls,
  ];
}
