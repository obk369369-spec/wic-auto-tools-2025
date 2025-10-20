// =============================
// File: ops_status.ts
// 기능: 도구군 상태/ETA 단일 레지스트리 + 스냅샷 제공
// =============================

type Group = "AUTO" | "REPORT" | "SYNC" | "DOG" | "RECOVER";

export type ToolState = {
  name: Group;
  intervalMs: number;         // 예상 실행 주기
  lastTick: number | null;    // 마지막 성공 시각 (epoch ms)
  progress: number;           // 0~100 (진행률)
  status: "ok" | "pending" | "error";
  notes?: string;
};

// 기본 주기 (env로 오버라이드 가능)
const DEF = {
  AUTO: Number(Deno.env.get("AUTO_MS") ?? 1000 * 60 * 60),       // 1h
  REPORT: Number(Deno.env.get("REPORT_MS") ?? 1000 * 60 * 60),   // 1h
  SYNC: Number(Deno.env.get("SYNC_MS") ?? 1000 * 60 * 5),        // 5m
  DOG: Number(Deno.env.get("DOG_MS") ?? 1000 * 60),              // 1m
  RECOVER: Number(Deno.env.get("RECOVER_MS") ?? 1000 * 60 * 10), // 10m
} as const;

// 싱글톤 레지스트리
const registry: Record<Group, ToolState> = {
  AUTO:    { name: "AUTO",    intervalMs: DEF.AUTO,    lastTick: Date.now(), progress: 100, status: "ok", notes: "health heartbeat" },
  REPORT:  { name: "REPORT",  intervalMs: DEF.REPORT,  lastTick: null,       progress: 0,   status: "pending" },
  SYNC:    { name: "SYNC",    intervalMs: DEF.SYNC,    lastTick: null,       progress: 0,   status: "pending" },
  DOG:     { name: "DOG",     intervalMs: DEF.DOG,     lastTick: null,       progress: 0,   status: "pending" },
  RECOVER: { name: "RECOVER", intervalMs: DEF.RECOVER, lastTick: null,       progress: 98,  status: "ok", notes: "standby" },
};

// 외부에서 호출: tick 기록
export function registerTick(name: Group, opts?: { progress?: number; ok?: boolean; note?: string }) {
  const now = Date.now();
  const s = registry[name];
  if (!s) return;
  s.lastTick = now;
  if (typeof opts?.progress === "number") s.progress = Math.max(0, Math.min(100, opts.progress));
  if (typeof opts?.ok === "boolean") s.status = opts.ok ? "ok" : "error";
  if (opts?.note) s.notes = opts.note;
}

// 외부에서 호출: 진행률만 갱신(예: 동작 중 표시)
export function setProgress(name: Group, progress: number, note?: string) {
  const s = registry[name];
  if (!s) return;
  s.progress = Math.max(0, Math.min(100, progress));
  if (note) s.notes = note;
}

// 스냅샷 생성
export function snapshot() {
  const now = Date.now();
  const items = (Object.keys(registry) as Group[]).map((k) => {
    const s = registry[k];
    const dueIn = s.lastTick ? (s.lastTick + s.intervalMs - now) : null;
    const etaSec = dueIn !== null ? Math.max(0, Math.floor(dueIn / 1000)) : null;
    return {
      name: s.name,
      status: s.status,
      progress: s.progress,
      lastTickIso: s.lastTick ? new Date(s.lastTick).toISOString() : null,
      intervalMs: s.intervalMs,
      etaSec,
      note: s.notes ?? null,
    };
  });
  return {
    ts: new Date().toISOString(),
    items,
  };
}
