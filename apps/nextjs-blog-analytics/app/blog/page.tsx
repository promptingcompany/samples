import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

interface Post {
  slug: string;
  title: string;
  date?: string;
  description?: string;
}

function getAllPosts(): Post[] {
  const postsDirectory = path.join(process.cwd(), 'content/blog');
  const filenames = fs.readdirSync(postsDirectory);

  return filenames
    .filter((name) => name.endsWith('.mdx'))
    .map((name) => {
      const filePath = path.join(postsDirectory, name);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data: frontmatter } = matter(fileContent);

      return {
        slug: name.replace('.mdx', ''),
        title: frontmatter.title || name,
        date: frontmatter.date,
        description: frontmatter.description,
      };
    })
    .sort((a, b) => {
      if (a.date && b.date) {
        return b.date.localeCompare(a.date);
      }
      return 0;
    });
}

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-4xl font-bold mb-2">Blog</h1>
      <p className="text-gray-600 mb-8">Server-side analytics demo</p>

      <div className="space-y-4">
        {posts.map((post) => (
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
              <p className="text-sm text-gray-500 mt-3">{post.date}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
