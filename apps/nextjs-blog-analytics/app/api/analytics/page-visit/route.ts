import { NextRequest, NextResponse } from 'next/server';
import ThePromptingCompany from '@promptingcompany/sdk';

// Initialize the official Prompting Company SDK client.
// Credentials come from environment variables (recommended for server-side usage).
const client = new ThePromptingCompany({
  apiKey: process.env.TPC_API_KEY,
  organizationSlug: process.env.TPC_ORG_SLUG,
  productSlug: process.env.TPC_PRODUCT_SLUG,
});

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();

    // Use the official @promptingcompany/sdk to send the page_visit event.
    // The SDK handles authentication, retries, error normalization, and base URL.
    await client
      .post('/api/v1/analytics/events', {
        body: {
          ...eventData,
          // Attach SDK/runtime metadata so The Prompting Company can attribute the source
          sdk: {
            name: '@promptingcompany/sdk',
            version: '0.1.1',
            runtime: 'nextjs',
            ...eventData.sdk,
          },
        },
      })
      .catch(() => {
        // Never let analytics tracking break the user experience.
        // In production you may want to send this to your own error tracker.
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Error sending page visit event:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
