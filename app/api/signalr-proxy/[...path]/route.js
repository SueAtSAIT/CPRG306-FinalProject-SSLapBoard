export const dynamic = "force-dynamic";

const DEFAULT_TARGET =
  process.env.SIGNALR_LEGACY_BASE ||
  "http://stcal-comp-web.knes.ucalgary.ca:5264/signalr";

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
  outgoingHeaders.delete("host");
  outgoingHeaders.delete("origin");
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

  const resp = await fetch(targetUrl, init);
  const respHeaders = new Headers(resp.headers);
  respHeaders.set("access-control-allow-origin", "*");

  // For negotiate responses, rewrite URLs to use our proxy
  if (
    resolved?.path?.[0] === "negotiate" &&
    respHeaders.get("content-type")?.includes("application/json")
  ) {
    const body = await resp.json();
    if (body && body.Url) {
      // Replace the remote base URL with our proxy base
      const remoteBase = DEFAULT_TARGET.replace(/\/+$/g, "");
      const origin =
        url.protocol === "http:" ? url.origin : `${url.protocol}//${url.host}`;
      body.Url = body.Url.replace(remoteBase, `${origin}/api/signalr-proxy`);
    }
    return new Response(JSON.stringify(body), {
      status: resp.status,
      statusText: resp.statusText,
      headers: respHeaders,
    });
  }

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: respHeaders,
  });
}

export { proxy as GET, proxy as POST };
