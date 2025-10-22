// /ops/export_latest.ts
// 최신 보고 복사 + 퍼블릭 노출 + CORS 허용

import { join } from "https://deno.land/std@0.223.0/path/mod.ts";
import { kvSet } from "../lib/kv_safe.ts";

const REPORT_DIR = "/ops/report/out";
const EXPORT_DIR = "/export";
const EXPORT_FILE = join(EXPORT_DIR, "latest.json");

// 공통 헤더 정의 (CORS 허용)
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// OPTIONS 요청 (CORS 프리플라이트) 응답
export async function handleOptions(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
}

// /export/latest.json 라우트 핸들러
export async function handleExport(req: Request): Promise<Response> {
  const { pathname } = new URL(req.url);
  if (pathname === "/export/latest.json") {
    try {
      const data = await Deno.readTextFile(EXPORT_FILE);
      return new Response(data, { headers: corsHeaders });
    } catch {
      return new Response(
        JSON.stringify({ ok: false, message: "no export yet" }),
        { status: 404, headers: corsHeaders },
      );
    }
  }
  return new Response(JSON.stringify({ ok: true, route: pathname }), {
    headers: corsHeaders,
  });
}

// 최신 보고 복사 및 kv_safe 캐시
if (import.meta.main) {
  try {
    await Deno.mkdir(EXPORT_DIR, { recursive: true });
    const files: string[] = [];
    for await (const f of Deno.readDir(REPORT_DIR)) {
      if (f.isFile && f.name.startsWith("report-") && f.name.endsWith(".json"))
        files.push(f.name);
    }
    files.sort();
    const latest = files.at(-1);
    if (!latest) {
      console.log("[EXPORT] No report files found");
      Deno.exit(0);
    }
    const src = join(REPORT_DIR, latest);
    const json = await Deno.readTextFile(src);
    await Deno.writeTextFile(EXPORT_FILE, json);
    await kvSet("latest_report_json", json);
    console.log(`[EXPORT] ${latest} -> /export/latest.json`);
  } catch (e) {
    console.error("[EXPORT] Failed:", e);
  }
}
