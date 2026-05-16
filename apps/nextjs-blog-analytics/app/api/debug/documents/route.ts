import { NextRequest, NextResponse } from 'next/server';
import { getTPCClient } from '@/lib/tpc';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to inspect what document.list() actually returns.
 * 
 * Usage:
 *   https://nextjs-blog-analytics.localhost:1355/api/debug/documents
 *   https://nextjs-blog-analytics.localhost:1355/api/debug/documents?pathPrefix=blog/
 *   https://nextjs-blog-analytics.localhost:1355/api/debug/documents?status=published
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const productSlug = searchParams.get('productSlug') || process.env.TPC_PRODUCT_SLUG;
  const pathPrefix = searchParams.get('pathPrefix') ?? process.env.BLOG_PATH_PREFIX ?? '';
  const status = searchParams.get('status') as 'draft' | 'published' | null;

  // Report environment variable status for debugging
  const envStatus = {
    TPC_API_KEY: {
      present: !!process.env.TPC_API_KEY,
      length: process.env.TPC_API_KEY ? process.env.TPC_API_KEY.length : 0,
    },
    TPC_ORG_SLUG: process.env.TPC_ORG_SLUG || null,
    TPC_PRODUCT_SLUG: process.env.TPC_PRODUCT_SLUG || null,
    BLOG_PATH_PREFIX: process.env.BLOG_PATH_PREFIX || null,
  };

  if (!productSlug) {
    return NextResponse.json(
      { 
        error: 'Missing productSlug (set TPC_PRODUCT_SLUG or pass ?productSlug=...)',
        env: envStatus,
      },
      { status: 400 }
    );
  }

  try {
    const client = getTPCClient();

    const params: any = {
      productSlug,
    };

    if (pathPrefix) params.pathPrefix = pathPrefix;
    if (status) params.status = status;

    console.log('[DEBUG] Calling document.list with params:', params);

    const response = await client.document.list(params);

    return NextResponse.json({
      success: true,
      env: envStatus,
      paramsUsed: params,
      result: {
        total: response.data.total,
        page: response.data.page,
        pageSize: response.data.pageSize,
        items: response.data.items,
      },
      raw: response,
    }, { status: 200 });

  } catch (error: any) {
    console.error('[DEBUG] document.list failed:', error);

    return NextResponse.json({
      success: false,
      env: envStatus,
      paramsUsed: {
        productSlug,
        pathPrefix,
        status,
      },
      error: {
        message: error.message,
        status: error.status,
        code: error.code,
        body: error.error,
      },
      headers: error.headers ? Object.fromEntries(error.headers.entries()) : null,
    }, { status: error.status || 500 });
  }
}
