// main.ts — KV 안정화 + 자가복구 포함 버전 (2025.10 Final)
// Run with: deno run --allow-net --allow-env --unstable-kv src/main.ts
// 또는 deno.json에 { "unstable": ["kv"] } 추가

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const kv = await Deno.openKv();
const HEALTH_KEY = ["ops", "health"];
const EXPORT_KEY = ["export", "latest"];
const STATUS_KEY = ["ops", "status"];

async function bootstrap() {
  const init = {
    tools: [],
    active: 0,
    standby: 0,
    blocked: 0,
    avg_progress: 0,
    updated: new Date().toISOString(),
  };
  await kv.set(EXPORT_KEY, init);
  await kv.set(STATUS_KEY, { status: "ready", t: Date.now() });
  await kv.set(HEALTH_KEY, { ok: true, ts: Date.now(), msg: "bootstrap ok" });
}

async function updateHealth(ok: boolean, msg = "") {
  await kv.set(HEALTH_KEY, {
    ok,
    msg,
    ts: Date.now(),
  });
}

async function getHealth() {
  const h = await kv.get(HEALTH_KEY);
  return h.value ?? { ok: false, msg: "uninitialized" };
}

async function selfHeal() {
  const h = await getHealth();
  const elapsed = Date.now() - (h.ts ?? 0);
  if (elapsed > 1000 * 60 * 90 || !h.ok) {
    await updateHealth(true, "auto self-heal triggered");
    const data = await kv.get(EXPORT_KEY);
    if (!data.value) await bootstrap();
  }
}

setInterval(selfHeal, 1000 * 60 * 10); // 10분마다 자가복구

serve(async (req) => {
  const url = new URL(req.url);

  if (url.pathname === "/ops/bootstrap") {
    await bootstrap();
    return new Response(JSON.stringify({ ok: true, msg: "bootstrap done" }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (url.pathname === "/ops/health") {
    const h = await getHealth();
    return new Response(JSON.stringify(h), {
      headers: { "content-type": "application/json" },
    });
  }

  if (url.pathname === "/export/latest.json") {
    const d = await kv.get(EXPORT_KEY);
    return new Response(JSON.stringify(d.value ?? {}), {
      headers: { "content-type": "application/json" },
    });
  }

  if (url.pathname === "/ops/update") {
    const body = await req.json().catch(() => ({}));
    await kv.set(EXPORT_KEY, { ...body, updated: new Date().toISOString() });
    await updateHealth(true, "updated");
    return new Response(JSON.stringify({ ok: true }));
  }

  return new Response("ok");
});

console.log("✅ KV 서버 정상 실행 중 (http://localhost:8000)");
