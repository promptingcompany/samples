# Cloudflare Worker Collector

This sample demonstrates how to automatically track page visits **at the edge** using a [Cloudflare Worker](https://developers.cloudflare.com/workers/) and The Prompting Company analytics API. The worker sits in front of your existing site, transparently proxies every matching request, and forwards page visit events to The Prompting Company.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create and set your API key

Create an API key with the `analytics:write` scope going to your Organization Settings, then selecting API Keys. Note that creating an API key requires an account with the Enterprise Plan.

Once you have your key, you can store it as a [Wrangler secret](https://developers.cloudflare.com/workers/configuration/secrets/) by running

```bash
npx wrangler secret put TPC_API_KEY
```

### 3. Configure the routes

Edit the `routes` array in `wrangler.jsonc` to match the pages you want to track:

```jsonc
"routes": [
  {
    "pattern": "example.com/*", // any pages you want to catch
    "zone_name": "example.com"  // zone_id is also accepted
  }
]
```

### 4. Deploy

To deploy to the production environment:

```bash
npm run deploy:production
```

## Available Scripts

| Script                      | Description                                   |
| --------------------------- | --------------------------------------------- |
| `npm run dev`               | Run the worker locally with `wrangler dev`    |
| `npm run wrangler:login`    | Authenticate the Wrangler CLI with Cloudflare |
| `npm run wrangler:deploy`   | Deploy the worker                             |
| `npm run deploy:production` | Deploy to the `production` environment        |
| `npm run gen:types`         | Generate types from `wrangler.jsonc`          |

## Learn More

- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI documentation](https://developers.cloudflare.com/workers/wrangler/)
- [The Prompting Company API documentation](https://docs.promptingcompany.com/api/overview)
