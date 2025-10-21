// =====================================
// File: main.ts  (REPLACE 섹션만)
// =====================================
import { buildTOC } from "./lib/toc.ts";
import { handleOps } from "./ops.ts";

const startedAt = new Date();

Deno.serve(async (req: Request): Promise<Response> => {
  const { pathname } = new URL(req.url);

  // 1) OPS 라우트
  if (pathname.startsWith("/ops/")) {
    return handleOps(req);
  }

  // 2) /health
  if (pathname === "/health") {
    return Response.json({ status: "ok", service: "wic-auto-tools-2025", time: new Date().toISOString() });
  }

  // 3) /evidence
  if (pathname === "/evidence") {
    return Response.json({
      startedAt: startedAt.toISOString(),
      now: new Date().toISOString(),
      uptimeSec: Math.floor((Date.now() - startedAt.getTime()) / 1000),
      commit: null,
      branch: null,
    });
  }

  // 4) 기존 루트
  if (pathname === "/" || pathname === "/index.html") {
    const html = await Deno.readTextFile("./static/index.html");
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  }

  // 5) 기타
  return new Response("Not Found", { status: 404 });
});
