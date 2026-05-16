# Next.js Blog + Server-Side Analytics

This sample demonstrates how to automatically track page visits to your blog posts **from the server** using The Prompting Company SDK and Next.js Middleware.

## Why Server-Side Tracking?

Tracking analytics from your server (instead of the browser) has several advantages:

- **More reliable** — Not affected by ad blockers or browser extensions
- **Better performance** — No extra JavaScript sent to the client
- **Full control** — You decide exactly what data gets sent
- **Works with static/hybrid rendering**

## How It Works

This sample uses **Next.js Middleware** as an automatic tracking layer:

1. User visits `/blog/getting-started`
2. Middleware intercepts the request
3. Middleware fires a non-blocking request to `/api/analytics/page-visit`
4. The API route uses the official SDK to send a `page_visit` event to The Prompting Company
5. The event is recorded with `source: "sdk_server"`

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Get your credentials from [The Prompting Company dashboard](https://app.promptingco.com):

- `TPC_API_KEY` — A server-side API key with the `analytics:write` scope
- `TPC_ORG_SLUG` — Your organization slug
- `TPC_PRODUCT_SLUG` — The product you want to track (used for `document.list()`)

### 3. Run the development server

```bash
bun dev
```

### 4. Test the tracking

Visit any blog post:

- http://localhost:3000/blog/getting-started
- http://localhost:3000/blog/advanced-patterns
- http://localhost:3000/blog/server-side-analytics

Check your terminal — you should see the analytics events being sent.

## Project Structure

```
app/
├── blog/
│   ├── [slug]/page.tsx     # Individual blog posts (MDX)
│   └── page.tsx            # Blog index
├── api/analytics/
│   └── page-visit/route.ts # Analytics proxy (uses the SDK)
├── layout.tsx
└── page.tsx
middleware.ts               # Automatic tracking for /blog routes
content/blog/               # Fake MDX blog posts
```

## Key Files

- **`middleware.ts`** — Intercepts all `/blog/*` requests and triggers analytics
- **`app/api/analytics/page-visit/route.ts`** — Uses the SDK to send events to The Prompting Company
- **`app/blog/[slug]/page.tsx`** — Renders MDX blog posts

## How to Extend This Pattern

You can easily expand this approach to track:

- Any route group (not just `/blog`)
- Custom events beyond `page_visit`
- Additional metadata (session IDs, A/B test variants, etc.)

## Learn More

- [Server-Side Analytics Documentation](https://docs.promptingcompany.com/analytics/server-side)
- [The Prompting Company TypeScript SDK](https://docs.promptingcompany.com/ts-sdk)
