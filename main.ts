// Deno 표준 HTTP 서버만 사용 (알리아스/외부패키지 없음)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { normalizeTOC } from "./lib/toc.ts";

const encoder = new TextEncoder();

// 간단한 응답 유틸
function json(resp: unknown, status = 200) {
  return new Response(JSON.stringify(resp), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function serveIndex(): Promise<Response> {
  try {
    const url = new URL("./static/index.html", import.meta.url);
    const html = await Deno.readTextFile(url);
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  } catch {
    // 실패 시 최소 페이지
    return new Response("<h1>WIC Deno Tools</h1>", {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
}

async function handler(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);

  // 헬스체크
  if (req.method === "GET" && pathname === "/health") {
    return json({ ok: true, service: "wic-deno-tools", timestamp: new Date().toISOString() });
  }

  // TOC 정규화 (상위/하위 2단계 유지, 번호 보존)
  if (req.method === "POST" && pathname === "/api/toc/normalize") {
    try {
      const body = await req.json().catch(() => ({}));
      const text = typeof body?.text === "string" ? body.text : "";
      if (!text.trim()) return json({ ok: false, error: "MISSING_TEXT" }, 400);
      const output = normalizeTOC(text);
      return json({ ok: true, output });
    } catch (e) {
      return json({ ok: false, error: String(e?.message || e) }, 500);
    }
  }

  // 루트: 테스트 UI
  if (req.method === "GET" && (pathname === "/" || pathname === "/index.html")) {
    return await serveIndex();
  }

  // 그 외 404
  return json({ ok: false, error: "NOT_FOUND" }, 404);
}

console.log("WIC Deno Tools listening on :8000");
serve(handler, { port: 8000 });
