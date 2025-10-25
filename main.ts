// /main.ts
// 단일 엔트리: /report/live, /export/latest.json, /ops/* + 자동 자가치유
// 외부 파일/임포트 없음. Deno Deploy 표준 API만 사용.
const ORIGIN =
  Deno.env.get("WIC_ORIGIN") ??
  "https://wic-auto-tools-2025.obk369369-spec.deno.net";

// ---------- 유틸 ----------
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
async function post(path: string): Promise<boolean> {
  try {
    const r = await fetch(`${ORIGIN}${path}`, { method: "POST", cache: "no-store" });
    return r.ok;
  } catch {
    return false;
  }
}
async function getLatest(): Promise<{ ok: boolean; status: number; data: any | null }> {
  try {
    const r = await fetch(`${ORIGIN}/export/latest.json`, { cache: "no-store" });
    const data = r.ok ? await r.json().catch(() => null) : null;
    return { ok: r.ok && !!data, status: r.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}
function isStale90m(obj: any): boolean {
  const ts = typeof obj?.ts === "number" ? obj.ts : 0;
  return !ts || (Date.now() - ts) > 90 * 60 * 1000;
}
function toInt(n: any, d = 0) { const v = Number(n); return Number.isFinite(v) ? Math.round(v) : d; }

// ---------- compact 변환 ----------
function toCompact(raw: any, origin: string) {
  const tools = Array.isArray(raw?.tools) ? raw.tools : [];
  const rows = tools.map((t: any) => ({
    "도구명(한글)": t?.name_kr ?? "-",
    "진행률(%)": toInt(t?.progress, 0),
    "ETA(분)": (t?.eta_min ?? null),
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

// ---------- 자가치유 ----------
async function selfHeal(): Promise<void> {
  await post("/ops/bootstrap");
  await post("/ops/update");
}

// ---------- 라우터 ----------
Deno.serve(async (req) => {
  try {
    const { pathname } = new URL(req.url);

    if (pathname === "/ops/health") {
      return json({ ok: true, tz: "Asia/Seoul", iso: new Date().toISOString() });
    }

    if (pathname === "/ops/bootstrap" && req.method === "POST") {
      const ok = await post("/ops/bootstrap");
      return json({ ok }, ok ? 200 : 500);
    }

    if (pathname === "/ops/update" && req.method === "POST") {
      const ok = await post("/ops/update");
      return json({ ok }, ok ? 200 : 500);
    }

    // 원본 latest 프록시
    if (pathname === "/export/latest.json") {
      const r = await fetch(`${ORIGIN}/export/latest.json`, { cache: "no-store" });
      return new Response(r.body, {
        status: r.status,
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
      });
    }

    // 대화창용 compact 리포트(자동 복구 포함)
    if (pathname === "/report/live") {
      // 1차 시도
      let latest = await getLatest();
      // 실패 또는 stale → 자가치유 → 재시도
      if (!latest.ok || isStale90m(latest.data)) {
        await selfHeal();
        latest = await getLatest();
      }
      if (!latest.ok || !latest.data) {
        return json({
          ok: false,
          stalled: true,
          reason: "404/unreachable or stale>90m",
          hint: "POST /ops/bootstrap → POST /ops/update 후 재시도",
        }, 503);
      }
      const compact = toCompact(latest.data, ORIGIN);
      return json(compact);
    }

    // 기본
    return new Response("OK", { headers: { "content-type": "text/plain; charset=utf-8" } });
  } catch (e) {
    return json({ ok:false, error: String(e) }, 500);
  }
});
