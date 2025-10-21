// =====================================
// File: auto_loop.ts  (REPLACE)
// =====================================
import { setProgress, registerTick } from "./ops_status.ts";

const AUTO_LOOP = (Deno.env.get("AUTO_LOOP") ?? "true").toLowerCase() === "true";
if (!AUTO_LOOP) {
  console.log("[AUTO] AUTO_LOOP=false — background loop is disabled");
  setProgress("AUTO", 0, "disabled");
  setProgress("DOG", 0, "disabled");
  setProgress("REPORT", 0, "disabled");
  export {};
}

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

async function loop() {
  // 다음 실행 예상 시각 등록(그룹별 예시 간격)
  registerTick("AUTO", 300);
  registerTick("SYNC", 300);
  registerTick("REPORT", 3600);
  registerTick("DOG", 60);
  registerTick("RECOVER", 600);

  while (true) {
    try {
      // AUTO
      setProgress("AUTO", 10, "start");
      await sleep(300);
      setProgress("AUTO", 100, "done");

      // SYNC
      setProgress("SYNC", 5, "syncing…");
      await sleep(400);
      setProgress("SYNC", 100, "done");

      // REPORT
      setProgress("REPORT", 50, "generating…");
      await sleep(200);
      setProgress("REPORT", 100, "sent");

      // DOG (헬스체크)
      setProgress("DOG", 50, "checking /health");
      const r = await timedFetch(Deno.env.get("HEALTH_URL") ?? "https://wic-auto-tools-2025.obk369369-spec.deno.net/health", 5000);
      setProgress("DOG", r.ok ? 100 : 0, r.ok ? "ok" : `err ${r.status}`);

      // RECOVER (자가치유 훅 자리)
      setProgress("RECOVER", 100, "idle");

    } catch (e) {
      setProgress("RECOVER", 0, `error: ${(e as Error).message}`);
    }

    await sleep(5000); // 루프 간격(예시)
  }
}

loop();
