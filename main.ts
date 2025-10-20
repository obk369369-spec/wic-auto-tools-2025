// ===============================
// MAIN ENTRY (single-entry point)
// ===============================
import { autoRecover } from "./auto_recover.ts";
import { watchDog } from "./client_watchdog.ts";
import { syncData } from "./data_sync.ts";
import { reportTick } from "./hourly_report.ts";

console.log("[MAIN] WIC Auto Tools 2025 running...");

// 단일 서버 (Deno Deploy용)
Deno.serve((_req) =>
  new Response(
    JSON.stringify({
      status: "ok",
      service: "wic-auto-tools-2025",
      time: new Date().toISOString(),
    }),
    { headers: { "Content-Type": "application/json" } },
  )
);

// 백그라운드 루프 시작
setInterval(autoRecover, 60_000);
setInterval(watchDog, 90_000);
setInterval(syncData, 300_000);
setInterval(reportTick, 3600_000);
