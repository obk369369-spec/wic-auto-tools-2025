// =============================
// File: hourly_report.ts (fixed version)
// =============================

import { sendMail, simpleHtml } from "./mail.ts";

const REPORT_LOOP = (Deno.env.get("REPORT_LOOP") ?? "").toLowerCase() === "true";

if (REPORT_LOOP) {
  const EVERY_MS = Number(Deno.env.get("REPORT_MS")) || 1000 * 60 * 60; // 1 hour

  async function reportTick() {
    try {
      const base =
        Deno.env.get("REPORT_BASE_URL") ||
        "https://wic-auto-tools-2025.obk369369-spec.deno.net";
      const url = base.replace(/\/$/, "") + "/health"; // ✅ 고친 부분
      const res = await fetch(url);
      const j = await res.json();

      const subject = `WIC Hourly Report • ${new Date().toISOString()}`;
      const html = simpleHtml(
        "Hourly Report",
        `<h2>Status: ${j.status}</h2><pre>${escapeHtml(
          JSON.stringify(j, null, 2),
        )}</pre>`,
      );

      await sendMail({
        to: Deno.env.get("DEFAULT_TO") ?? "ops@example.com",
        subject,
        html,
      });

      console.log("[REPORT] mailed successfully");
    } catch (e) {
      console.log("[REPORT] error", e);
    }
  }

  // 즉시 실행 + 주기적 실행
  reportTick().catch(() => {});
  setInterval(reportTick, EVERY_MS);
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
