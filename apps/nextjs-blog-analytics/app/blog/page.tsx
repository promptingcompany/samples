import Link from 'next/link';
import { getTPCClient } from '@/lib/tpc';

interface Post {
  slug: string;
  title: string;
  date?: string;
  description?: string;
}

export const dynamic = 'force-dynamic';

async function getAllPosts(): Promise<Post[]> {
  try {
    const client = getTPCClient();

    console.log('[Blog] Calling document.list with productSlug:', process.env.TPC_PRODUCT_SLUG);

    const { data } = await client.document.list({
      productSlug: process.env.TPC_PRODUCT_SLUG!,
      // No pathPrefix — we want all content from the product
      // status: 'published', // uncomment if you only want published docs
    });

    console.log('[Blog] document.list returned:', {
      total: data.total,
      itemsCount: data.items?.length,
      firstFew: data.items?.slice(0, 3).map(i => ({
        id: i.id,
        filePath: i.filePath,
        title: i.title,
        status: i.status,
      })),
    });

    return data.items
      .map((item) => {
        // Use the full filePath (minus extension) as the slug.
        // This supports documents with forward slashes in their paths (nested structure).
        const slug = item.filePath.replace(/\.(md|mdx)$/, '');

        return {
          slug,
          title: item.title || slug,
          description: item.metaDescription || undefined,
          date: item.publishedAt || item.updatedAt || undefined,
        };
      })
      .filter((post) => post.slug.length > 0);
  } catch (error) {
    console.error('Failed to load blog posts from Prompting Company SDK:', error);
    return [];
  }
}

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-4xl font-bold mb-2">Blog</h1>
      <p className="text-gray-600 mb-8">
        Server-side analytics demo — content powered by The Prompting Company
      </p>

      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-gray-500">
            No blog posts found. Publish content in your Prompting Company product.
          </p>
        ) : (
          posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block p-6 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <h2 className="text-2xl font-semibold">{post.title}</h2>
              {post.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {post.description}
                </p>
              )}
              {post.date && (
                <p className="text-sm text-gray-500 mt-3">
                  {new Date(post.date).toLocaleDateString()}
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
