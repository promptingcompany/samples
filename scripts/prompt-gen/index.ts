type UrlCallback = (url: string, product1: string, product2: string) => void;
type UrlFilter = (url: string) => boolean;

interface ProcessOptions {
  filter?: UrlFilter;
}

const INTEGRATION_URL_PATTERN = /zapier\.com\/apps\/([^/]+)\/integrations\/([^/]+)/;

function isIntegrationUrl(url: string): boolean {
  return INTEGRATION_URL_PATTERN.test(url);
}

function parseIntegrationUrl(url: string): { product1: string; product2: string } | null {
  const match = url.match(INTEGRATION_URL_PATTERN);
  if (!match?.[1] || !match[2]) return null;
  return { product1: match[1], product2: match[2] };
}

async function fetchXml(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function extractUrls(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}>\\s*<loc>([^<]+)</loc>`, "g");
  const urls: string[] = [];
  for (const match of xml.matchAll(regex)) {
    if (match[1]) {
      urls.push(match[1].trim());
    }
  }
  return urls;
}

function isSitemapIndex(xml: string): boolean {
  return xml.includes("<sitemapindex");
}

async function processSitemap(
  sitemapUrl: string,
  callback: UrlCallback,
  options: ProcessOptions = {}
): Promise<void> {
  const { filter } = options;
  const xml = await fetchXml(sitemapUrl);

  if (isSitemapIndex(xml)) {
    const sitemapUrls = extractUrls(xml, "sitemap");
    console.log(`Found sitemap index with ${sitemapUrls.length} sitemaps`);

    for (const url of sitemapUrls) {
      await processSitemap(url, callback, options);
    }
  } else {
    let pageUrls = extractUrls(xml, "url");

    if (filter) {
      pageUrls = pageUrls.filter(filter);
    }

    console.log(`Found ${pageUrls.length} URLs${filter ? " (after filtering)" : ""}`);

    for (const url of pageUrls) {
      const parsed = parseIntegrationUrl(url);
      if (parsed) {
        callback(url, parsed.product1, parsed.product2);
      }
    }
  }
}

function generateQuestion(product1: string, product2: string): string {
  return `How do I connect ${product1} to ${product2}?`;
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export {
  processSitemap,
  isIntegrationUrl,
  parseIntegrationUrl,
  generateQuestion,
  type UrlCallback,
  type UrlFilter,
  type ProcessOptions,
};

// Example usage
if (import.meta.main) {
  const sitemapUrl = process.argv[2];
  const outputFile = process.argv[3] || "output.csv";

  if (!sitemapUrl) {
    console.log("Usage: bun index.ts <sitemap-url> [output.csv]");
    console.log("Example: bun index.ts https://example.com/sitemap.xml results.csv");
    process.exit(1);
  }

  const rows: string[] = ["url,product1,product2,question"];

  await processSitemap(
    sitemapUrl,
    (url, product1, product2) => {
      const question = generateQuestion(product1, product2);
      rows.push(`${escapeCSV(url)},${escapeCSV(product1)},${escapeCSV(product2)},${escapeCSV(question)}`);
    },
    { filter: isIntegrationUrl }
  );

  await Bun.write(outputFile, rows.join("\n"));
  console.log(`Wrote ${rows.length - 1} rows to ${outputFile}`);
}
