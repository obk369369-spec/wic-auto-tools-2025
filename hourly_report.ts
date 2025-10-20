// =====================
// HOURLY REPORT MODULE
// =====================
export async function reportTick() {
  console.log("[REPORT] start hourly check");
  try {
    const base =
      Deno.env.get("REPORT_BASE_URL") ??
      "https://wic-auto-tools-2025.obk369369-spec.deno.net";
    const url = (base.endsWith("/") ? base.slice(0, -1) : base) + "/health";
    const res = await fetch(url);
    const json = await res.json().catch(() => ({ status: "error" }));
    console.log(
      `[REPORT] ${new Date().toISOString()} status=${json.status ?? "unknown"}`
    );
  } catch (e) {
    console.error("[REPORT] error:", e);
  }
}
