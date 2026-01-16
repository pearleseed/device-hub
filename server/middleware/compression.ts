import { gzipSync } from "bun";

/**
 * Middleware to GZIP compress HTTP responses.
 * Reduces bandwidth usage for compatible clients.
 */
export async function compressResponse(req: Request, res: Response): Promise<Response> {
  // 1. Negotiation: Client must accept gzip
  const acceptEncoding = req.headers.get("Accept-Encoding");
  if (!acceptEncoding || !acceptEncoding.includes("gzip")) {
    return res;
  }

  // 2. Content Type: Only compress text-based formats (JSON, HTML, etc.)
  const contentType = res.headers.get("Content-Type");
  if (!contentType || (!contentType.includes("application/json") && !contentType.includes("text/"))) {
    return res;
  }

  // 3. Status: Don't compress already compressed responses or empty bodies
  if (res.headers.has("Content-Encoding") || !res.body) {
    return res;
  }

  // Buffer the response to compress it
  const buffer = await res.arrayBuffer();

  // 4. Size Threshold: Don't compress tiny responses (CPU overhead > bandwidth saving)
  if (buffer.byteLength < 1024) {
    return new Response(buffer, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers
    });
  }

  // 5. Perform Compression
  const compressed = gzipSync(new Uint8Array(buffer));
  
  return new Response(compressed, {
    status: res.status,
    statusText: res.statusText,
    headers: new Headers({
      ...Object.fromEntries(res.headers.entries()),
      "Content-Encoding": "gzip",
      "Vary": "Accept-Encoding" // Tell caches that response varies by Accept-Encoding
    })
  });
}
