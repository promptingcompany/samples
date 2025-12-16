import { getTwosPopularUseCase } from "./index.ts";

const url = process.argv[2];

if (!url) {
  console.log("Usage: bun popular.ts <integration-url>");
  console.log("Example: bun popular.ts https://zapier.com/apps/google-forms/integrations/email");
  process.exit(1);
}

const useCases = await getTwosPopularUseCase(url);

if (useCases.length === 0) {
  console.log("No use cases found.");
} else {
  console.log(`Found ${useCases.length} popular use cases:\n`);
  useCases.forEach((uc, i) => console.log(`${i + 1}. ${uc}`));
}
