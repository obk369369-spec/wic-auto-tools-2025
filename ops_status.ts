// =============================
// File: ops_status.ts
// 기능: setProgress / registerTick 내보내기 복원
// =============================

// 상태 저장소
interface Status {
  name: string;
  progress: number;
  ok: boolean;
  lastTick: number;
  intervalMs: number;
  notes?: string;
}

const registry: Record<string, Status> = {};

// 주기 등록
export function registerTick(name: string, intervalSec: number = 900) {
  registry[name] = {
    name,
    progress: 0,
    ok: true,
    lastTick: Date.now(),
    intervalMs: intervalSec * 1000,
  };
}

// 진행률 업데이트
export function setProgress(name: string, progress: number, note?: string) {
  const s = registry[name];
  if (!s) return;
  s.progress = Math.max(0, Math.min(100, progress));
  s.lastTick = Date.now();
  if (note) s.notes = note;
}

// 스냅샷용
export function snapshot() {
  return Object.values(registry).map((s) => ({
    name: s.name,
    progress: s.progress,
    ok: s.ok,
    lastTick: s.lastTick,
    notes: s.notes ?? "",
  }));
}

export default { registerTick, setProgress, snapshot };
