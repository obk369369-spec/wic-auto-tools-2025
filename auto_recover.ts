// auto_recover.ts — 자가복구(헬스 실패 누적 시 훅 호출)
import { registerTick, setProgress } from "./ops_status.ts";

const RECOVER_LOOP = (Deno.env.get("RECOVER_LOOP") ?? "").toLowerCase() === "true";
const CHECK_MS = Number(Deno.env.get("RECOVER_MS") ?? 1000 * 60 * 10); // 10m
const BASE = Deno.env.get("REPORT_BASE_URL") ?? "https://wic-auto-tools-2025.obk369369-spec.deno.net";
const HOOK = Deno.env.get("REDEPLOY_HOOK_URL");   // 선택: GitHub Actions webhook 등
const THRESH = Number(Deno.env.get("RECOVER_THRESHOLD") ?? 3);

let fails = 0;

export async function recoverOnce() {
  try {
    setProgress("RECOVER", 10, "check");
    const res = await fetch((BASE.endsWith("/") ? BASE.slice(0,-1) : BASE) + "/health");
    if (!res.ok) throw new Error(String(res.status));
    fails = 0;
    registerTick("RECOVER", { progress: 100, ok: true, note: "ok" });
    console.log("[RECOVER] ok");
    setTimeout(() => setProgress("RECOVER", 98, "standby"), 300);
  } catch (e) {
    fails++;
    registerTick("RECOVER", { ok: false, note: `fail=${fails}` });
    console.log("[RECOVER] fail", fails, e);
    if (fails >= THRESH && HOOK) {
      await fetch(HOOK, { method: "POST" }).catch(()=>{});
      console.log("[RECOVER] redeploy hook fired");
      fails = 0;
    }
  }
}
if (RECOVER_LOOP) { recoverOnce().catch(()=>{}); setInterval(recoverOnce, CHECK_MS); }
else console.log("[RECOVER] disabled");
