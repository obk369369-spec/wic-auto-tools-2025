// client_watchdog.ts — 워치독(하트비트)
import { registerTick, setProgress } from "./ops_status.ts";

const WATCHDOG_LOOP = (Deno.env.get("WATCHDOG_LOOP") ?? "").toLowerCase() === "true";
const EVERY_MS = Number(Deno.env.get("WATCHDOG_MS") ?? 1000 * 60); // 1m
const cfg = Deno.env.get("CUSTOMER_CONFIG") || "[]";
let customers: Array<{ name: string; ping: string }>;
try { customers = JSON.parse(cfg); } catch { customers = []; }

export async function dogOnce() {
  setProgress("DOG", 5, "scan");
  let ok = true;
  const t0 = performance.now();
  for (const c of customers) {
    try { await fetch(c.ping, { method: "GET" }); console.log(`[DOG] ${c.name} ok`); }
    catch { ok = false; console.log(`[DOG] ${c.name} down`); }
  }
  registerTick("DOG", { progress: 100, ok, note: `checked=${customers.length}` });
  console.log(`[DOG] sweep +${(performance.now()-t0).toFixed(0)}ms ok=${ok}`);
  setTimeout(() => setProgress("DOG", 0, "idle"), 500);
}
if (WATCHDOG_LOOP) { dogOnce().catch(()=>{}); setInterval(dogOnce, EVERY_MS); }
else console.log("[DOG] disabled");
