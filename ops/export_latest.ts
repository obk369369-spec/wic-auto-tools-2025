// /ops/export_latest.ts
// 매 정시 생성된 report-*.json 중 최신본을 /export/latest.json 으로 복사
// 실행: deno run -A /ops/export_latest.ts

import { join } from "https://deno.land/std@0.223.0/path/mod.ts";

const REPORT_DIR = "/ops/report/out";
const EXPORT_DIR = "/export";
const EXPORT_FILE = join(EXPORT_DIR, "latest.json");

async function main() {
  try {
    await Deno.mkdir(EXPORT_DIR, { recursive: true });
    const files = [];
    for await (const f of Deno.readDir(REPORT_DIR)) {
      if (f.isFile && f.name.startsWith("report-") && f.name.endsWith(".json")) files.push(f.name);
    }
    files.sort();
    const latest = files.at(-1);
    if (!latest) throw new Error("no report files found");
    await Deno.copyFile(join(REPORT_DIR, latest), EXPORT_FILE);
    console.log(`[EXPORT] copied ${latest} -> ${EXPORT_FILE}`);
  } catch (e) {
    console.error("[EXPORT] failed:", e);
  }
}

// 라우트 핸들러: /export/latest.json 요청 시 파일 반환
export async function handleExport(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  if (pathname === "/export/latest.json") {
    try {
      const data = await Deno.readTextFile(EXPORT_FILE);
      return new Response(data, { headers: { "Content-Type": "application/json" } });
    } catch {
      return new Response(JSON.stringify({ ok: false, message: "no export yet" }), {
        headers: { "Content-Type": "application/json" }, status: 404,
      });
    }
  }
  return new Response(JSON.stringify({ ok: true, info: "export route ready" }), {
    headers: { "Content-Type": "application/json" },
  });
}

if (import.meta.main) await main();
