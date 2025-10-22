// /ops/smoke_tests.ts — 3회 재시도/타임아웃 추가
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
const MANIFEST="/tools/tools_manifest.json"; const EXPORT_DIR="/export"; const SMOKE=join(EXPORT_DIR,"smoke.json");


async function ping(u:string, timeout=6000){
const ctrl = new AbortController(); const id=setTimeout(()=>ctrl.abort(), timeout);
try{ const r = await fetch(u,{signal: ctrl.signal}); clearTimeout(id); return { ok:r.ok, status:r.status }; }
catch(e){ clearTimeout(id); return { ok:false, status:0, err:String(e) }; }
}


export async function runSmoke(){
const mf = JSON.parse(await Deno.readTextFile(MANIFEST)); const tools=(mf.tools||[]).filter((t:any)=>t.enabled);
const results:any[]=[];
for (const t of tools){
let h:any={ok:false}, run:any={ok:false}; let tries=0;
while(tries<3 && !h.ok){ h=await ping(t.health_url); tries++; }
tries=0; while(tries<3 && !run.ok){ run=await ping(t.run_url); tries++; }
results.push({ id:t.id, name_kr:t.name_kr, health:h, run, ts:new Date().toISOString() });
}
await Deno.mkdir(EXPORT_DIR,{recursive:true}).catch(()=>{});
await Deno.writeTextFile(SMOKE, JSON.stringify({ results }, null, 2));
console.log(`[SMOKE] ${tools.length} tools checked.`);
}


if (import.meta.main) runSmoke();
