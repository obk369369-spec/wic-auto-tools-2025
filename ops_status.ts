// =============================
// File: ops_status.ts
// 역할: 각 도구 상태 저장/업데이트 + 스냅샷 + 그룹 ETA 집계
// =============================

interface Status {
  name: string;
  progress: number;     // 0~100
  ok: boolean;          // 상태 플래그
  lastTick: number;     // 마지막 업데이트 시각(ms)
  intervalMs: number;   // 예상 주기(ms)
  notes?: string;
}

const registry: Record<string, Status> = {};

// 도구(작업) 등록 또는 주기 갱신
export function registerTick(name: string, intervalSec = 900) {
  const now = Date.now();
  const s = registry[name];
  registry[name] = s
    ? { ...s, intervalMs: intervalSec * 1000 }
    : {
        name,
        progress: 0,
        ok: true,
        lastTick: now,
        intervalMs: intervalSec * 1000,
      };
}

// 진행률/메모/상태 갱신
export function setProgress(
  name: string,
  progress: number,
  note?: string,
  ok?: boolean,
) {
  const now = Date.now();
  if (!registry[name]) {
    // 없으면 기본 등록
    registerTick(name);
  }
  const s = registry[name]!;
  s.progress = Math.max(0, Math.min(100, Number(progress) || 0));
  s.lastTick = now;
  if (typeof ok === "boolean") s.ok = ok;
  if (note) s.notes = note;
}

// 개별 항목 스냅샷 (ETA 포함)
export function snapshot() {
  const now = Date.now();
  return Object.values(registry).map((s) => {
    const dueIn = s.lastTick + s.intervalMs - now;
    const etaSec = Math.max(0, Math.floor(dueIn / 1000));
    return {
      name: s.name,
      status: s.ok ? "ok" : "warn",
      progress: s.progress,
      etaSec,
      lastTick: s.lastTick,
      intervalSec: Math.floor(s.intervalMs / 1000),
      notes: s.notes ?? "",
    };
  });
}

// 외부에서 “도구 상태 표”가 필요할 때 사용 (스냅샷 alias)
export function toolStatus() {
  return snapshot();
}

// 그룹(접두사)별 평균 진행률/ETA 집계
export async function groupETA() {
  const snap = snapshot();
  const groups: Record<string, { count: number; sumETA: number; sumProgress: number }> = {};

  for (const item of snap) {
    const g = (item.name.split(/[_:/.-]/)[0] || "MISC").toUpperCase();
    if (!groups[g]) groups[g] = { count: 0, sumETA: 0, sumProgress: 0 };
    groups[g].count += 1;
    groups[g].sumETA += item.etaSec ?? 0;
    groups[g].sumProgress += item.progress ?? 0;
  }

  return Object.keys(groups).map((g) => ({
    group: g,
    avgETA: Math.round(groups[g].sumETA / groups[g].count),           // 초 단위
    avgProgress: Math.round(groups[g].sumProgress / groups[g].count), // %
    count: groups[g].count,
  }));
}

export default { registerTick, setProgress, snapshot, toolStatus, groupETA };
