// /main.ts
// 엔트리포인트: /report/live, /ops/*, /export/latest.json 라우팅 + 자동 복구 루프
import { generateCompact, isStale90m } from "./lib/report.ts";

const ORIGIN = Deno.env.get("WIC_ORIGIN")
  ?? "https://wic-auto-tools-2025.obk369369-spec.deno.net";

async function post(path: string) {
  const r = await fetch(`${ORIGIN}${path}`, { method: "POST", cache: "no-store" });
  return r.ok;
}
async function getJson(path: string) {
  const r = await fetch(`${ORIGIN}${path}`, { cache: "no-store" });
  if (!r.ok) return { ok:false, status:r.status, data:null };
  const data = await r.json().catch(() => null);
  return { ok:true, status:r.status, data };
}
async function selfHealAndFetch() {
  // 1) bootstrap → 2) update → 3) latest 재조회
  await post("/ops/bootstrap");
  await post("/ops/update");
  const latest = await getJson("/export/latest.json");
  return latest;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // 상태 핑
  if (path === "/ops/health") {
    return new Response(
      JSON.stringify({ ok:true, tz:"Asia/Seoul", iso:new Date().toISOString() }),
      { headers: { "content-type":"application/json; charset=utf-8" } }
    );
  }

  // 실측 보고용 Compact JSON
  if (path === "/report/live") {
    // 1차 시도
    let latest = await getJson("/export/latest.json");
    // 실패 or 90분 지연 → 자가복구 후 재시도
    const stale = latest.ok && isStale90m(latest.data);
    if (!latest.ok || stale) latest = await selfHealAndFetch();

    if (!latest.ok || !latest.data) {
      return new Response(
        JSON.stringify({
          ok:false, stalled:true, reason:"404/timeout or stale>90m",
          hint:"POST /ops/bootstrap → POST /ops/update 후 재시도",
        }),
        { status:503, headers:{ "content-type":"application/json; charset=utf-8" } }
      );
    }
    const compact = await generateCompact(latest.data, ORIGIN);
    return new Response(JSON.stringify(compact), {
      headers:{ "content-type":"application/json; charset=utf-8", "cache-control":"no-store" }
    });
  }

  // 원본 latest.json 프록시(캐시 무효화)
  if (path === "/export/latest.json") {
    const r = await fetch(`${ORIGIN}/export/latest.json`, { cache:"no-store" });
    return new Response(r.body, {
      status:r.status,
      headers:{ "content-type":"application/json; charset=utf-8", "cache-control":"no-store" }
    });
  }

  // 수동 복구 트리거(옵션)
  if (path === "/ops/update" && req.method === "POST") {
    const ok = await post("/ops/update");
    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : 500,
      headers:{ "content-type":"application/json; charset=utf-8" }
    });
  }
  if (path === "/ops/bootstrap" && req.method === "POST") {
    const ok = await post("/ops/bootstrap");
    return new Response(JSON.stringify({ ok }), {
      status: ok ? 200 : 500,
      headers:{ "content-type":"application/json; charset=utf-8" }
    });
  }

  // 기본
  return new Response("OK");
});
