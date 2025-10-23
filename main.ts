// deno run -A main.ts (Deno Deploy 호환)
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const JSON_PATH = "./export/latest.json";
const LOG_PATH  = "./ops/logs/report.log";

async function readFileSafe(path: string) {
  try { return await Deno.readTextFile(path); } catch { return null; }
}
function json(data: unknown, status=200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type":"application/json; charset=utf-8", "cache-control":"no-store" }});
}
function text(s: string, status=200) {
  return new Response(s, { status, headers: { "content-type":"text/plain; charset=utf-8", "cache-control":"no-store" }});
}

serve(async (req) => {
  const url = new URL(req.url);
  const p = url.pathname;

  // 1) 최신 실측 지표
  if (p === "/export/latest.json") {
    const body = await readFileSafe(JSON_PATH);
    if (!body) return json({ error: "ENOENT", hint: "latest.json not found. Run /ops/bootstrap or ensure exporter writes here." }, 404);
    return new Response(body, { status: 200, headers: { "content-type":"application/json; charset=utf-8", "cache-control":"no-store" }});
  }

  // 2) 헬스체크
  if (p === "/ops/health") {
    return json({ ok: true, ts: new Date().toISOString(), tz: "Asia/Seoul" });
  }

  // 3) 로그 조회(최근 4KB)
  if (p === "/ops/logs") {
    const body = await readFileSafe(LOG_PATH);
    const tail = body ? body.slice(-4096) : "(no logs)";
    return text(tail);
  }

  // 4) 최초 부트스트랩(초기 latest.json 생성)
  if (p === "/ops/bootstrap" && req.method === "POST") {
    await Deno.mkdir("./export", { recursive: true });
    await Deno.mkdir("./ops/logs", { recursive: true });
    const seed = {
      generated_at: new Date().toISOString(),
      tools: [],
      summary: { active:0, standby:0, blocked:0, avg_progress:0.0 }
    };
    await Deno.writeTextFile(JSON_PATH, JSON.stringify(seed, null, 2));
    return json({ ok:true, created: JSON_PATH });
  }

  return text("OK", 200);
});
