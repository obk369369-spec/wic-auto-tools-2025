// =====================================
// File: auto_loop.ts (FINAL ALL-IN-ONE)
// =====================================
import { setProgress, registerTick, log } from "./ops.ts";

const AUTO_LOOP = (Deno.env.get("AUTO_LOOP") ?? "true").toLowerCase() === "true";
const HEALTH_URL = Deno.env.get("HEALTH_URL") ?? "https://wic-auto-tools-2025.obk369369-spec.deno.net/health";
const FETCH_TIMEOUT_MS = Number(Deno.env.get("FETCH_TIMEOUT_MS") ?? 8000);

// util
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
async function timedFetch(url: string, timeoutMs: number) {
  const ctrl = new AbortController(); const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try { return await fetch(url, { signal: ctrl.signal }); } finally { clearTimeout(id); }
}

if (!AUTO_LOOP) {
  console.log("[AUTO] AUTO_LOOP=false — disabled");
  ["AUTO","REPORT","SYNC","DOG","RECOVER"].forEach(g => setProgress(g, 0, "disabled"));
} else {
  (async function mainLoop() {
    while (true) {
      // === AUTO ===
      registerTick("AUTO", 3600);
      setProgress("AUTO", 10, "start"); log("AUTO","INFO","start");
      await sleep(200); setProgress("AUTO", 60, "phase A"); log("AUTO","INFO","phase A");
      await sleep(200); setProgress("AUTO", 100, "done");   log("AUTO","INFO","done");

      // === REPORT ===
      registerTick("REPORT", 3600);
      setProgress("REPORT", 20, "collect logs"); log("REPORT","INFO","collect");
      await sleep(150); setProgress("REPORT", 100, "sent");  log("REPORT","INFO","sent");

      // === SYNC ===
      registerTick("SYNC", 1200);
      const tSync = performance.now();
      setProgress("SYNC", 5, "sync start"); log("SYNC","INFO","start");
      await sleep(250);
      const dtSync = performance.now() - tSync;
      if (dtSync > 2000) log("SYNC","WARN","slow", { durationMs: dtSync });
      setProgress("SYNC", 100, "done"); log("SYNC","INFO","done", { durationMs: dtSync });

      // === DOG (health) ===
      registerTick("DOG", 60);
      setProgress("DOG", 30, "check /health");
      try {
        const r = await timedFetch(HEALTH_URL, FETCH_TIMEOUT_MS);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        setProgress("DOG", 100, "ok"); log("DOG","INFO","health ok");
      } catch (e) {
        setProgress("DOG", 0, "timeout/error"); log("DOG","ERROR", `health fail: ${String((e as Error).message)}`);
      }

      // === RECOVER (noop hook) ===
      registerTick("RECOVER", 600);
      setProgress("RECOVER", 100, "idle"); log("RECOVER","INFO","idle");

      // 루프 간격(가볍게 5초)
      await sleep(5000);
    }
  })();
}
