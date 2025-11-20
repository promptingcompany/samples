import { parseStringPromise } from "xml2js";

interface SitemapUrl {
	loc: string[];
	lastmod?: string[];
	changefreq?: string[];
	priority?: string[];
}

interface Sitemap {
	urlset?: {
		url: SitemapUrl[];
	};
	sitemapindex?: {
		sitemap: Array<{ loc: string[] }>;
	};
}

interface ValidationResult {
	url: string;
	success: boolean;
	contentType: string | null;
	error?: string;
}

const USER_AGENT = "PromptingBot ChatGPT-User/1.0.0";
// const USER_AGENT = "PromptingBot/1.0.0";

async function fetchSitemap(url: string): Promise<string> {
	console.log(`Fetching sitemap from: ${url}`);
	const response = await fetch(url, {
		headers: {
			"User-Agent": USER_AGENT,
		},
	});

	if (!response.ok) {
		throw new Error(
			`Failed to fetch sitemap: ${response.status} ${response.statusText}`,
		);
	}

	return await response.text();
}

async function parseSitemap(xml: string): Promise<string[]> {
	const parsed = (await parseStringPromise(xml)) as Sitemap;
	const urls: string[] = [];

	// Handle sitemap index (contains references to other sitemaps)
	if (parsed.sitemapindex?.sitemap) {
		for (const sitemap of parsed.sitemapindex.sitemap) {
			const sitemapUrl = sitemap.loc[0];
			console.log(`Found nested sitemap: ${sitemapUrl}`);
			if (!sitemapUrl) {
				continue;
			}
			const nestedXml = await fetchSitemap(sitemapUrl);
			const nestedUrls = await parseSitemap(nestedXml);
			urls.push(...nestedUrls);
		}
	}

	// Handle regular sitemap (contains actual URLs)
	if (parsed.urlset?.url) {
		for (const urlEntry of parsed.urlset.url) {
			if (!urlEntry.loc[0]) {
				continue;
			}
			urls.push(urlEntry.loc[0]);
		}
	}

	return urls;
}

async function validateUrl(url: string): Promise<ValidationResult> {
	try {
		const response = await fetch(url, {
			method: "HEAD",
			headers: {
				"User-Agent": USER_AGENT,
			},
		});

		const contentType = response.headers.get("content-type");

		// Check if content type is exactly text/markdown or starts with text/markdown
		const isMarkdown =
			contentType?.toLowerCase().startsWith("text/markdown") ?? false;

		return {
			url,
			success: isMarkdown,
			contentType,
		};
	} catch (error) {
		return {
			url,
			success: false,
			contentType: null,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

async function validateSitemap(
	sitemapUrl: string,
	onProgress?: (
		result: ValidationResult,
		current: number,
		total: number,
	) => void,
) {
	console.log("\n=== Sitemap Content-Type Validator ===\n");

	// Fetch and parse sitemap
	const xml = await fetchSitemap(sitemapUrl);
	const urls = await parseSitemap(xml);

	console.log(`\nFound ${urls.length} URLs to validate\n`);

	// Validate each URL
	const results: ValidationResult[] = [];
	const batchSize = 10; // Process 10 URLs concurrently

	for (let i = 0; i < urls.length; i += batchSize) {
		const batch = urls.slice(i, Math.min(i + batchSize, urls.length));
		const batchResults = await Promise.all(
			batch.map((url, batchIndex) =>
				validateUrl(url).then((result) => {
					const current = i + batchIndex + 1;
					if (onProgress) {
						onProgress(result, current, urls.length);
					}
					return result;
				}),
			),
		);
		results.push(...batchResults);
	}

	// Generate report
	const successCount = results.filter((r) => r.success).length;
	const failureCount = results.length - successCount;

	console.log("\n\n=== Validation Results ===\n");
	console.log(`Total URLs: ${results.length}`);
	console.log(`✅ Successful (text/markdown): ${successCount}`);
	console.log(`❌ Failed: ${failureCount}`);

	if (failureCount > 0) {
		console.log("\n=== Failed URLs ===\n");
		const failures = results.filter((r) => !r.success);
		for (const failure of failures) {
			console.log(`URL: ${failure.url}`);
			console.log(`Content-Type: ${failure.contentType || "N/A"}`);
			if (failure.error) {
				console.log(`Error: ${failure.error}`);
			}
			console.log("");
		}
	}

	return {
		total: results.length,
		successful: successCount,
		failed: failureCount,
		results,
	};
}

// CLI execution
if (require.main === module) {
	const sitemapUrl = process.argv[2];

	if (!sitemapUrl) {
		console.error(
			"Usage: pnpm tsx scripts/validate-sitemap-content-type.ts <sitemap-url>",
		);
		console.error("\nExample:");
		console.error(
			"  pnpm tsx scripts/validate-sitemap-content-type.ts https://example.com/sitemap.xml",
		);
		process.exit(1);
	}

	validateSitemap(sitemapUrl, (result, current, total) => {
		const status = result.success ? "✅" : "❌";
		const progress = `[${current}/${total}]`;
		process.stdout.write(`\r${progress} ${status} ${result.url.slice(0, 80)}`);
	})
		.then((summary) => {
			console.log("\n\nValidation complete!");
			process.exit(summary.failed > 0 ? 1 : 0);
		})
		.catch((error) => {
			console.error("\nValidation failed:", error);
			process.exit(1);
		});
}

export { validateSitemap, type ValidationResult };
