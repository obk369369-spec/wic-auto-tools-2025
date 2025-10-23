// main.ts — Deploy 최종본 (메모리 캐시, 파일/KV 미사용)
// 엔드포인트: 
//  GET  /export/latest.json  → 최신 실측 지표(메모리 캐시)
//  GET  /ops/health          → 헬스 체크
//  POST /ops/bootstrap       → 초기 시드 생성
//  POST /ops/update          → 파이프라인이 최신 지표 업로드(웹훅)

// Deno Deploy에서 바로 동작 (추가 플래그 불필요)
function j(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
function t(s: string, status = 200) {
  return new Response(s, {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
  });
}

// —— 메모리 캐시(리전별 런타임 수명 동안 유지) ——
let latest: any = null;
let lastHealth = { ok: false, ts: 0, msg: "uninitialized" };

function nowISO() { return new Date().toISOString(); }
function isStale(ts: number, maxMin = 90) {
  return Date.now() - ts > maxMin * 60 * 1000;
}

// 자가치유(90분 이상 갱신 없으면 시드 재주입)
async function selfHeal() {
  if (!latest || !latest._ts || isStale(latest._ts)) {
    latest = latest ?? {
      generated_at: nowISO(),
      tools: [],
      summary: { active: 0, standby: 0, blocked: 0, avg_progress: 0.0 },
      _ts: Date.now(),
      _note: "seeded by self-heal",
    };
  }
  lastHealth = { ok: true, ts: Date.now(), msg: "alive" };
}
setInterval(selfHeal, 60_000); // 1분마다 점검

export default {
  async fetch(req: Request): Promise<Response> {
    const { pathname } = new URL(req.url);

    // 최신 실측 지표
    if (pathname === "/export/latest.json") {
      if (!latest) return j({ error: "ENOENT", hint: "POST /ops/bootstrap or /ops/update first" }, 404);
      return j({
        ...latest,
        pipeline_status: isStale(latest._ts) ? "stalled" : "ok",
      });
    }

    // 헬스 체크
    if (pathname === "/ops/health") {
      return j({ ...lastHealth, tz: "Asia/Seoul", iso: nowISO() });
    }

    // 초기 시드 생성(수동 1회)
    if (pathname === "/ops/bootstrap" && req.method === "POST") {
      latest = {
        generated_at: nowISO(),
        tools: [],
        summary: { active: 0, standby: 0, blocked: 0, avg_progress: 0.0 },
        _ts: Date.now(),
        _note: "seeded by bootstrap",
      };
      lastHealth = { ok: true, ts: Date.now(), msg: "bootstrap ok" };
      return j({ ok: true, created: "/export/latest.json" });
    }

    // 파이프라인이 업로드(정시 루프/1분 루프)
    if (pathname === "/ops/update" && req.method === "POST") {
      const payload = await req.json().catch(() => ({}));
      // 필수 필드 보정
      const summary = payload.summary ?? { active: 0, standby: 0, blocked: 0, avg_progress: 0.0 };
      latest = {
        ...payload,
        summary,
        generated_at: nowISO(),
        _ts: Date.now(),
      };
      lastHealth = { ok: true, ts: Date.now(), msg: "updated" };
      return j({ ok: true, stored: true });
    }

    // 잘못된 하위 경로 오타 방지
    if (pathname.startsWith("/export/latest.json/")) {
      return j({ error: "BAD_PATH", hint: "use /ops/health (not /export/latest.json/ops/health)" }, 400);
    }

    return t("OK", 200);
  },
};
