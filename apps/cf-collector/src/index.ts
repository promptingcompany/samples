export interface Env {
  TPC_API_URL: string
  TPC_API_KEY: string
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const response = await fetch(request)
    ctx.waitUntil(sendEvent(request, env))
    return response
  },
} satisfies ExportedHandler<Env>

async function sendEvent(request: Request, env: Env) {
  if (!env.TPC_API_KEY) {
    console.error("No TPC API key provided!")
    return
  }

  const requestUrl = new URL(request.url)
  const eventData = {
    event: "page_visit",
    occurredAt: new Date().toISOString(),
    eventId: crypto.randomUUID(),
    page: {
      href: requestUrl.href,
      domain: requestUrl.hostname,
      pathname: requestUrl.pathname,
    },
    request: {
      referrer: request.headers.get("referer"),
      userAgent: request.headers.get("user-agent"),
      clientIp: request.headers.get("cf-connecting-ip"),
      method: request.method,
    },
    sdk: {
      name: "cf-collector",
      version: "1.0.0",
    },
  }

  const MAX_RETRIES = 3

  // Retry multiple times
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(env.TPC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": `${env.TPC_API_KEY}`,
        },
        body: JSON.stringify(eventData),
      })
      if (!res.ok) {
        console.log("Error while sending event:", res.status)
      }
      return
    } catch (error) {
      console.log("Error while sending event:", error)
    }
    if (i === MAX_RETRIES - 1) {
      break
    }
    console.log(`Retrying to send event... (${i + 1}/${MAX_RETRIES})`)
    await sleep(3000)
  }
  console.error(`Failed to send event after ${MAX_RETRIES} retries!`)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
