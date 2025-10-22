// /ops/watchdog.ts — latest.json 타임스탬프 감시, 15분 이상 지연 시 export 재기동
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
const EXPORT_DIR = "/export"; const LATEST = join(EXPORT_DIR, "latest.json");


function mins(ms:number){ return Math.floor(ms/60000); }


export async function watchdog(){
try{
const info = await Deno.stat(LATEST);
const age = Date.now() - info.mtime!.getTime();
if (mins(age) >= 15){
console.warn(`[WATCHDOG] latest.json stalled ${mins(age)}m → restart export`);
const p = new Deno.Command("deno", { args:["run","-A","/ops/export_latest.ts"]}).spawn();
await p.status;
} else {
console.log(`[WATCHDOG] latest.json age ${mins(age)}m OK`);
}
} catch {
console.warn(`[WATCHDOG] latest.json missing → export`);
const p = new Deno.Command("deno", { args:["run","-A","/ops/export_latest.ts"]}).spawn();
await p.status;
}
}


if (import.meta.main) watchdog();
