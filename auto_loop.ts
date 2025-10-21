// ====================================
// File: auto_loop.ts  (REPLACE)
// 역할: AUTO 루프를 함수로 제공, main.ts 에서 호출
// ====================================

import { setProgress, registerTick } from "./ops.ts";

const AUTO_LOOP = (Deno.env.get("AUTO_LOOP") ?? "").toLowerCase() === "true";
const HEALTH_URL =
  Deno.env.get("HEALTH_URL") ??
  "https://wic-auto-tools-2025.obk369369-spec.deno.net/health";

// 공통 유틸
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

// 메인 루프 함수 (외부에서 호출)
export async function initAutoLoop() {
  if (!AUTO_LOOP) {
    console.log("[AUTO] AUTO_LOOP=false → loop disabled (noop)");
    // 최소 한 번은 상태를 남겨 그룹 진행표에 빈칸이 안 생기게
    setProgress("AUTO", 0, "disabled");
    setProgress("DOG", 0, "disabled");
    setProgress("REPORT", 0, "disabled");
    return; // ❗️더 이상 export{} 같은 빈 내보내기 금지
  }

  console.log("[AUTO] background loop starting…");
  registerTick("AUTO", 60);

  while (true) {
    const t0 = Date.now();
    try {
      // 1) 헬스 체크
      const ok = await (async () => {
        try {
          const res = await timedFetch(HEALTH_URL, 1500);
          return res.ok;
        } catch {
          return false;
        }
      })();
      setProgress("DOG", ok ? 100 : 0, ok ? "ok" : "down");
      registerTick("DOG", 60);

      // 2) 리포트 신호 남기기 (간단 버전)
      setProgress("REPORT", 100, "tick");
      registerTick("REPORT", 60);

      // 3) AUTO 자체 진행률
      const took = Date.now() - t0;
      setProgress("AUTO", 100, `ok (${took}ms)`);
      registerTick("AUTO", 60);
    } catch (e) {
      setProgress("AUTO", 0, `error: ${(e && e.message) || e}`);
      registerTick("AUTO", 60);
    }

    await sleep(60_000); // 1분 주기
  }
}
