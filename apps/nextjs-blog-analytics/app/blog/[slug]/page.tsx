import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string) {
  const filePath = path.join(process.cwd(), 'content/blog', `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const { data: frontmatter, content } = matter(fileContent);

  return { frontmatter, content };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <article className="prose prose-lg dark:prose-invert">
        <h1>{post.frontmatter.title}</h1>
        {post.frontmatter.date && (
          <p className="text-sm text-gray-500 -mt-4">{post.frontmatter.date}</p>
        )}
        <MDXRemote source={post.content} />
      </article>
    </div>
  );
}

export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), 'content/blog');
  const filenames = fs.readdirSync(postsDirectory);

  return filenames
    .filter((name) => name.endsWith('.mdx'))
    .map((name) => ({
      slug: name.replace('.mdx', ''),
    }));
}
