// =============================
// File: auto_loop.ts
// =============================
const AUTO_LOOP = (Deno.env.get("AUTO_LOOP") ?? "").toLowerCase() === "true";

if (AUTO_LOOP) {
  const TARGET = Deno.env.get("HEALTH_URL") || "https://wic-auto-tools-2025.obk369369-spec.deno.net/health";
  const INTERVAL_MS = 1000 * 60 * 60;

  async function tick() {
    const t0 = performance.now();
    const res = await fetch(TARGET);
    const t1 = performance.now();
    console.log(`[AUTO] ${res.status} ${new Date().toISOString()} +${(t1 - t0).toFixed(0)}ms`);
  }

  tick().catch(e => console.log("[AUTO] first-tick error:", e));
  setInterval(tick, INTERVAL_MS);
} else {
  console.log("[AUTO] disabled");
}
