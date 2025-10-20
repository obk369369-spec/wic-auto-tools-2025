// ──────────────────────────────────────────────
//  WIC Auto Tools 2025 – main.ts  (v2025.10.20-stable)
//  목적: Deno Deploy 완전호환 / 포트 지정 제거 / 전체 링크 통합
// ──────────────────────────────────────────────

console.log("[MAIN] WIC Auto Tools 2025 service starting…");

// 공통 라우터
Deno.serve(async (req) => {
  const { pathname, searchParams } = new URL(req.url);

  // 1️⃣ 헬스체크
  if (pathname === "/health") {
    return new Response(
      JSON.stringify({
        status: "ok",
        service: "wic-auto-tools-2025",
        time: new Date().toISOString(),
      }),
      { headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }

  // 2️⃣ 딥링크 리스트
  if (pathname === "/ops" && searchParams.get("action") === "links") {
    const base = "https://wic-auto-tools-2025.obk369369-spec.deno.net";
    const deno = "https://console.deno.com/obk369369-spec/wic-auto-tools-2025";
    const links = {
      HEALTH:  { url: `${base}/health`, menu: "Preview URL → /health" },
      EVIDENCE:{ url: `${base}/evidence`, menu: "Preview URL → /evidence" },
      STATUS:  { url: `${base}/ops?action=status`, menu: "Custom Ops → status" },
      AUTO:    { url: `${deno}/observability/logs?search=%5BAUTO%5D`, menu: "Console → Logs → [AUTO]" },
      REPORT:  { url: `${deno}/observability/logs?search=%5BREPORT%5D`, menu: "Console → Logs → [REPORT]" },
      SYNC:    { url: `${deno}/observability/logs?search=%5BSYNC%5D`, menu: "Console → Logs → [SYNC]" },
      DOG:     { url: `${deno}/observability/logs?search=%5BDOG%5D`, menu: "Console → Logs → [DOG]" },
      RECOVER: { url: `${deno}/observability/logs?search=%5BRECOVER%5D`, menu: "Console → Logs → [RECOVER]" },
      BUILDS:  { url: deno, menu: "Overview → Recent Production Builds" },
    };
    return new Response(
      JSON.stringify({ ok: true, links }, null, 2),
      { headers: { "content-type": "application/json; charset=utf-8" } },
    );
  }

  // 3️⃣ 루트 응답
  if (pathname === "/") {
    const html = `
      <html lang="ko"><head><meta charset="utf-8"/>
      <title>WIC Auto Tools 2025</title></head>
      <body>
        <h2>✅ WIC Auto Tools 2025 서버 정상 작동 중</h2>
        <ul>
          <li><a href="/health">/health</a></li>
          <li><a href="/ops?action=links">/ops?action=links</a></li>
        </ul>
      </body></html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // 4️⃣ 기타 요청 404
  return new Response("Not Found", { status: 404 });
});
