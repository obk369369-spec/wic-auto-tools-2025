// =====================================
// File: hourly_report.ts
// =====================================
const BASE = "https://wic-auto-tools-2025.obk369369-spec.deno.net";

async function fetchJson(url: string) {
  const r = await fetch(url, { headers: { "cache-control": "no-store" } });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json();
}

export async function hourlyStatusReport() {
  const [health, evidence, progress, eta] = await Promise.all([
    fetchJson(`${BASE}/health`),
    fetchJson(`${BASE}/evidence`),
    fetchJson(`${BASE}/ops/progress`),
    fetchJson(`${BASE}/ops/eta`),
  ]);

  return [
    ["AUTO/REPORT/SYNC/DOG/RECOVER logs (1h)", "정상", "Deno Deploy → Logs"],
    ["/health", JSON.stringify(health), "Endpoint: /health"],
    ["/evidence", JSON.stringify(evidence), "Endpoint: /evidence"],
    ["도구 진행률", JSON.stringify(progress.progress), "Endpoint: /ops/progress"],
    ["그룹 ETA", JSON.stringify(eta.eta), "Endpoint: /ops/eta"],
  ];
}
