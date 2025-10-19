// Deno Deploy/CLI 공통 동작. 별칭/번들/웹팩 전혀 없음.
import { buildV0Toc } from "./lib/toc.ts";

const enc = new TextEncoder();
const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt":  "text/plain; charset=utf-8",
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8" },
    ...init,
  });
}

async function serveStatic(urlPath: string) {
  // / → /index.html
  const path = urlPath === "/" ? "/index.html" : urlPath;
  try {
    const file = await Deno.readFile(`./static${path}`);
    const ext = path.substring(path.lastIndexOf("."));
    return new Response(file, { headers: { "content-type": mime[ext] ?? "application/octet-stream" } });
  } catch {
    return new Response(enc.encode("Not Found"), { status: 404 });
  }
}

Deno.serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);

  if (pathname === "/health") {
    return json({ ok: true, status: "healthy", ts: new Date().toISOString() });
  }

  if (pathname === "/toc") {
    const toc = buildV0Toc();
    return json({ ok: true, toc });
  }

  // 예: 쿼리로 증거 파일 링크를 수집(로그 포맷만 제공)
  if (pathname === "/evidence") {
    const link = searchParams.get("link") ?? "";
    return json({ ok: true, received: !!link, link });
  }

  // 그 외 정적 파일
  return serveStatic(pathname);
});
