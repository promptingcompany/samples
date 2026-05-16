import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getTPCClient } from '@/lib/tpc';

interface BlogPostPageProps {
  params: Promise<{ slug?: string[] }>;
}

async function getPostBySlug(slugSegments: string[]) {
  try {
    const client = getTPCClient();

    // Use the full path from the URL segments directly.
    // Since we removed BLOG_PATH_PREFIX, the slug from the URL *is* the path in TPC.
    const fullPath = slugSegments.join('/');

    const response = await client.document.getByPath(fullPath);

    return {
      title: response.data.title,
      content: response.data.content,
    };
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug: slugSegments = [] } = await params;

  if (slugSegments.length === 0) {
    notFound();
  }

  const post = await getPostBySlug(slugSegments);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <article className="prose prose-lg dark:prose-invert">
        <h1>{post.title}</h1>
        <MDXRemote source={post.content} />
      </article>
    </div>
  );
}

export async function generateStaticParams() {
  try {
    const client = getTPCClient();

    const { data } = await client.document.list({
      productSlug: process.env.TPC_PRODUCT_SLUG!,
      // No pathPrefix — we generate params for whatever documents exist in the product
    });

    return data.items
      .map((item) => {
        const slugPath = item.filePath.replace(/\.(md|mdx)$/, '');
        if (!slugPath) return null;

        const segments = slugPath.split('/').filter(Boolean);
        if (segments.length === 0) return null;

        return {
          slug: segments, // must be array for [...slug]
        };
      })
      .filter(Boolean) as { slug: string[] }[];
  } catch {
    return [];
  }
}
