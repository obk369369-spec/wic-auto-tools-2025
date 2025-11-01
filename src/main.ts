// Deno 표준 HTTP만 사용, 서버는 오직 한 번만 띄움
import { serveFile, serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const p = url.pathname;

  // 헬스
  if (p === "/ops/health") return j({ ok: true, tz: "Asia/Seoul", iso: new Date().toISOString() });

  // 정시 보고 (latest.json 없으면 시드 JSON 반환)
  if (p === "/report/live") {
    try {
      const txt = await Deno.readTextFile("./export/latest.json");
      return new Response(txt, { headers: { "content-type": "application/json; charset=utf-8" } });
    } catch {
      return j({
        ok: true,
        stalled: false,
        rows: [
          { tool: "주문자동동기화", status: "ready", uis: 0.93 },
          { tool: "고객후속관리",   status: "ready", uis: 0.91 },
          { tool: "보고서자동생성", status: "ready", uis: 0.89 },
          { tool: "서브홈페이지생성기", status: "ready", uis: 0.90 }
        ],
        meta: { source: "seed" }
      });
    }
  }

  // 런처(클릭→즉시 화면)
  if (p === "/" || p === "/portal/launcher") {
    return await serveFile(req, "./static/index.html");
  }

  // 결과물/앱 정적 서빙
  if (p.startsWith("/static/") || p.startsWith("/deliverables/") || p.startsWith("/apps/")) {
    // /deliverables/*, /apps/* 도 /static 하위로 매핑
    const mapped = p.startsWith("/static/") ? `.${p}` : `./static${p}`;
    try { return await serveFile(req, mapped); } catch { /* 계속 */ }
    return await serveDir(req, { fsRoot: "./static", urlRoot: "/static", showDirListing: false });
  }

  // 기본 응답(빌드 핸드셰이크용, 지연 없음)
  return new Response("OK", { status: 200, headers: { "content-type": "text/plain; charset=utf-8" } });
});
