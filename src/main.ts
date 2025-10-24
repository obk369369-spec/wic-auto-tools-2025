// /src/main.ts — Deploy 최종본 (메모리 캐시, 파일/KV 미사용)
let lastHealth = { ok: false, ts: 0, msg: "uninitialized" } as { ok: boolean; ts: number; msg: string };
const KST = "Asia/Seoul";


const nowISO = () => new Date().toISOString();
const isStale = (ts: number, min = 90) => Date.now() - ts > min * 60 * 1000;


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
setInterval(selfHeal, 60_000);


export default {
async fetch(req: Request): Promise<Response> {
const { pathname } = new URL(req.url);


if (pathname === "/export/latest.json") {
if (!latest) return j({ error: "ENOENT", hint: "POST /ops/bootstrap or /ops/update first" }, 404);
return j({ ...latest, pipeline_status: isStale(latest._ts) ? "stalled" : "ok" });
}


if (pathname === "/ops/health") {
return j({ ...lastHealth, tz: KST, iso: nowISO() });
}


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


if (pathname === "/ops/update" && req.method === "POST") {
const payload = await req.json().catch(() => ({}));
const summary = payload.summary ?? { active: 0, standby: 0, blocked: 0, avg_progress: 0.0 };
latest = { ...payload, summary, generated_at: nowISO(), _ts: Date.now() };
lastHealth = { ok: true, ts: Date.now(), msg: "updated" };
return j({ ok: true, stored: true });
}


if (pathname.startsWith("/export/latest.json/")) {
return j({ error: "BAD_PATH", hint: "use /ops/health (not /export/latest.json/ops/health)" }, 400);
}


return t("OK", 200);
},
};
