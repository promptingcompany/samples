import type { LoaderFunctionArgs } from "react-router";

const UPSTREAM_ORIGIN = "https://promptingcompany.com";

type NodeRequestInit = RequestInit & {
  duplex?: "half";
};

const REQUEST_HEADERS_TO_SKIP = new Set([
  "accept-encoding",
  "authorization",
  "connection",
  "cookie",
  "content-length",
  "host",
]);

const RESPONSE_HEADERS_TO_SKIP = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "set-cookie",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function filterHeaders(
  source: Headers,
  blockedNames: Set<string>,
): Headers {
  const headers = new Headers();

  for (const [name, value] of source.entries()) {
    if (!blockedNames.has(name.toLowerCase())) {
      headers.append(name, value);
    }
  }

  return headers;
}

async function proxyRequest({ params, request }: LoaderFunctionArgs) {
  const requestUrl = new URL(request.url);
  const upstreamUrl = new URL(UPSTREAM_ORIGIN);

  upstreamUrl.pathname = params["*"] ? `/${params["*"]}` : "/";
  upstreamUrl.search = requestUrl.search;

  try {
    const init: NodeRequestInit = {
      headers: filterHeaders(request.headers, REQUEST_HEADERS_TO_SKIP),
      method: request.method,
      signal: request.signal,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
      init.duplex = "half";
    }

    const upstreamResponse = await fetch(upstreamUrl, {
      ...init,
    });

    return new Response(upstreamResponse.body, {
      headers: filterHeaders(upstreamResponse.headers, RESPONSE_HEADERS_TO_SKIP),
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
    });
  } catch (error) {
    if (
      request.signal.aborted ||
      (error instanceof DOMException && error.name === "AbortError")
    ) {
      return new Response(null, { status: 204 });
    }

    throw error;
  }
}

export function loader(args: LoaderFunctionArgs) {
  return proxyRequest(args);
}

export function action(args: LoaderFunctionArgs) {
  return proxyRequest(args);
}
