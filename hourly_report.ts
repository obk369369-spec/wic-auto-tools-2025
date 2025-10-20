// =============================
// File: hourly_report.ts (Status-aware Version)
// =============================
import { registerTick, setProgress } from "./ops_status.ts";

const REPORT_LOOP = (Deno.env.get("REPORT_LOOP") ?? "").toLowerCase() === "true";
const EVERY_MS = Number(Deno.env.get("REPORT_MS") ?? 1000 * 60 * 60); // 1h

if (REPORT_LOOP) {
  console.log(`[REPORT] loop enabled — interval=${EVERY_MS / 1000}s`);

  async function reportTick() {
    try {
      setProgress("REPORT", 10, "fetching");
      const base = Deno.env.get("REPORT_BASE_URL") ?? "https://wic-auto-tools-2025.obk369369-spec.deno.net";
      const clean = base.endsWith("/") ? base.slice(0, -1) : base;

      const health = await fetch(`${clean}/health`).then((r) => r.json());
      setProgress("REPORT", 60, "health ok");

      const links = await fetch(`${clean}/ops?action=links`).then((r) => r.json()).catch(() => ({ links: {} }));
      const status = await fetch(`${clean}/ops?action=status`).then((r) => r.json()).catch(() => null);

      setProgress("REPORT", 90, "assemble");

      console.log(
        "[REPORT]",
        JSON.stringify(
          {
            ts: new Date().toISOString(),
            health: {
              status: health.status,
              region: health.region ?? "-",
              uptime: health.startedAt ? `${Math.floor((Date.now() - Date.parse(health.startedAt)) / 1000)}s` : "-",
            },
            links: links?.links ?? {},
            snapshot: status?.snapshot ?? null,
          },
          null,
          0,
        ),
      );

      registerTick("REPORT", { progress: 100, ok: true, note: "hourly report ok" });
      setTimeout(() => setProgress("REPORT", 0, "idle"), 2000); // 다음 주기 대기 표기
    } catch (e) {
      registerTick("REPORT", { ok: false, note: `error: ${String(e)}` });
      console.log("[REPORT] error:", e);
    }
  }

  // 즉시 실행 + 주기
  reportTick();
  setInterval(reportTick, EVERY_MS);
} else {
  console.log("[REPORT] REPORT_LOOP=false → skip hourly report loop");
}
