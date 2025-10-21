// =============================
// File: auto_recover.ts  (ADD)
// =============================

import { setProgress } from "./ops.ts";

// 필요시: GitHub Actions dispatch / 외부 Webhook 사용 가능 (env로 On/Off)
export default async function autoRecover() {
  setProgress("RECOVER", 10, "start");
  console.log("[RECOVER] begin");

  // 1) 웜업: /health 한 번 쿼리
  try {
    const warm = Deno.env.get("HEALTH_URL") ||
      "https://wic-auto-tools-2025.obk369369-spec.deno.net/health";
    await fetch(warm).catch(() => {});
  } catch (_) {}

  // 2) 외부 리빌드 트리거(옵션)
  const hook = Deno.env.get("RECOVER_WEBHOOK_URL");
  if (hook) {
    try {
      await fetch(hook, { method: "POST" });
      setProgress("RECOVER", 70, "webhook");
    } catch (e) {
      console.log("[RECOVER] webhook failed:", e);
    }
  }

  setProgress("RECOVER", 100, "done");
  console.log("[RECOVER] done");
}
