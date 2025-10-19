// hourly_report.ts  (FINAL)
const REPORT_LOOP = (Deno.env.get("REPORT_LOOP") ?? "").toLowerCase() === "true";

if (REPORT_LOOP) {
  const EVERY_MS = Number(Deno.env.get("REPORT_MS")) || 1000 * 60 * 60;

  async function reportTick() {
    try {
      const base =
        Deno.env.get("REPORT_BASE_URL") ||
        "https://wic-auto-tools-2025.obk369369-spec.deno.net";
      const url = base.replace(/\/$/, "") + "/health"; // ← 올바른 정규식
      const res = await fetch(url);
      const j = await res.json().catch(() => ({ status: "error" }));
      console.log(
        `[REPORT] ${new Date().toISOString()} status=${j.status ?? "unknown"}`
      );
    } catch (e) {
      console.log("[REPORT] error", e);
    }
  }

  reportTick().catch(() => {});
  setInterval(reportTick, EVERY_MS);
}
