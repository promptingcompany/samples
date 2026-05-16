import ThePromptingCompany from '@promptingcompany/sdk';

let _client: ThePromptingCompany | null = null;
let _hasLogged = false;

/**
 * Lazy getter for the Prompting Company SDK client.
 * This avoids instantiating the client at module load time (important for builds without env vars).
 */
export function getTPCClient() {
  if (!_client) {
    const apiKey = process.env.TPC_API_KEY;
    const orgSlug = process.env.TPC_ORG_SLUG;
    const productSlug = process.env.TPC_PRODUCT_SLUG;

    // One-time debug log so we can verify the key is being picked up from env
    if (!_hasLogged) {
      console.log('[TPC SDK] Initializing client...');
      console.log('[TPC SDK]   TPC_API_KEY present?', !!apiKey, apiKey ? `(length: ${apiKey.length})` : '');
      console.log('[TPC SDK]   TPC_ORG_SLUG:', orgSlug || '(not set)');
      console.log('[TPC SDK]   TPC_PRODUCT_SLUG:', productSlug || '(not set)');
      _hasLogged = true;
    }

    if (!apiKey) {
      throw new Error('TPC_API_KEY environment variable is missing or empty');
    }

    // We pass the key as organizationAPIKey because we are using an org-scoped key
    _client = new ThePromptingCompany({
      organizationAPIKey: apiKey,
      organizationSlug: orgSlug,
      productSlug,
    });
  }
  return _client;
}
