import { serve } from "https://deno.land/std@0.223.0/http/server.ts";

// 기본 환경설정
const AUTO_LOOP = (Deno.env.get("AUTO_LOOP") ?? "").toLowerCase() === "true";
const SELF_HEAL = (Deno.env.get("SELF_HEAL") ?? "").toLowerCase() === "true";
const REGION = Deno.env.get("DENO_REGION") ?? "ap-northeast-1";

async function autoLoopHandler() {
  console.log(`[AUTO_LOOP] Running at ${new Date().toISOString()}`);
}

if (AUTO_LOOP) {
  setInterval(autoLoopHandler, 1000 * 60 * 60); // 매시간 실행
}

serve(async (req) => {
  const url = new URL(req.url);

  // 🔹 /health
  if (url.pathname === "/health") {
    return new Response(
      JSON.stringify({
        status: "ok",
        service: "wic-auto-tools-2025",
        region: REGION,
        time: new Date().toISOString(),
        autoLoopEnabled: AUTO_LOOP,
        selfHealEnabled: SELF_HEAL,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // 🔹 /evidence
  if (url.pathname === "/evidence") {
    const startedAt = Deno.env.get("STARTED_AT") ?? new Date().toISOString();
    const now = new Date().toISOString();
    const uptimeSec =
      (Date.parse(now) - Date.parse(startedAt)) / 1000;
    return new Response(
      JSON.stringify({
        startedAt,
        now,
        uptimeSec,
        commit: Deno.env.get("GIT_COMMIT") ?? null,
        branch: Deno.env.get("GIT_BRANCH") ?? null,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // 🔹 기본 라우트
  return new Response("AUTO_LOOP active", { status: 200 });
});
