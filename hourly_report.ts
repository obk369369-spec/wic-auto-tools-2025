// =============================
// File: hourly_report.ts  ✅ FULL (전체 교체)
// 기능: 1시간마다 상태 수집 + 도구별 진행/ETA + 공개 소스 링크 + (옵션) 이메일 전송
// Env(권장): REPORT_LOOP=true, REPORT_MS=3600000, REPORT_BASE_URL, SLOW_ETA_SEC(기본 900)
// (메일 옵션) SENDGRID_API_KEY, FROM_EMAIL, REPORT_EMAIL_TO
// =============================
import { registerTick, setProgress } from "./ops_status.ts";
import { sendEmail } from "./lib/mailer.ts"; // 없으면 파일만 추가해두고 env 미설정 시 내부에서 skip

const REPORT_LOOP = (Deno.env.get("REPORT_LOOP") ?? "").toLowerCase() === "true";
const EVERY_MS = Number(Deno.env.get("REPORT_MS") ?? 1000 * 60 * 60); // 기본 1시간
const SLOW_ETA_SEC = Number(Deno.env.get("SLOW_ETA_SEC") ?? 900);    // 느림 임계 15분

async function reportOnce() {
  try {
    setProgress("REPORT", 10, "collecting");
    const base = (Deno.env.get("REPORT_BASE_URL") ?? "https://wic-auto-tools-2025.obk369369-spec.deno.net").replace(/\/$/, "");

    // 병렬 수집
    const [health, evidence, status, eta, links] = await Promise.all([
      fetch(`${base}/health`).then(r => r.json()).catch(() => ({ status: "error" })),
      fetch(`${base}/evidence`).then(r => r.json()).catch(() => ({})),
      fetch(`${base}/ops?action=status`).then(r => r.json()).catch(() => null),
      fetch(`${base}/ops?action=eta`).then(r => r.json()).catch(() => null),
      fetch(`${base}/ops?action=links`).then(r => r.json()).catch(() => ({ links: {} })),
    ]);

    setProgress("REPORT", 70, "assembling");

    // 도구별 진행 요약 (핵심 5종)
    const tools: Array<"AUTO" | "REPORT" | "SYNC" | "DOG" | "RECOVER"> = ["AUTO", "REPORT", "SYNC", "DOG", "RECOVER"];
    const perTool = (status?.snapshot?.items ?? [])
      .filter((x: any) => tools.includes(x.name))
      .map((t: any) => ({
        name: t.name,
        status: t.status,
        progress: t.progress,
        etaSec: t.etaSec ?? null,
        note: t.note ?? null,
        lastTickIso: t.lastTickIso ?? null,
      }));

    // 느림/에러 집계
    const slow = perTool.filter((t: any) => (t.etaSec ?? 0) > SLOW_ETA_SEC);
    const errors = perTool.filter((t: any) => t.status === "error");

    // 필요 시 자가치유 신호 기록(RECOVER 루프가 후속 처리)
    if (errors.length > 0 || slow.length > 0) {
      registerTick("RECOVER", {
        ok: errors.length === 0,
        note: `auto-heal hint: slow=${slow.map(s => s.name).join(",")} err=${errors.map(e => e.name).join(",")}`,
      });
    }

    // 공개 소스 위치(전부 Endpoint로 고정)
    const source = {
      health: "Endpoint: /health",
      evidence: "Endpoint: /evidence",
      status: "Endpoint: /ops?action=status",
      eta: "Endpoint: /ops?action=eta",
    };

    // 머신-리더블 로그 한 줄
    const payload = {
      ts: new Date().toISOString(),
      health: { status: health.status, region: health.region ?? null, startedAt: health.startedAt ?? null },
      evidence: { uptimeSec: evidence.uptimeSec ?? null, commit: evidence.commit ?? null, branch: evidence.branch ?? null },
      perTool,
      counts: { slow: slow.length, error: errors.length },
      groupETA: eta?.groupETA ?? null,
      links: links?.links ?? {},
      source,
    };
    console.log("[REPORT]", JSON.stringify(payload));

    // (옵션) 이메일 전송 — env 미설정이면 lib/mailer.ts가 내부에서 skip
    const to = Deno.env.get("REPORT_EMAIL_TO");
    if (to) {
      const subject = "[WIC OPS] Hourly Automation Report";
      const text = JSON.stringify(payload, null, 2);
      await sendEmail({ to, subject, text });
    }

    registerTick("REPORT", { progress: 100, ok: true, note: "hourly report ok" });
    setTimeout(() => setProgress("REPORT", 0, "idle"), 500);
  } catch (e) {
    registerTick("REPORT", { ok: false, note: `error: ${String(e)}` });
    console.log("[REPORT] error:", e);
  }
}

// 루프 구동
if (REPORT_LOOP) {
  console.log(`[REPORT] loop enabled — interval=${EVERY_MS / 1000}s`);
  reportOnce();
  setInterval(reportOnce, EVERY_MS);
} else {
  console.log("[REPORT] REPORT_LOOP=false → skip hourly report loop");
}

// 외부 on-demand 호출용
export const reportTick = reportOnce;
