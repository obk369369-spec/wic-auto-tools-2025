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


if (import.meta.main) {
await Deno.mkdir(EXPORT_DIR, { recursive: true }).catch(()=>{});
const files: string[] = [];
for await (const f of Deno.readDir(REPORT_DIR)) {
if (f.isFile && f.name.startsWith("report-") && f.name.endsWith(".json")) files.push(f.name);
}
files.sort();
const latest = files.at(-1);
if (!latest) {
console.log("[EXPORT] no report files yet");
Deno.exit(0);
}
const src = join(REPORT_DIR, latest);
const json = await Deno.readTextFile(src);
await Deno.writeTextFile(EXPORT_FILE, json);
await kvSet("latest_report_json", json); // 인메모리 대체용
console.log(`[EXPORT] ${latest} -> /export/latest.json`);
}
