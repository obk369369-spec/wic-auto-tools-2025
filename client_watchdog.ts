// =============================
// File: client_watchdog.ts
// =============================
const WATCHDOG_LOOP = (Deno.env.get("WATCHDOG_LOOP") ?? "").toLowerCase() === "true";

if (WATCHDOG_LOOP) {
  const CONFIG = Deno.env.get("CUSTOMER_CONFIG") || "[]";
  let customers: Array<{ name: string; ping: string }>;
  try { customers = JSON.parse(CONFIG); } catch { customers = []; }

  async function tick() {
    for (const c of customers) {
      try {
        await fetch(c.ping);
        console.log(`[DOG] ${c.name} ok`);
      } catch {
        console.log(`[DOG] ${c.name} down`);
      }
    }
  }

  tick().catch(() => {});
  setInterval(tick, 1000 * 60 * 30);
}
