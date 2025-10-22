// /ops/export_latest.ts — report-*.json 중 최신을 /export/latest.json 으로 복사하고 kv_safe에도 캐시
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { kvSet } from "../lib/kv_safe.ts";


const REPORT_DIR = "/ops/report/out";
const EXPORT_DIR = "/export";
const EXPORT_FILE = join(EXPORT_DIR, "latest.json");


export async function handleExport(_req: Request): Promise<Response> {
try {
const data = await Deno.readTextFile(EXPORT_FILE);
return new Response(data, { headers: { "Content-Type": "application/json" } });
} catch {
return new Response(JSON.stringify({ ok:false, message:"no export yet" }), { status:404, headers:{"Content-Type":"application/json"}});
}
}
