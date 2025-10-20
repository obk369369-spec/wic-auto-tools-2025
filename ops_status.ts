// =============================
// File: ops_status.ts
// 기능: 도구군 상태(Health) / ETA(예상 완료 시간) 관리 모듈
// 버전: v2025.10.21-stable
// =============================

// 환경 변수 설정 (없을 경우 기본값 900초)
const SLOW_ETA_SEC = Number(Deno.env.get("SLOW_ETA_SEC") ?? 900);

// 상태 저장용 인터페이스
interface StatusItem {
  name: string;
  status: "ok" | "warn" | "fail";
  progress: number;
  etaSec: number | null;
  lastTick: number;
  intervalMs: number;
  notes?: string;
}

// 상태 레지스트리
const registry: Record<string, StatusItem> = {};

// 기본 상태 등록 함수
export function register(name: string, intervalSec: number = SLOW_ETA_SEC) {
  if (registry[name]) return;
  registry[name] = {
    name,
    status: "ok",
    progress: 0,
    etaSec: null,
    lastTick: Date.now(),
    intervalMs: intervalSec * 1000,
  };
  console.log(`[REGISTER] ${name} 등록 완료 (${intervalSec}s)`);
}

// 상태 업데이트 함수
export function updateStatus(
  name: string,
  opts: Partial<Pick<StatusItem, "status" | "progress" | "notes">>,
) {
  const s = registry[name];
  if (!s) return;

  s.lastTick = Date.now();
  if (typeof opts.progress === "number") {
    s.progress = Math.max(0, Math.min(100, opts.progress));
  }
  if (typeof opts.status === "string") s.status = opts.status as any;
  if (opts.notes) s.notes = opts.notes;
}

// 스냅샷 함수 (현재 상태 확인)
export function snapshot() {
  const now = Date.now();
  return Object.values(registry).map((s) => {
    const dueIn = s.lastTick + s.intervalMs - now;
    const eta = dueIn > 0 ? Math.floor(dueIn / 1000) : 0;
    return {
      name: s.name,
      status: s.status,
      progress: s.progress,
      etaSec: eta,
      notes: s.notes || "",
    };
  });
}

// 기본 등록 항목 (자동 로드용)
["AUTO", "SYNC", "REPORT", "WATCHDOG", "RECOVER"].forEach((n) =>
  register(n, SLOW_ETA_SEC)
);

// 진단용 로그
console.log("[OPS_STATUS] 모듈 로드 완료. 레지스트리 초기화됨.");

// 외부에서 사용하기 위해 export default 추가
export default { register, updateStatus, snapshot };
