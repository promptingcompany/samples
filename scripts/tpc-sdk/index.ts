import ThePromptingCompany from "@promptingcompany/sdk";

const apiKey = process.env["TPC_API_KEY"];
if (!apiKey) {
  console.error("Set TPC_API_KEY in your environment (or .env file).");
  process.exit(1);
}

const client = new ThePromptingCompany({
  apiKey,
  organizationSlug: "rho",
  productSlug: "rho",
  environment: (process.env["TPC_ENV"] as "dev" | "production") ?? "production",
});

const port = Number(process.env["PORT"] ?? 1234);

const server = Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/+/, "");

    if (path === "favicon.ico") return new Response(null, { status: 404 });

    try {
      const response = await client.document.getByPath(path);
      const markdown = response.data?.content;

      if (!markdown) {
        return new Response(`No content for path: /${path}\n`, {
          status: 404,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }

      return new Response(markdown, {
        headers: { "content-type": "text/markdown; charset=utf-8" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(`Error: ${message}\n`, {
        status: 500,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  },
});

console.log(`Listening on http://localhost:${server.port}`);
console.log(`Try: curl http://localhost:${server.port}/getting-started`);
