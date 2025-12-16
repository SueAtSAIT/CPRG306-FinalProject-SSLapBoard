export const dynamic = "force-dynamic";

const DEFAULT_TARGET =
  process.env.SIGNALR_LEGACY_BASE ||
  "http://stcal-comp-web.knes.ucalgary.ca:5264/signalr";
const LEGACY_HOST = process.env.SIGNALR_LEGACY_HOST || null;

function buildTargetUrl(pathSegments, search) {
  let base = DEFAULT_TARGET.replace(/\/+$/g, "");
  const path = Array.isArray(pathSegments) ? pathSegments.join("/") : "";
  const url = `${base}/${path}`;
  return search ? `${url}?${search}` : url;
}

async function proxy(request, ctx) {
  const { method, headers } = request;
  const url = new URL(request.url);
  const resolved = await ctx.params; // params is a Promise in Next 16
  const targetUrl = buildTargetUrl(resolved?.path, url.searchParams.toString());

  const outgoingHeaders = new Headers(headers);
  outgoingHeaders.delete("origin");
  // Set Host header if provided (needed when targeting by IP but server expects hostname)
  if (LEGACY_HOST) {
    outgoingHeaders.set("host", LEGACY_HOST);
  } else {
    outgoingHeaders.delete("host");
  }
  // For GET/HEAD, some servers reject a Content-Type; remove it to be safe
  if (request.method === "GET" || request.method === "HEAD") {
    outgoingHeaders.delete("content-type");
  }
  // Normalize Accept header for negotiate
  if (!outgoingHeaders.get("accept")) {
    outgoingHeaders.set("accept", "*/*");
  }
  // Allow cross-origin on the response

  const init = {
    method,
    headers: outgoingHeaders,
    redirect: "manual",
    body:
      method === "GET" || method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
  };

  let resp;
  try {
    resp = await fetch(targetUrl, init);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown fetch error";
    console.error("[SignalR Proxy] fetch failed", {
      targetUrl,
      message,
    });
    return new Response(
      JSON.stringify({ error: "fetch_failed", targetUrl, message }),
      {
        status: 502,
        headers: { "content-type": "application/json" },
      }
    );
  }
  const respHeaders = new Headers(resp.headers);
  respHeaders.set("access-control-allow-origin", "*");

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    return new Response(text || JSON.stringify({ status: resp.status }), {
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    });
  }

  // For negotiate responses, rewrite URLs to use our proxy
  const pathStr = Array.isArray(resolved?.path) ? resolved.path.join("/") : "";
  if (pathStr === "negotiate" || pathStr.endsWith("/negotiate")) {
    const contentType = respHeaders.get("content-type") || "";
    if (contentType.includes("application/json") || resp.status === 200) {
      const body = await resp.json();
      if (body && body.Url) {
        const originalUrl = body.Url;
        // Handle both absolute and relative URLs
        if (
          originalUrl.startsWith("http://") ||
          originalUrl.startsWith("https://")
        ) {
          // Absolute URL: replace the entire base
          const remoteBase = DEFAULT_TARGET.replace(/\/+$/g, "");
          body.Url = body.Url.replace(
            remoteBase,
            `${url.origin}/api/signalr-proxy`
          );
        } else if (originalUrl.startsWith("/")) {
          // Relative URL: prepend proxy path
          body.Url = `/api/signalr-proxy${originalUrl.replace(
            /^\/signalr/,
            ""
          )}`;
        }
        console.log(
          `[SignalR Proxy] Rewrote negotiate Url: ${originalUrl} -> ${body.Url}`
        );
      }
      return new Response(JSON.stringify(body), {
        status: resp.status,
        statusText: resp.statusText,
        headers: respHeaders,
      });
    }
  }

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: respHeaders,
  });
}

export { proxy as GET, proxy as POST };
