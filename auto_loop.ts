// auto_loop.ts — AUTO 루프(헬스 핑)
import { registerTick, setProgress } from "./ops_status.ts";

const AUTO_LOOP = (Deno.env.get("AUTO_LOOP") ?? "").toLowerCase() === "true";
const INTERVAL_MS = Number(Deno.env.get("AUTO_MS") ?? 1000 * 60 * 60); // 1h
const TARGET = Deno.env.get("HEALTH_URL") ?? "https://wic-auto-tools-2025.obk369369-spec.deno.net/health";

export async function autoOnce() {
  try {
    setProgress("AUTO", 10, "ping");
    const t0 = performance.now();
    const res = await fetch(TARGET, { method: "GET" });
    const dt = performance.now() - t0;
    registerTick("AUTO", { progress: 100, ok: res.ok, note: `latency=${dt.toFixed(0)}ms` });
    console.log(`[AUTO] ${res.status} at ${new Date().toISOString()} (+${dt.toFixed(0)}ms)`);
    setTimeout(() => setProgress("AUTO", 0, "idle"), 500);
  } catch (e) {
    registerTick("AUTO", { ok: false, note: String(e) });
    console.log("[AUTO] error:", e);
  }
}
if (AUTO_LOOP) { autoOnce().catch(()=>{}); setInterval(autoOnce, INTERVAL_MS); }
else console.log("[AUTO] disabled");
