// =============================
// File: ops_status.ts
// 기능: 도구별 상태/ETA 레지스트리 + 스냅샷/조회 API용 헬퍼
// =============================

export type Group = "AUTO" | "REPORT" | "SYNC" | "DOG" | "RECOVER";

export type ToolState = {
  name: Group;
  intervalMs: number;         // 실행 주기
  lastTick: number | null;    // 마지막 성공 epoch ms
  progress: number;           // 0~100
  status: "ok" | "pending" | "error";
  notes?: string;
};

// 기본 주기 (env로 오버라이드 가능)
const DEF = {
  AUTO: Number(Deno.env.get("AUTO_MS") ?? 1000 * 60 * 60),       // 1h
  REPORT: Number(Deno.env.get("REPORT_MS") ?? 1000 * 60 * 60),   // 1h
  SYNC: Number(Deno.env.get("SYNC_MS") ?? 1000 * 60 * 5),        // 5m
  DOG: Number(Deno.env.get("WATCHDOG_MS") ?? 1000 * 60),         // 1m
  RECOVER: Number(Deno.env.get("RECOVER_MS") ?? 1000 * 60 * 10), // 10m
} as const;

// 싱글톤 레지스트리
const registry: Record<Group, ToolState> = {
  AUTO:    { name: "AUTO",    intervalMs: DEF.AUTO,    lastTick: Date.now(), progress: 100, status: "ok", notes: "heartbeat" },
  REPORT:  { name: "REPORT",  intervalMs: DEF.REPORT,  lastTick: null,       progress: 0,   status: "pending" },
  SYNC:    { name: "SYNC",    intervalMs: DEF.SYNC,    lastTick: null,       progress: 0,   status: "pending" },
  DOG:     { name: "DOG",     intervalMs: DEF.DOG,     lastTick: null,       progress: 0,   status: "pending" },
  RECOVER: { name: "RECOVER", intervalMs: DEF.RECOVER, lastTick: null,       progress: 98,  status: "ok", notes: "standby" },
};

// tick 기록
export function registerTick(name: Group, opts?: { progress?: number; ok?: boolean; note?: string }) {
  const now = Date.now();
  const s = registry[name];
  if (!s) return;
  s.lastTick = now;
  if (typeof opts?.progress === "number") s.progress = clamp(opts.progress, 0, 100);
  if (typeof opts?.ok === "boolean") s.status = opts.ok ? "ok" : "error";
  if (opts?.note) s.notes = opts.note;
}

// 진행률 갱신
export function setProgress(name: Group, progress: number, note?: string) {
  const s = registry[name];
  if (!s) return;
  s.progress = clamp(progress, 0, 100);
  if (note) s.notes = note;
}

// 단일 도구 상태 조회 (ETA 포함)
export function toolStatus(name: Group) {
  const s = registry[name];
  if (!s) return null;
  const now = Date.now();
  const etaSec = s.lastTick ? Math.max(0, Math.floor((s.lastTick + s.intervalMs - now) / 1000)) : null;
  return {
    name: s.name,
    status: s.status,
    progress: s.progress,
    lastTickIso: s.lastTick ? new Date(s.lastTick).toISOString() : null,
    intervalMs: s.intervalMs,
    etaSec,
    note: s.notes ?? null,
  };
}

// 전체 스냅샷
export function snapshot() {
  const items = (Object.keys(registry) as Group[]).map((g) => toolStatus(g)!);
  return { ts: new Date().toISOString(), items };
}

// 그룹(=도구군) ETA 집계
export function groupETA() {
  const items = snapshot().items;
  const m = new Map<string, { n: number; sumP: number; sumEta: number }>();
  for (const it of items) {
    const key = it.name; // 현재는 도구명=그룹명 동일
    const agg = m.get(key) ?? { n: 0, sumP: 0, sumEta: 0 };
    agg.n += 1;
    agg.sumP += it.progress ?? 0;
    agg.sumEta += it.etaSec ?? 0;
    m.set(key, agg);
  }
  const groups = Array.from(m.entries()).map(([group, v]) => ({
    group,
    avgProgress: Math.round(v.sumP / v.n),
    avgEtaSec: Math.round(v.sumEta / Math.max(1, v.n)),
  }));
  return { ts: new Date().toISOString(), groups };
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
