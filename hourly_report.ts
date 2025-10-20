// =============================
// File: hourly_report.ts (도구별 진행/ETA + 공개 Source 링크 포함)
// =============================
import { registerTick, setProgress } from "./ops_status.ts";

const REPORT_LOOP = (Deno.env.get("REPORT_LOOP") ?? "").toLowerCase() === "true";
const EVERY_MS = Number(Deno.env.get("REPORT_MS") ?? 1000 * 60 * 60); // 1h

async function reportOnce() {
  try {
    setProgress("REPORT", 10, "collecting");
    const base = (Deno.env.get("REPORT_BASE_URL") ?? "https://wic-auto-tools-2025.obk369369-spec.deno.net").replace(/\/$/,"");

    const [health, evidence, status, eta, links] = await Promise.all([
      fetch(`${base}/health`).then(r=>r.json()).catch(()=>({status:"error"})),
      fetch(`${base}/evidence`).then(r=>r.json()).catch(()=>({})),
      fetch(`${base}/ops?action=status`).then(r=>r.json()).catch(()=>null),
      fetch(`${base}/ops?action=eta`).then(r=>r.json()).catch(()=>null),
      fetch(`${base}/ops?action=links`).then(r=>r.json()).catch(()=>({links:{}})),
    ]);

    setProgress("REPORT", 70, "assembling");

    // 도구별 진행 요약
    const tools: Array<"AUTO"|"REPORT"|"SYNC"|"DOG"|"RECOVER"> = ["AUTO","REPORT","SYNC","DOG","RECOVER"];
    const perTool = (status?.snapshot?.items ?? []).filter((x: any)=>tools.includes(x.name));

    // 콘솔 출력(머신-리더블)
    console.log("[REPORT]", JSON.stringify({
      ts: new Date().toISOString(),
      health: { status: health.status, region: health.region ?? null, startedAt: health.startedAt ?? null },
      evidence: { uptimeSec: evidence.uptimeSec ?? null, commit: evidence.commit ?? null, branch: evidence.branch ?? null },
      perTool,
      groupETA: eta?.groupETA ?? null,
      links: links?.links ?? {},
      source: {
        health: "Endpoint: /health",
        evidence: "Endpoint: /evidence",
        status: "Endpoint: /ops?action=status",
        eta: "Endpoint: /ops?action=eta"
      }
    }));

    registerTick("REPORT", { progress: 100, ok: true, note: "hourly report ok" });
    setTimeout(()=> setProgress("REPORT", 0, "idle"), 500);
  } catch (e) {
    registerTick("REPORT", { ok: false, note: `error: ${String(e)}` });
    console.log("[REPORT] error:", e);
  }
}

if (REPORT_LOOP) {
  console.log(`[REPORT] loop enabled — interval=${EVERY_MS/1000}s`);
  reportOnce();
  setInterval(reportOnce, EVERY_MS);
} else {
  console.log("[REPORT] REPORT_LOOP=false → skip hourly report loop");
}

// 외부에서 on-demand 호출용 (선택)
export const reportTick = reportOnce;
