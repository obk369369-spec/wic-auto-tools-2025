// =============================
// File: hourly_report.ts (FINAL FIXED VERSION)
// =============================

// 실행 여부 환경 변수
const REPORT_LOOP = (Deno.env.get("REPORT_LOOP") ?? "").toLowerCase() === "true";

if (REPORT_LOOP) {
  const EVERY_MS = Number(Deno.env.get("REPORT_MS") ?? 1000 * 60 * 60); // 1시간 간격
  console.log(`[REPORT] loop enabled — interval=${EVERY_MS / 1000}s`);

  async function reportTick() {
    try {
      const base =
        Deno.env.get("REPORT_BASE_URL") ??
        "https://wic-auto-tools-2025.obk369369-spec.deno.net";
      // 슬래시 정규식 문제 제거
      const url = (base.endsWith("/") ? base.slice(0, -1) : base) + "/health";

      const res = await fetch(url);
      const json = await res.json().catch(() => ({ status: "error" }));
      console.log(
        `[REPORT] ${new Date().toISOString()} status=${json.status ?? "unknown"} region=${json.region ?? "-"}`
      );
    } catch (e) {
      console.log("[REPORT] error:", e);
    }
  }

  // 초기 즉시 실행 + 주기적 반복
  reportTick();
  setInterval(reportTick, EVERY_MS);
} else {
  console.log("[REPORT] REPORT_LOOP=false → skip hourly report loop");
}
