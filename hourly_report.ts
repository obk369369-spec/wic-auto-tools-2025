// hourly_report.ts
// 리포트 루프: /health 상태를 주기적으로 확인하고 콘솔에 기록함
// 오류 방지를 위해 정규식 제거, 문자열 방식으로 URL 결합 처리

const REPORT_LOOP = (Deno.env.get("REPORT_LOOP") ?? "").toLowerCase() === "true";

if (REPORT_LOOP) {
  const EVERY_MS = Number(Deno.env.get("REPORT_MS")) || 1000 * 60 * 60; // 1시간 기본 간격

  async function reportTick() {
    try {
      // 기본 URL
      const base =
        Deno.env.get("REPORT_BASE_URL") ||
        "https://wic-auto-tools-2025.obk369369-spec.deno.net";

      // ✅ 정규식 없이 URL 결합
      const url = (base.endsWith("/") ? base.slice(0, -1) : base) + "/health";

      // 헬스 체크 요청
      const res = await fetch(url);
      const j = await res.json().catch(() => ({ status: "error" }));

      // 로그 출력
      console.log(
        `[REPORT] ${new Date().toISOString()} status=${j.status ?? "unknown"}`
      );
    } catch (e) {
      console.log("[REPORT] error", e);
    }
  }

  // 즉시 실행 후 반복
  reportTick().catch(() => {});
  setInterval(reportTick, EVERY_MS);
}
