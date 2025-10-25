// /src/main.ts
// 목적: latest.json 자동 회복 + 압축 리포트 생성 + 라이브 프록시
import { generateCompact, isStale90m } from "./lib/report.ts";

const ORIGIN = Deno.env.get("WIC_ORIGIN") ?? "https://wic-auto-tools-2025.obk369369-spec.deno.net";

async function selfHeal() {
  // 1) bootstrap → 2) update → 3) verify
  const s1 = await fetch(`${ORIGIN}/ops/bootstrap`, { method: "POST" }).then(r => r.ok);
  const s2 = await fetch(`${ORIGIN}/ops/update`, { method: "POST" }).then(r => r.ok);
  const ok = s1 && s2;
  let fresh = false;
  if (ok) {
    const r = await fetch(`${ORIGIN}/export/latest.json`, { cache: "no-store" });
    fresh = r.ok && !isStale90m(await r.clone().json().catch(()=>({ts:0})));
  }
  return { ok, fresh };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  // 1) 라이브 테이블(대화창용): /report/live
  if (url.pathname === "/report/live") {
    // 1-1 latest.json 시도
    let res = await fetch(`${ORIGIN}/export/latest.json`, { cache: "no-store" });
    if (!res.ok) {
      // 1-2 자가치유 루프
      const heal = await selfHeal();
      if (heal.ok) res = await fetch(`${ORIGIN}/export/latest.json`, { cache: "no-store" });
    }
    if (!res.ok) {
      return new Response(JSON.stringify({
        ok:false,
        stalled:true,
        reason:"404 or unreachable",
        hint:"/ops/bootstrap → /ops/update 필요",
      }), { status: 503, headers: { "content-type": "application/json; charset=utf-8" }});
    }
    const raw = await res.json();
    const compact = await generateCompact(raw, ORIGIN);
    return new Response(JSON.stringify(compact), { headers: { "content-type": "application/json; charset=utf-8" }});
  }

  // 2) 원본 latest.json 프록시(캐시 무효화)
  if (url.pathname === "/export/latest.json") {
    const r = await fetch(`${ORIGIN}/export/latest.json`, { cache: "no-store" });
    return new Response(r.body, { status: r.status, headers: { "content-type": "application/json; cache-control":"no-store" }});
  }

  // 3) 상태 핑
  if (url.pathname === "/ops/health") {
    return new Response(JSON.stringify({ ok:true, tz:"Asia/Seoul", now: new Date().toISOString() }), {
      headers: { "content-type": "application/json; charset=utf-8" }
    });
  }

  return new Response("OK", { headers: { "content-type": "text/plain; charset=utf-8" }});
});
