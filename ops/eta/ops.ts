// =============================
// File: ops.ts  (ADD)
// =============================

type Prog = { percent: number; note: string; ts: number };
const progress = new Map<string, Prog>();
let nextRun: Record<string, string> = {}; // name → ISO string

export function setProgress(group: string, percent: number, note = "") {
  progress.set(group.toUpperCase(), { percent, note, ts: Date.now() });
}

export function registerTick(name: string, afterSec: number) {
  const t = new Date(Date.now() + afterSec * 1000).toISOString();
  nextRun[name.toUpperCase()] = t;
}

// HTTP 핸들러
export async function handleOps(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  if (pathname === "/ops/progress") {
    const obj: Record<string, Prog> = {};
    for (const [k, v] of progress.entries()) obj[k] = v;
    return json({ ok: true, progress: obj });
  }
  if (pathname === "/ops/eta") {
    return json({ ok: true, nextRun, now: new Date().toISOString() });
  }
  return new Response("Not Found", { status: 404 });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
