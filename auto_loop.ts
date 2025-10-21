// =============================
// File: auto_loop.ts  (REPLACE)
// =============================

import { setProgress, registerTick } from "./ops.ts";

const AUTO_LOOP = (Deno.env.get("AUTO_LOOP") ?? "").toLowerCase() === "true";
if (!AUTO_LOOP) {
  console.log("[AUTO] AUTO_LOOP=false → background loop is disabled");
  // 진행률도 off 표시
  setProgress("AUTO", 0, "disabled");
  setProgress("DOG", 0, "disabled");
  setProgress("REPORT", 0, "disabled");
  export {};
} else {
  const HEALTH_URL =
    Deno.env.get("HEALTH_URL") ||
    "https://wic-auto-tools-2025.obk369369-spec.deno.net/health";

  // === 공통 유틸 ===
  function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function timedFetch(url: string, timeoutMs: number) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(url, { signal: ctrl.signal });
    } finally {
      clearTimeout(id);
    }
  }

  // === AUTO: 헬스 워밍업 ===
  async function autoTick() {
    setProgress("AUTO", 5, "ping /health");
    const t0 = performance.now();
    const res = await fetch(HEALTH_URL);
    const t1 = performance.now();
    const ok = res.ok;
    setProgress("AUTO", ok ? 100 : 20, `status=${res.status} +${(t1 - t0).toFixed(0)}ms`);
    console.log(
      `[AUTO] Health check ${res.status} at ${new Date().toISOString()} (+${(t1 - t0).toFixed(0)}ms)`,
    );
  }

  // === DOG: 네트워크/의존성 감시 (타임아웃+재시도+자가복구) ===
  async function dogTick() {
    const TIMEOUT_MS = Number(Deno.env.get("DOG_TIMEOUT_MS") ?? 25_000);
    const RETRIES = Number(Deno.env.get("DOG_RETRIES") ?? 3);

    setProgress("DOG", 5, `start check (timeout=${TIMEOUT_MS}ms, retries=${RETRIES})`);

    let lastErr: unknown = null;
    for (let i = 0; i < RETRIES; i++) {
      try {
        setProgress("DOG", 15 + i * 10, `try ${i + 1}/${RETRIES}`);
        const res = await timedFetch(HEALTH_URL, TIMEOUT_MS);
        if (res.ok) {
          setProgress("DOG", 100, `ok ${res.status}`);
          console.log(`[DOG] ok (${res.status})`);
          return;
        } else {
          lastErr = new Error(`HTTP ${res.status}`);
          setProgress("DOG", 30 + i * 10, `http ${res.status} → backoff`);
        }
      } catch (e) {
        lastErr = e;
        setProgress("DOG", 30 + i * 10, `timeout/abort → backoff`);
      }
      await sleep(5_000 * Math.max(1, i + 1)); // 지수 백오프(5s, 10s, 15s…)
    }

    // 모든 재시도 실패 → 자가복구 트리거
    setProgress("DOG", 0, "timeout → auto_recover()");
    console.log("[DOG] Timeout detected → triggering auto_recover()", lastErr);
    try {
      const mod = await import("./auto_recover.ts");
      await (mod.default?.() ?? mod.autoRecover?.());
    } catch (e) {
      console.log("[DOG] auto_recover load/exec failed:", e);
    } finally {
      // 1분 뒤 재시도 예약
      registerTick("DOG", 60);
    }
  }

  // === REPORT: 요약 로그(+헬스) 한 줄 출력 ===
  async function reportTick() {
    const base =
      Deno.env.get("REPORT_BASE_URL") ||
      "https://wic-auto-tools-2025.obk369369-spec.deno.net";
    const url = (base.endsWith("/") ? base.slice(0, -1) : base) + "/health";
    setProgress("REPORT", 10, "fetch /health");
    try {
      const res = await fetch(url);
      const json = await res.json().catch(() => ({} as any));
      setProgress(
        "REPORT",
        100,
        `status=${json.status ?? "unknown"} region=${json.region ?? "-"}`,
      );
      console.log(
        `[REPORT] ${new Date().toISOString()} status=${json.status ?? "?"} region=${json.region ?? "-"}`,
      );
    } catch (e) {
      setProgress("REPORT", 0, "error");
      console.log("[REPORT] error:", e);
    }
  }

  // === 스케줄 ===
  const AUTO_MS = Number(Deno.env.get("AUTO_MS") ?? 1000 * 60 * 60);
  const DOG_MS = Number(Deno.env.get("DOG_MS") ?? 1000 * 60 * 15);
  const REPORT_MS = Number(Deno.env.get("REPORT_MS") ?? 1000 * 60 * 30);

  // 첫 실행 즉시
  autoTick().catch(() => {});
  dogTick().catch(() => {});
  reportTick().catch(() => {});
  // 주기 예약
  setInterval(autoTick, AUTO_MS);
  setInterval(dogTick, DOG_MS);
  setInterval(reportTick, REPORT_MS);

  // ETA 정보 등록
  registerTick("AUTO", AUTO_MS / 1000);
  registerTick("DOG", DOG_MS / 1000);
  registerTick("REPORT", REPORT_MS / 1000);
}
