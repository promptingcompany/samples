import { MetadataRoute } from 'next';
import { getTPCClient } from '@/lib/tpc';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://nextjs-blog-analytics.localhost:1355';

/**
 * Dynamically generates a sitemap.xml using content from The Prompting Company.
 *
 * - Uses document.list (the "get page" command) to discover all blog posts.
 * - Strips BLOG_PATH_PREFIX when building clean /blog/[slug] URLs.
 * - Falls back gracefully if credentials are missing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  try {
    const client = getTPCClient();

    const { data } = await client.document.list({
      productSlug: process.env.TPC_PRODUCT_SLUG!,
      // No pathPrefix — include all documents
    });

    for (const item of data.items) {
      const slug = item.filePath.replace(/\.(md|mdx)$/, '');
      if (!slug) continue;

      entries.push({
        url: `${BASE_URL}/blog/${slug}`,
        lastModified: item.updatedAt
          ? new Date(item.updatedAt)
          : item.publishedAt
            ? new Date(item.publishedAt)
            : new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch (error) {
    // If we can't reach the SDK (missing env vars, network, etc.),
    // we still return the static pages so the sitemap is never completely empty.
    console.warn(
      '[sitemap] Could not fetch blog posts from Prompting Company SDK. ' +
        'Returning base sitemap only.',
      error
    );
  }

  return entries;
}
