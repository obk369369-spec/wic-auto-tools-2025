// =====================================
// File: ops.ts (FINAL ALL-IN-ONE)
// =====================================
type Prog = { percent: number; note?: string; ts: number };
type Log = { ts: number; group: string; lvl: "INFO"|"WARN"|"ERROR"; msg: string; meta?: Record<string, unknown> };

const progress = new Map<string, Prog>();
const nextRun: Record<string, string> = {};     // NAME -> ISO datetime
const logs: Log[] = [];                          // recent ring buffer
const metrics = new Map<string, { slow: number; error: number }>(); // group counters

export function setProgress(group: string, percent: number, note = ""): void {
  progress.set(group.toUpperCase(), { percent, note, ts: Date.now() });
}
export function registerTick(name: string, afterSec: number): void {
  nextRun[name.toUpperCase()] = new Date(Date.now() + afterSec * 1000).toISOString();
}
export function log(group: string, lvl: Log["lvl"], msg: string, meta: Record<string, unknown> = {}): void {
  const g = group.toUpperCase();
  logs.push({ ts: Date.now(), group: g, lvl, msg, meta });
  if (logs.length > 500) logs.shift();
  const m = metrics.get(g) ?? { slow: 0, error: 0 };
  if (lvl === "ERROR") m.error++;
  if (typeof meta.durationMs === "number" && meta.durationMs > 2000) m.slow++;
  metrics.set(g, m);
}

function snapProgress() {
  const obj: Record<string, Prog> = {};
  for (const [k, v] of progress.entries()) obj[k] = v;
  return obj;
}
function snapMetrics() {
  const out: Record<string, { slow: number; error: number }> = {};
  metrics.forEach((v, k) => (out[k] = v));
  return out;
}
function getLogs(group?: string) {
  const g = group?.toUpperCase();
  return logs.filter(l => !g || l.group === g).slice(-100);
}
function json(v: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(v), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
    ...init,
  });
}

// HTTP handler (main.ts → if (pathname.startsWith("/ops/")) return handleOps(req);)
export async function handleOps(req: Request): Promise<Response> {
  const { pathname, searchParams } = new URL(req.url);

  if (pathname === "/ops/progress") return json({ ok: true, progress: snapProgress() });
  if (pathname === "/ops/eta")      return json({ ok: true, nextRun, now: new Date().toISOString() });
  if (pathname === "/ops/logs")     return json({ ok: true, logs: getLogs(searchParams.get("group") ?? undefined) });
  if (pathname === "/ops/stats")    return json({ ok: true, stats: snapMetrics(), now: new Date().toISOString() });

  return new Response("Not Found", { status: 404 });
}
