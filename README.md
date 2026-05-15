# Prompting Company Samples

A collection of example applications demonstrating how to integrate with The Prompting Company platform.

## Samples

| Sample | Description | Stack |
|--------|-------------|-------|
| [vite-react-router-dom](./apps/vite-react-router-dom) | AI-powered site that proxies to promptingcompany.com | Vite + React Router |
| [nextjs-blog-analytics](./apps/nextjs-blog-analytics) | Next.js blog with automatic server-side analytics tracking via Middleware | Next.js 16 + App Router + MDX |

## Getting Started

Each sample has its own README with setup instructions.

### Local Development with Portless

This repo uses [Portless](https://portless.sh/) for clean, named development URLs instead of `localhost:3000`.

**Prerequisites:** Portless is already installed globally (`portless --version`).

**Run any sample with a stable URL:**

```bash
# Next.js blog (the one in your dedicated worktree)
cd apps/nextjs-blog-analytics
portless
# → https://nextjs-blog-analytics.localhost

# Vite + React Router sample
cd apps/vite-react-router-dom
portless
# → https://vite-react-router-dom.localhost
```

**Git worktrees get automatic subdomains**

In a linked worktree on branch `feat/foo`, the URL automatically becomes:

```
https://feat-foo.nextjs-blog-analytics.localhost
```

This is why the `samples-nextjs-blog` worktree exists — each branch of the blog sample gets its own isolated URL with zero config.

**Proxy**

The HTTPS proxy runs on port 443 by default (requires one-time `sudo` for CA trust and port binding). If you're seeing `:1355` in the URL, run this once in a real terminal:

```bash
portless proxy start
```

Then re-run your apps for clean `https://name.localhost` URLs (no port number).

## Contributing

We welcome new samples! If you'd like to contribute an integration example, please open an issue or pull request.

## License

MIT
