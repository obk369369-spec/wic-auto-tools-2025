// /ops/build_packs.ts
// tools_manifest.json을 읽어 각 도구의 정적 자산을 /packs/<id>.zip 으로 생성
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ZipFile } from "https://deno.land/x/zip@v1.2.5/mod.ts";


const ROOT = Deno.cwd();
const MANIFEST = "/tools/tools_manifest.json";
const PACKS = "/packs";


async function addDirToZip(z: ZipFile, absDir: string, prefix: string){
for await (const e of Deno.readDir(absDir)){
const abs = join(absDir, e.name);
const rel = join(prefix, e.name);
if (e.isFile){ const data = await Deno.readFile(abs); z.addFile(rel, data); }
else if (e.isDirectory){ await addDirToZip(z, abs, rel); }
}
}


export async function buildPacks(){
await Deno.mkdir(PACKS, { recursive: true }).catch(()=>{});
const mf = JSON.parse(await Deno.readTextFile(MANIFEST));
const tools = (mf.tools||[]).filter((t:any)=>t.enabled);
for (const t of tools){
const src = t.pack_src ?? t.run_url?.replace(/\/index\.html?$/,'');
if (!src || !src.startsWith('/')) continue;
const abs = join(ROOT, src);
const zipPath = join(ROOT, PACKS, `${t.id}.zip`);
const zip = new ZipFile();
try{ await addDirToZip(zip, abs, t.id); await Deno.writeFile(zipPath, await zip.compress()); console.log(`[PACK] ${t.id} -> ${zipPath}`);}catch(e){ console.error(`[PACK-ERR] ${t.id}`, e); }
}
}


if (import.meta.main) buildPacks();
