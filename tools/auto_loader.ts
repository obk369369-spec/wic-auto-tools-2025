// /tools/auto_loader.ts — tools_index.json 생성 + latest.json 메타 병합 (지터 추가)
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
const MANIFEST = "/tools/tools_manifest.json"; const EXPORT_DIR = "/export";
const TOOLS_INDEX = join(EXPORT_DIR, "tools_index.json"); const LATEST = join(EXPORT_DIR, "latest.json");
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms)); const jitter=()=>2000+Math.floor(Math.random()*3000);


export async function buildToolsIndex(){
await wait(jitter());
await Deno.mkdir(EXPORT_DIR,{recursive:true}).catch(()=>{});
const raw = await Deno.readTextFile(MANIFEST); const mf = JSON.parse(raw);
const list = (mf.tools||[]).filter((t:any)=>t.enabled);
await Deno.writeTextFile(TOOLS_INDEX, JSON.stringify({ version: mf.version, tools: list }, null, 2));
try {
const latest = JSON.parse(await Deno.readTextFile(LATEST));
latest.tools_meta = list.map((t:any)=>({ id:t.id, name_kr:t.name_kr, run_url:t.run_url, download_url:t.download_url, health_url:t.health_url }));
await Deno.writeTextFile(LATEST, JSON.stringify(latest, null, 2));
} catch {}
console.log(`[AUTO-LOADER] tools_index.json updated.`);
}


if (import.meta.main) buildToolsIndex();
