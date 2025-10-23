// Deno Deploy 전용: 파일 I/O 제거, KV 사용
const kv = await Deno.openKv();

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

export default {
  async fetch(req: Request): Promise<Response> {
    const { pathname } = new URL(req.url);

    // 최신 실측 지표 조회
    if (pathname === "/export/latest.json") {
      const r = await kv.get(["export", "latest"]);
      if (!r.value) return j({ error: "ENOENT", hint: "no latest payload; POST /ops/bootstrap or /ops/update first" }, 404);
      return j(r.value);
    }

    // 상태 확인
    if (pathname === "/ops/health") {
      return j({ ok: true, ts: new Date().toISOString(), tz: "Asia/Seoul" });
    }

    // 최초 시드 생성 (빈 구조)
    if (pathname === "/ops/bootstrap" && req.method === "POST") {
      const seed = {
        generated_at: new Date().toISOString(),
        tools: [],
        summary: { active: 0, standby: 0, blocked: 0, avg_progress: 0.0 },
      };
      await kv.set(["export", "latest"], seed);
      return j({ ok: true, created: "kv://export/latest" });
    }

    // 최신 지표 수신(자동 보고 파이프라인이 여기로 POST)
    if (pathname === "/ops/update" && req.method === "POST") {
      const payload = await req.json();
      payload.generated_at = new Date().toISOString();
      await kv.set(["export", "latest"], payload);
      return j({ ok: true, stored: true });
    }

    // 잘못된 경로 안내
    if (pathname.startsWith("/export/latest.json/")) {
      return j({ error: "BAD_PATH", hint: "use /ops/health (not /export/latest.json/ops/health)" }, 400);
    }

    return t("OK", 200);
  },
};
