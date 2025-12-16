import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

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

const DEFAULT_SECTION_ID = "most-popular-integrations";

async function getTwosPopularUseCase(
  url: string,
  sectionId: string = DEFAULT_SECTION_ID
): Promise<string[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  const html = await response.text();

  // Extract the section with the specified id
  const sectionMatch = html.match(
    new RegExp(`<section[^>]*id=["']${sectionId}["'][^>]*>([\\s\\S]*?)<\\/section>`, "i")
  );
  if (!sectionMatch?.[1]) {
    return [];
  }

  const sectionHtml = sectionMatch[1];

  // Extract use case titles - these appear to be in heading elements within the cards
  // Looking for h3/h4 or similar elements containing the template descriptions
  const useCasesSet = new Set<string>();

  // Match heading tags that contain the use case text
  const headingRegex = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi;
  for (const match of sectionHtml.matchAll(headingRegex)) {
    if (match[1]) {
      // Strip any remaining HTML tags and decode entities
      const text = match[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .trim();

      // Filter out section titles and short text
      if (
        text &&
        text.length > 10 &&
        !text.toLowerCase().includes("launch your") &&
        !text.toLowerCase().includes("automated workflow")
      ) {
        useCasesSet.add(text);
      }
    }
  }

  return [...useCasesSet];
}

interface LongtailPrompt {
  original: string;
  longtail: string;
}

async function generateLongtailPrompts(
  useCases: string[],
  count: number = 3
): Promise<LongtailPrompt[]> {
  const results: LongtailPrompt[] = [];

  for (const useCase of useCases) {
    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: `Given this automation use case: "${useCase}"

Generate ${count} questions that a non-technical small business owner, freelancer, or everyday user might ask ChatGPT. These people are NOT developers - they don't know technical terms. They just want to solve a business problem.

IMPORTANT: Every response MUST be a question ending with "?" - no statements.

These should sound like real everyday people asking for help - casual, simple language, focused on their business needs.

Examples of good questions:
- "How can I make sure I don't forget to follow up with new customers?"
- "What's the easiest way to send welcome emails without doing it manually?"
- "Is there a way to know right away when someone buys from my shop?"
- "How do other small businesses handle sending receipts?"

Avoid words like: automate, notify, trigger, set up, integrate, workflow, API, sync, automation

Return ONLY questions (must end with ?), one per line, without numbering or bullets.`,
    });

    const longtails = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (const longtail of longtails) {
      results.push({ original: useCase, longtail });
    }
  }

  return results;
}

export {
  processSitemap,
  isIntegrationUrl,
  parseIntegrationUrl,
  generateQuestion,
  getTwosPopularUseCase,
  generateLongtailPrompts,
  type UrlCallback,
  type UrlFilter,
  type ProcessOptions,
  type LongtailPrompt,
};

async function readUrlsFromFile(filePath: string): Promise<string[]> {
  const content = await Bun.file(filePath).text();
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function isLocalFile(input: string): boolean {
  return !input.startsWith("http://") && !input.startsWith("https://");
}

// Main CLI
if (import.meta.main) {
  const args = process.argv.slice(2);
  const popularFlag = args.includes("--popular");

  // Parse --section=value argument
  const sectionArg = args.find((arg) => arg.startsWith("--section="));
  const sectionId = sectionArg ? sectionArg.split("=")[1] : DEFAULT_SECTION_ID;

  const filteredArgs = args.filter((arg) => !arg.startsWith("--"));

  const input = filteredArgs[0];
  const outputFile = filteredArgs[1] || "output.csv";

  if (!input) {
    console.log("Usage: bun index.ts <sitemap-url|urls-file> [output.csv] [--popular] [--section=ID]");
    console.log("");
    console.log("Options:");
    console.log("  --popular       Fetch popular use cases and generate longtail prompts");
    console.log("  --section=ID    HTML section ID to extract use cases from (default: most-popular-integrations)");
    console.log("");
    console.log("Examples:");
    console.log("  bun index.ts https://example.com/sitemap.xml results.csv");
    console.log("  bun index.ts urls.txt results.csv");
    console.log("  bun index.ts urls.txt results.csv --popular");
    console.log("  bun index.ts urls.txt results.csv --popular --section=featured-templates");
    process.exit(1);
  }

  if (sectionId !== DEFAULT_SECTION_ID) {
    console.log(`Using section ID: ${sectionId}`);
  }

  const urls: { url: string; product1: string; product2: string }[] = [];

  if (isLocalFile(input)) {
    console.log(`Reading URLs from file: ${input}`);
    const fileUrls = await readUrlsFromFile(input);
    for (const url of fileUrls) {
      const parsed = parseIntegrationUrl(url);
      if (parsed) {
        urls.push({ url, ...parsed });
      } else {
        // For non-integration URLs, extract product names from the URL path
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        const product1 = pathParts[pathParts.length - 1] || "unknown";
        const product2 = "";
        urls.push({ url, product1, product2 });
      }
    }
    console.log(`Found ${urls.length} URLs`);
  } else {
    console.log(`Processing sitemap: ${input}`);
    await processSitemap(
      input,
      (url, product1, product2) => {
        urls.push({ url, product1, product2 });
      },
      { filter: isIntegrationUrl }
    );
  }

  if (popularFlag) {
    console.log("Fetching popular use cases and generating longtail prompts...");
    const rows: string[] = ["url,product1,product2,longtail_prompt"];

    for (const { url, product1, product2 } of urls) {
      try {
        console.log(`  ${url}: Fetching use cases...`);
        const useCases = await getTwosPopularUseCase(url, sectionId);

        if (useCases.length > 0) {
          console.log(`  ${url}: Generating longtail prompts for ${useCases.length} use cases...`);
          const longtails = await generateLongtailPrompts(useCases);

          for (const { longtail } of longtails) {
            rows.push(
              `${escapeCSV(url)},${escapeCSV(product1)},${escapeCSV(product2)},${escapeCSV(longtail)}`
            );
          }
          console.log(`  ${url}: Generated ${longtails.length} longtail prompts`);
        } else {
          console.log(`  ${url}: No use cases found`);
        }
      } catch (err) {
        console.error(`  ${url}: Error - ${err}`);
      }
    }

    await Bun.write(outputFile, rows.join("\n"));
    console.log(`Wrote ${rows.length - 1} rows to ${outputFile}`);
  } else {
    const rows: string[] = ["url,product1,product2,question"];

    for (const { url, product1, product2 } of urls) {
      const question = generateQuestion(product1, product2);
      rows.push(
        `${escapeCSV(url)},${escapeCSV(product1)},${escapeCSV(product2)},${escapeCSV(question)}`
      );
    }

    await Bun.write(outputFile, rows.join("\n"));
    console.log(`Wrote ${rows.length - 1} rows to ${outputFile}`);
  }
}
