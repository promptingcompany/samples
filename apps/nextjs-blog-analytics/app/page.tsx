import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">
          Next.js Blog + Server-Side Analytics
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          A sample demonstrating automatic page visit tracking from the server using The Prompting Company SDK.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/blog"
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            View Blog
          </Link>
          <a
            href="https://github.com/promptingcompany/samples"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            View on GitHub
          </a>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Visit any blog post to see server-side analytics in action.</p>
          <p className="mt-1">Check your terminal for logged events.</p>
        </div>
      </main>
    </div>
  );
}
