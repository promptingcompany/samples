import { NextRequest, NextResponse } from 'next/server';
import tpc from '@promptingcompany/sdk';

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();

    // Send the page visit event to The Prompting Company analytics endpoint
    // (using the SDK's expected authentication pattern)
    // Using the SDK's configured environment and authentication
    const response = await fetch(
      'https://app.promptingco.com/api/v1/analytics/events',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // The SDK reads TPC_API_KEY automatically, but for direct calls we use it explicitly
          Authorization: `Bearer ${process.env.TPC_API_KEY}`,
        },
        body: JSON.stringify({
          ...eventData,
          // Automatically attach SDK metadata
          sdk: {
            name: '@promptingcompany/nextjs-blog-sample',
            version: '0.1.0',
            runtime: 'nextjs',
            ...eventData.sdk,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('[Analytics] Failed to send event:', await response.text());
      return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Analytics] Error sending page visit:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
