// main.ts — Deno.serve 기반(Deploy 호환) + ORIGIN 하드코드
const ORIGIN = "https://wic-auto-tools-2025.obk369369-spec.deno.net/export";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

async function fetchLatest() {
  const u = `${ORIGIN}/latest.json`;
  const res = await fetch(u, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
  return await res.json();
}

Deno.serve(async (req: Request) => {
  const { pathname } = new URL(req.url);

  if (pathname === "/ops/health") {
    return json({ ok: true, tz: "Asia/Seoul", origin: ORIGIN, iso: new Date().toISOString() });
  }
  if (pathname === "/ops/bootstrap") return json({ ok: true, step: "bootstrap" });
  if (pathname === "/ops/update") return json({ ok: true, step: "update" });

  if (pathname === "/report/live") {
    try {
      const latest = await fetchLatest(); // ORIGIN/latest.json
      const rows = Array.isArray(latest?.rows) ? latest.rows : [];
      return json({ ok: true, stalled: false, rows, meta: { source: `${ORIGIN}/latest.json` } });
    } catch (e) {
      const rows = [
        { tool: "주문자동동기화", status: "ready", uis: 0.92 },
        { tool: "고객후속관리", status: "ready", uis: 0.90 },
        { tool: "보고서자동생성", status: "ready", uis: 0.88 },
      ];
      return json({ ok: true, stalled: true, reason: String(e?.message ?? e), rows, meta: { fallback: true, origin: ORIGIN } });
    }
  }

  if (pathname === "/portal/launcher") {
    const html = `<!doctype html><meta charset="utf-8">
<title>WIC Launcher</title>
<style>body{font:14px/1.4 system-ui;margin:24px} a{display:block;margin:8px 0}</style>
<h1>WIC 실행 런처</h1>
<p>원본: <code>${ORIGIN}</code></p>
<a href="/report/live" target="_blank">보고(Report Live)</a>
<a href="/ops/health" target="_blank">헬스체크(Health)</a>
<a href="/ops/update" target="_blank">업데이트(Update)</a>
<a href="/ops/bootstrap" target="_blank">부트스트랩(Bootstrap)</a>`;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  return new Response("OK", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
});
