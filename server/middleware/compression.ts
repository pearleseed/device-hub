import { gzipSync } from "bun";

export async function compressResponse(req: Request, res: Response): Promise<Response> {
  // Only compress if client accepts gzip
  const acceptEncoding = req.headers.get("Accept-Encoding");
  if (!acceptEncoding || !acceptEncoding.includes("gzip")) {
    return res;
  }

  // Only compress JSON or text responses
  const contentType = res.headers.get("Content-Type");
  if (!contentType || (!contentType.includes("application/json") && !contentType.includes("text/"))) {
    return res;
  }

  // Don't compress if already compressed or empty
  if (res.headers.has("Content-Encoding") || !res.body) {
    return res;
  }

  // Buffer the response
  const buffer = await res.arrayBuffer();

  // Don't compress tiny responses (overhead > benefit)
  if (buffer.byteLength < 1024) {
    return new Response(buffer, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers
    });
  }

  // Compress
  const compressed = gzipSync(new Uint8Array(buffer));
  
  return new Response(compressed, {
    status: res.status,
    statusText: res.statusText,
    headers: new Headers({
      ...Object.fromEntries(res.headers.entries()),
      "Content-Encoding": "gzip",
      "Vary": "Accept-Encoding"
    })
  });
}
