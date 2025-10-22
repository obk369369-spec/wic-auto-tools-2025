// /ops/export_latest.ts — 최신 보고 복사 with jitter/retry/atomic rename + CORS
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { kvSet } from "../lib/kv_safe.ts";


const REPORT_DIR = "/ops/report/out";
const EXPORT_DIR = "/export";
const EXPORT_FILE = join(EXPORT_DIR, "latest.json");
const TMP_FILE = join(EXPORT_DIR, "latest.tmp");


const corsHeaders = {
"Content-Type": "application/json",
"Access-Control-Allow-Origin": "*",
"Access-Control-Allow-Methods": "GET, OPTIONS",
"Access-Control-Allow-Headers": "Content-Type, Authorization",
};


function wait(ms:number){ return new Promise(r=>setTimeout(r,ms)); }
function jitter(base=3000){ return Math.floor(base + Math.random()*4000); } // 3~7초 지터


export async function copyLatest(){
await Deno.mkdir(EXPORT_DIR, { recursive: true }).catch(()=>{});
const files: string[] = [];
for await (const f of Deno.readDir(REPORT_DIR)){
if (f.isFile && f.name.startsWith("report-") && f.name.endsWith(".json")) files.push(f.name);
}
files.sort();
const latest = files.at(-1);
if (!latest) throw new Error("no report files found");
const src = join(REPORT_DIR, latest);
const json = await Deno.readTextFile(src);
await Deno.writeTextFile(TMP_FILE, json); // 임시 파일로 기록
await Deno.rename(TMP_FILE, EXPORT_FILE); // 원자적 교체
await kvSet("latest_report_json", json);
console.log(`[EXPORT] ${latest} -> /export/latest.json (atomic)`);
}


export async function handler(req: Request){
const { pathname } = new URL(req.url);
if (req.method === "OPTIONS") return new Response(null,{status:204, headers:corsHeaders});
if (pathname === "/export/latest.json"){
try {
const data = await Deno.readTextFile(EXPORT_FILE);
return new Response(data, { headers: corsHeaders });
} catch {
return new Response(JSON.stringify({ ok:false, message:"no export yet" }), { status:404, headers: corsHeaders });
}
}
return new Response(JSON.stringify({ ok:true, route: pathname }), { headers: corsHeaders });
}


if (import.meta.main){
// 지터 + 3회 지수 재시도
let attempt=0; let delay=jitter();
while (true){
try { await wait(delay); await copyLatest(); break; }
catch(e){ attempt++; if (attempt>3){ console.error("[EXPORT] failed", e); Deno.exit(1);} console.warn(`[EXPORT] retry #${attempt}`); delay = delay*2; }
}
}
