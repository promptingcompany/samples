# tpc-sdk

Tiny Bun webserver that proxies a URL path to [`@promptingcompany/sdk`](https://www.npmjs.com/package/@promptingcompany/sdk)
and returns the document's markdown.

## Setup

```sh
bun install
```

Copy the template and fill in your API key (Bun auto-loads `.env`):

```sh
cp .env.template .env
# then edit .env and set TPC_API_KEY
```

Org slug and product slug are hardcoded to `rho` in [index.ts](index.ts).

## Run

```sh
bun run index.ts
```

Then:

```sh
curl http://localhost:1234/my/custom/path
```

The path after the host is forwarded to `client.document.getByPath()` and the
returned `data.content` (markdown) is sent back as the response body.
