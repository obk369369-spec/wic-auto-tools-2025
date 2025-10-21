import { serve } from "https://deno.land/std@0.223.0/http/server.ts";

const SELF_HEAL = (Deno.env.get("SELF_HEAL") ?? "").toLowerCase() === "true";
const REGION = Deno.env.get("DENO_REGION") ?? "ap-northeast-1";

let progress = {
  AUTO: 85,
  REPORT: 90,
  SYNC: 88,
  DOG: 80,
  RECOVER: 86,
};

let eta = {
  nextRun: {
    AUTO: "2025-10-21T09:00:00Z",
    REPORT: "2025-10-21T09:05:00Z",
    SYNC: "2025-10-21T09:10:00Z",
  },
  now: new Date().toISOString(),
};

serve(async (req) => {
  const url = new URL(req.url);

  // 🔹 /ops/progress
  if (url.pathname === "/ops/progress") {
    return new Response(
      JSON.stringify({
        ok: true,
        progress,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // 🔹 /ops/eta
  if (url.pathname === "/ops/eta") {
    return new Response(
      JSON.stringify({
        ok: true,
        ...eta,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // 🔹 /ops/selfheal 상태
  if (url.pathname === "/ops/selfheal") {
    return new Response(
      JSON.stringify({
        ok: SELF_HEAL,
        status: SELF_HEAL ? "active" : "disabled",
        region: REGION,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response("OPS handler active", { status: 200 });
});
