import ThePromptingCompany from '@promptingcompany/sdk';

let _client: ThePromptingCompany | null = null;

/**
 * Lazy getter for the Prompting Company SDK client.
 * This avoids instantiating the client at module load time (important for builds without env vars).
 */
export function getTPCClient() {
  if (!_client) {
    _client = new ThePromptingCompany({
      apiKey: process.env.TPC_API_KEY,
      organizationSlug: process.env.TPC_ORG_SLUG,
      productSlug: process.env.TPC_PRODUCT_SLUG,
    });
  }
  return _client;
}
