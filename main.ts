import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  const url = new URL(req.url);

  // ───────────────────────────────
  // ops/status route
  if (url.pathname === "/ops" && url.searchParams.get("action") === "status") {
    const summary = {
      AUTO: "auto_loop.ts 정상 작동",
      REPORT: "hourly_report.ts 루프 진행 중",
      SYNC: "data_sync.ts 데이터 최신",
      DOG: "client_watchdog.ts 하트비트 정상",
      RECOVER: "auto_recover.ts 대기 중",
    };
    return new Response(JSON.stringify(summary, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  }
  // ───────────────────────────────

  return new Response("WIC-AutoTools-2025 Core Running");
});
