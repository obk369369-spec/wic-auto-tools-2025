// /main.ts — 단일 엔트리. 외부 데이터 원본만 조회(자기 호출 금지), 실패시 명확한 stalled 신호.
// 필요 라우트: /ops/health, /ops/bootstrap, /ops/update, /export/latest.json, /report/live
const DATA_ORIGIN = Deno.env.get("WIC_DATA_ORIGIN"); // 예: https://wic-auto-tools-2025-data.obk369369-spec.deno.net

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function fetchJson(url: string, timeoutMs = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    const data = r.ok ? await r.json().catch(() => null) : null;
    return { ok: r.ok && !!data, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  } finally {
    clearTimeout(t);
  }
}

function isStale90m(obj: any): boolean {
  const ts = typeof obj?.ts === "number" ? obj.ts : 0;
  return !ts || Date.now() - ts > 90 * 60 * 1000;
}

function toInt(n: any, d = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.round(v) : d;
}

function compact(raw: any, origin: string) {
  const tools = Array.isArray(raw?.tools) ? raw.tools : [];
  const rows = tools.map((t: any) => ({
    "도구명(한글)": t?.name_kr ?? "-",
    "진행률(%)": toInt(t?.progress, 0),
    "ETA(분)": t?.eta_min ?? null,
    "상태": t?.status ?? "-",
    "자가치유": t?.self_heal ?? "-",
    "링크": {
      progress: t?.links?.progress ?? `${origin}/ops/progress`,
      eta:      t?.links?.eta      ?? `${origin}/ops/eta`,
      logs:     t?.links?.logs     ?? `${origin}/ops/logs`,
      health:   t?.links?.health   ?? `${origin}/ops/health`,
    },
    "그룹": t?.group ?? "misc",
  }));

  // 그룹 요약
  const agg = new Map<string, { cnt:number; active:number; standby:number; blocked:number; done:number; sum:number }>();
  for (const r of rows) {
    const g = r["그룹"];
    if (!agg.has(g)) agg.set(g, { cnt:0, active:0, standby:0, blocked:0, done:0, sum:0 });
    const a = agg.get(g)!;
    a.cnt++; a.sum += toInt(r["진행률(%)"]);
    const s = r["상태"];
    if (s === "active") a.active++; else if (s === "standby") a.standby++;
    else if (s === "blocked") a.blocked++; else if (s === "done") a.done++;
  }
  const group_summaries = [...agg.entries()].map(([group, v]) => ({
    group, active:v.active, standby:v.standby, blocked:v.blocked, done:v.done,
    avg_progress: v.cnt ? Math.round(v.sum / v.cnt) : 0,
  }));

  const ts = typeof raw?.ts === "number" ? raw.ts : 0;
  const stalled = isStale90m(raw);
  return {
    ok: true,
    ts,
    iso: ts ? new Date(ts).toISOString() : null,
    stalled,
    warn: stalled ? "데이터가 90분 이상 갱신되지 않았습니다. 파이프라인 정지(stalled) 가능성." : null,
    rows,
    group_summaries,
  };
}

async function callProducer(path: "/ops/bootstrap" | "/ops/update") {
  if (!DATA_ORIGIN) return false;
  try {
    const r = await fetch(`${DATA_ORIGIN}${path}`, { method: "POST", cache: "no-store" });
    return r.ok;
  } catch { return false; }
}

Deno.serve(async (req) => {
  try {
    const { pathname } = new URL(req.url);

    if (pathname === "/ops/health") {
      return json({ ok: true, tz: "Asia/Seoul", iso: new Date().toISOString() });
    }

    if (pathname === "/ops/bootstrap" && req.method === "POST") {
      const ok = await callProducer("/ops/bootstrap");
      return json({ ok }, ok ? 200 : 500);
    }

    if (pathname === "/ops/update" && req.method === "POST") {
      const ok = await callProducer("/ops/update");
      return json({ ok }, ok ? 200 : 500);
    }

    if (pathname === "/export/latest.json") {
      if (!DATA_ORIGIN) return json({ ok:false, error:"WIC_DATA_ORIGIN not set" }, 500);
      const r = await fetchJson(`${DATA_ORIGIN}/export/latest.json`);
      if (!r.ok) return json({ ok:false, status:r.status }, r.status || 502);
      return json(r.data);
    }

    if (pathname === "/report/live") {
      if (!DATA_ORIGIN) {
        return json({
          ok:false, stalled:true, reason:"no DATA_ORIGIN",
          hint:"/deno.jsonc env.WIC_DATA_ORIGIN 설정 후 재배포"
        }, 500);
      }
      // 1차 시도
      let r = await fetchJson(`${DATA_ORIGIN}/export/latest.json`);
      // 실패 또는 stale → 프로듀서 자가치유 → 재시도
      if (!r.ok || isStale90m(r.data)) {
        await callProducer("/ops/bootstrap");
        await callProducer("/ops/update");
        r = await fetchJson(`${DATA_ORIGIN}/export/latest.json`);
      }
      if (!r.ok || !r.data) {
        return json({
          ok:false, stalled:true,
          reason: r.ok ? "stale>90m" : "404/unreachable",
          hint:"POST /ops/bootstrap → POST /ops/update 후 재시도"
        }, 503);
      }
      return json(compact(r.data, DATA_ORIGIN));
    }

    return new Response("OK", { headers: { "content-type":"text/plain; charset=utf-8" } });
  } catch (e) {
    return json({ ok:false, error:String(e) }, 500);
  }
});
