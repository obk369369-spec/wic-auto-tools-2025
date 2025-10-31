// main.ts — ORIGIN 하드코딩 + 기본 라우트
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const ORIGIN = "https://wic-auto-tools-2025.obk369369-spec.deno.net/export"; // 하드코딩

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

serve(async (req) => {
  const url = new URL(req.url);
  const p = url.pathname;

  if (p === "/ops/health") {
    return json({ ok: true, tz: "Asia/Seoul", origin: ORIGIN, iso: new Date().toISOString() });
  }

  if (p === "/ops/bootstrap") {
    // 부트스트랩 훅(필요 시 초기화 로직 추가)
    return json({ ok: true, step: "bootstrap" });
  }

  if (p === "/ops/update") {
    // 업데이트 훅(필요 시 동기화 로직 추가)
    return json({ ok: true, step: "update" });
  }

  if (p === "/report/live") {
    try {
      const latest = await fetchLatest(); // ORIGIN/latest.json → 캐시/스냅샷
      // compact table 변환
      const rows = Array.isArray(latest?.rows) ? latest.rows : [];
      const stalled = false;
      return json({ ok: true, stalled, rows, meta: { source: `${ORIGIN}/latest.json` } });
    } catch (e) {
      // fallback 스냅샷
      const rows = [
        { tool: "주문자동동기화", status: "ready", uis: 0.92 },
        { tool: "고객후속관리", status: "ready", uis: 0.90 },
        { tool: "보고서자동생성", status: "ready", uis: 0.88 },
      ];
      return json({ ok: true, stalled: true, reason: String(e?.message ?? e), rows, meta: { fallback: true, origin: ORIGIN } });
    }
  }

  if (p === "/portal/launcher") {
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
