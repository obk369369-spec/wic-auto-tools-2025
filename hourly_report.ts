// =============================
// File: hourly_report.ts
// =============================
import { sendMail, simpleHtml } from "./mail.ts";

const REPORT_LOOP = (Deno.env.get("REPORT_LOOP") ?? "").toLowerCase() === "true";

if (REPORT_LOOP) {
  const INTERVAL_MS = 1000 * 60 * 60;

  async function sendReport() {
    try {
      const base = Deno.env.get("REPORT_BASE_URL") || "https://wic-auto-tools-2025.obk369369-spec.deno.net";
      const url = base.replace(/\\/$/, "") + "/health";
      const res = await fetch(url);
      const data = await res.json();
      const html = simpleHtml("Hourly Report", `<pre>${JSON.stringify(data, null, 2)}</pre>`);
      await sendMail({
        to: Deno.env.get("DEFAULT_TO") ?? "ops@example.com",
        subject: "WIC Hourly Report",
        html,
      });
      console.log("[REPORT] sent");
    } catch (err) {
      console.log("[REPORT] error", err);
    }
  }

  sendReport().catch(() => {});
  setInterval(sendReport, INTERVAL_MS);
}
