// =====================================
// File: hourly_report.ts  (REPLACE 섹션만)
// =====================================
const BASE = "https://wic-auto-tools-2025.obk369369-spec.deno.net";

async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { "cache-control": "no-store" } });
  if (!r.ok) throw new Error(`${url} ${r.status}`);
  return r.json();
}

export async function renderHourly() {
  const [health, evidence, progress, eta] = await Promise.all([
    getJson<any>(`${BASE}/health`),
    getJson<any>(`${BASE}/evidence`),
    getJson<any>(`${BASE}/ops/progress`),
    getJson<any>(`${BASE}/ops/eta`),
  ]);

  const progressLine = Object.entries(progress.progress as Record<string, any>)
    .map(([k, v]) => `${k}: ${v.percent}%${v.note ? ` (${v.note})` : ""}`)
    .join(" | ");

  const etaLine = (eta.eta as Array<any>)
    .map((g) => `${g.group}: avgProgress ${g.avgProgress}% / avgETA ${g.avgETA}s`)
    .join(" | ");

  const rows = [
    ["AUTO/REPORT/SYNC/DOG/RECOVER logs (1h)", "로그 탭에서 확인", "Deno Deploy → Logs (filter by tag)"],
    ["/health", `status=${health.status}`, "Endpoint: /health"],
    ["/evidence", `uptimeSec=${evidence.uptimeSec}`, "Endpoint: /evidence"],
    ["도구 진행 현황", progressLine, "Endpoint: /ops/progress"],
    ["그룹 ETA", etaLine, "Endpoint: /ops/eta"],
  ];

  // 필요한 형식으로 텍스트/마크다운 생성(표 렌더는 기존 로직에 연결)
  return rows;
}
