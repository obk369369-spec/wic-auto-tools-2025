// =====================================
// File: ops.ts  (ADD/REPLACE)
// 역할: 진행률 저장 + /ops/* 엔드포인트
// =====================================

type Prog = { percent: number; note: string; ts: number };
const progress = new Map<string, Prog>();
let nextRun: Record<string, string> = {}; // NAME -> ISO time

export function setProgress(group: string, percent: number, note = "") {
  progress.set(group.toUpperCase(), { percent, note, ts: Date.now() });
}

export function registerTick(name: string, afterSec: number) {
  const t = new Date(Date.now() + afterSec * 1000).toISOString();
  nextRun[name.toUpperCase()] = t;
}

// 내부: 스냅샷
function snapshotProgress() {
  const obj: Record<string, Prog> = {};
  for (const [k, v] of progress.entries()) obj[k] = v;
  return obj;
}

// 내부: 그룹 ETA(단순 평균)
function groupETA() {
  const now = Date.now();
  const items = Object.keys(nextRun).map((k) => {
    const due = Date.parse(nextRun[k]);
    const etaSec = Math.max(0, Math.floor((due - now) / 1000));
    const p = progress.get(k) ?? { percent: 0, note: "", ts: now };
    return { group: k, etaSec, progress: p.percent };
  });

  // 그룹 키 그대로 리턴(요약용)
  return items;
}

// =====================================
// HTTP 핸들러 (main.ts 에서 import)
// =====================================
export async function handleOps(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);

  if (pathname === "/ops/progress") {
    return Response.json({ ok: true, progress: snapshotProgress() });
  }
  if (pathname === "/ops/eta") {
    return Response.json({ ok: true, nextRun, eta: groupETA(), now: new Date().toISOString() });
  }

  return new Response("Not Found", { status: 404 });
}
