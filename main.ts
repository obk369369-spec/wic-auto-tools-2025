// ↓ 기존 Deno.serve 핸들러 안에 라우팅만 추가
if (pathname === "/ops" && url.searchParams.get("action") === "links") {
  const base = "https://wic-auto-tools-2025.obk369369-spec.deno.net";
  const deno = "https://console.deno.com/obk369369-spec/wic-auto-tools-2025";
  const links = {
    HEALTH: { url: `${base}/health`, menu: "Preview URL → /health" },
    EVIDENCE:{ url: `${base}/evidence`, menu: "Preview URL → /evidence" },
    STATUS:  { url: `${base}/ops?action=status`, menu: "Custom Ops → status" },
    AUTO:    { url: `${deno}/observability/logs?search=%5BAUTO%5D`, menu: "Console → Logs → 검색: [AUTO]" },
    REPORT:  { url: `${deno}/observability/logs?search=%5BREPORT%5D`, menu: "Console → Logs → 검색: [REPORT]" },
    SYNC:    { url: `${deno}/observability/logs?search=%5BSYNC%5D`, menu: "Console → Logs → 검색: [SYNC]" },
    DOG:     { url: `${deno}/observability/logs?search=%5BDOG%5D`, menu: "Console → Logs → 검색: [DOG]" },
    RECOVER: { url: `${deno}/observability/logs?search=%5BRECOVER%5D`, menu: "Console → Logs → 검색: [RECOVER]" },
    BUILDS:  { url: deno, menu: "Overview → Recent Production Builds" },
  };
  return new Response(JSON.stringify({ ok:true, links }, null, 2),
    { headers: { "content-type":"application/json; charset=utf-8" } });
}
