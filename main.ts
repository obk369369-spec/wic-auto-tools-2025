// main.ts — Deno 표준 HTTP만 사용 (Oak 제거, Warm Up 호환)
import { serve } from "https://deno.land/std/http/server.ts";
import { serveFile, serveDir } from "https://deno.land/std/http/file_server.ts";

const ORIGIN = Deno.env.get("WIC_DATA_ORIGIN") ?? "https://wic-auto-tools-2025.obk369369-spec.deno.net/export";

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const p = url.pathname;

  // 1) 헬스/부트/업데이트
  if (p === "/ops/health")  return json({ ok:true, tz:"Asia/Seoul", iso:new Date().toISOString(), origin: ORIGIN });
  if (p === "/ops/bootstrap") return json({ ok:true, step:"bootstrap" });
  if (p === "/ops/update")    return json({ ok:true, step:"update" });

  // 2) 정시 보고
  if (p === "/report/live") {
    try {
      const txt = await Deno.readTextFile("./export/latest.json");
      // latest.json이 JSON 문자열이면 그대로 반환
      return new Response(txt, { headers: { "content-type": "application/json; charset=utf-8" } });
    } catch {
      return json({ ok:false, stalled:true, reason:"latest.json not found" }, 404);
    }
  }

  // 3) 런처(클릭 시 바로 결과물 열림)
  if (p === "/portal/launcher") {
    const html = `
      <h2>WIC 실행 런처</h2>
      <p>원본: ${ORIGIN}</p>
      <ul>
        <li><a href="/report/live" target="_blank">보고(Report Live)</a></li>
        <li><a href="/ops/health" target="_blank">헬스체크(Health)</a></li>
        <li><a href="/ops/bootstrap" target="_blank">부트스트랩(Bootstrap)</a></li>
        <li><a href="/deliverables/guide.html" target="_blank">고객 안내서</a></li>
        <li><a href="/deliverables/quote.html" target="_blank">견적서</a></li>
        <li><a href="/deliverables/executive-3pack.html" target="_blank">사장님 보고서 3종</a></li>
        <li><a href="/apps/subsite/index.html" target="_blank">서브홈 미리보기</a></li>
      </ul>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // 4) 결과물/앱 정적 서빙 (OK만 뜨던 문제 해결 포인트)
  if (p.startsWith("/deliverables/") || p.startsWith("/apps/")) {
    const filePath = `.${p}`; // ./static/ 없이 직접 두려면 아래 serveDir로 처리
    try { return await serveFile(req, filePath); } catch { /* 계속 진행 */ }
  }

  // 5) /static 전체 제공 (e.g. /static/deliverables/guide.html)
  if (p.startsWith("/static/")) {
    return await serveDir(req, { fsRoot: ".", showDirListing: false });
  }

  // 6) 기본: 404
  return json({ ok:false, reason:"not found", path:p }, 404);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
serve(handler);
