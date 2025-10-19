// =============================
// File: auto_recover.ts
// =============================
const RECOVER_LOOP = (Deno.env.get("RECOVER_LOOP") ?? "").toLowerCase() === "true";

if (RECOVER_LOOP) {
  const BASE = Deno.env.get("REPORT_BASE_URL") || "https://wic-auto-tools-2025.obk369369-spec.deno.net";
  const HOOK = Deno.env.get("REDEPLOY_HOOK_URL");
  const THRESH = Number(Deno.env.get("RECOVER_THRESHOLD")) || 3;
  let fails = 0;

  async function probe() {
    try {
      const res = await fetch(BASE + "/health");
      if (!res.ok) throw new Error(String(res.status));
      fails = 0;
      console.log("[RECOVER] ok");
    } catch (e) {
      fails++;
      console.log("[RECOVER] fail", fails);
      if (fails >= THRESH && HOOK) {
        await fetch(HOOK, { method: "POST" });
        console.log("[RECOVER] redeploy hook fired");
        fails = 0;
      }
    }
  }

  setInterval(probe, 1000 * 60 * 10);
  probe().catch(() => {});
}
