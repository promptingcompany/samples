import { generateLongtailPrompts, getTwosPopularUseCase } from "./index.ts";

const url = process.argv[2];
const count = parseInt(process.argv[3] || "3", 10);

if (!url) {
	console.log("Usage: bun longtail.ts <integration-url> [count]");
	console.log(
		"Example: bun longtail.ts https://zapier.com/apps/google-forms/integrations/email 3",
	);
	console.log("\nRequires OPENAI_API_KEY environment variable");
	process.exit(1);
}

console.log(`Fetching popular use cases from: ${url}`);
const useCases = await getTwosPopularUseCase(url);

if (useCases.length === 0) {
	console.log("No use cases found.");
	process.exit(0);
}

console.log(
	`Found ${useCases.length} use cases. Generating ${count} longtail prompts each...\n`,
);

const longtails = await generateLongtailPrompts(useCases, count);

for (const { original, longtail } of longtails) {
	console.log(`[${original}]`);
	console.log(`  -> ${longtail}\n`);
}

console.log(`\nTotal: ${longtails.length} longtail prompts generated`);
