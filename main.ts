import { serve } from "https://deno.land/std/http/server.ts";
import { serveFile } from "https://deno.land/std/http/file_server.ts";
import { Router } from "https://deno.land/x/oak/mod.ts";

const router = new Router();

// 기본 API 엔드포인트
router.get("/ops/health", (ctx) => {
  ctx.response.headers.set("Content-Type", "application/json");
  ctx.response.body = JSON.stringify({
    ok: true,
    tz: "Asia/Seoul",
    iso: new Date().toISOString(),
  });
});

router.get("/ops/bootstrap", (ctx) => {
  ctx.response.headers.set("Content-Type", "application/json");
  ctx.response.body = JSON.stringify({ ok: true, step: "bootstrap" });
});

router.get("/report/live", async (ctx) => {
  const data = await Deno.readTextFile("./export/latest.json");
  ctx.response.headers.set("Content-Type", "application/json");
  ctx.response.body = data;
});

// ✅ 여기 수정: async 추가
router.get(/^\/deliverables\/(.+)$/, async (ctx) => {
  ctx.response = await serveFile(ctx.request, `./static/deliverables/${ctx.params[0]}`);
});
router.get(/^\/apps\/(.+)$/, async (ctx) => {
  ctx.response = await serveFile(ctx.request, `./static/apps/${ctx.params[0]}`);
});

// 런처 화면
router.get("/portal/launcher", (ctx) => {
  ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
  ctx.response.body = `
  <h2>WIC 실행 런처</h2>
  <p>원본: https://wic-auto-tools-2025.obk369369-spec.deno.net/export</p>
  <ul>
    <li><a href="/report/live" target="_blank">보고(Report Live)</a></li>
    <li><a href="/ops/health" target="_blank">헬스체크(Health)</a></li>
    <li><a href="/ops/bootstrap" target="_blank">부트스트랩(Bootstrap)</a></li>
    <li><a href="/deliverables/guide.html" target="_blank">고객 안내서</a></li>
    <li><a href="/deliverables/quote.html" target="_blank">견적서</a></li>
    <li><a href="/deliverables/executive-3pack.html" target="_blank">사장님 보고서 3종</a></li>
    <li><a href="/apps/subsite/index.html" target="_blank">서브홈 미리보기</a></li>
  </ul>
  `;
});

// ✅ 서버 시작 (oak이 아닌 기본 serve 사용)
serve((req) => router.handle(req));
