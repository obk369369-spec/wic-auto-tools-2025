// /ops/build_artifacts.ts — 도구 배포·다운로드 관련 파일을 한 번에 묶어 일괄 생성
// 포함: packs/*.zip, export/tools_index.json, export/smoke.json, export/checksums.txt, export/release_bundle.zip
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { ZipFile } from "https://deno.land/x/zip@v1.2.5/mod.ts";
import { crypto } from "https://deno.land/std@0.224.0/crypto/mod.ts";


const EXPORT = "/export";
const PACKS = "/packs";
const OUT_BUNDLE = join(EXPORT, "release_bundle.zip");
const CHECKSUMS = join(EXPORT, "checksums.txt");


async function sha256(file: string): Promise<string>{
try{ const data = await Deno.readFile(file); const hashBuf = await crypto.subtle.digest("SHA-256", data); const hashArr = Array.from(new Uint8Array(hashBuf)); return hashArr.map(b=>b.toString(16).padStart(2,"0")).join(""); }catch{return "";}
}


export async function buildArtifacts(){
await Deno.mkdir(EXPORT, { recursive: true }).catch(()=>{});
const zip = new ZipFile();
const targets = [
join(EXPORT, "tools_index.json"),
join(EXPORT, "smoke.json"),
...Array.from(Deno.readDirSync(PACKS)).filter(f=>f.isFile && f.name.endsWith('.zip')).map(f=>join(PACKS,f.name))
];
const checks: string[] = [];
for(const file of targets){
try{
const data = await Deno.readFile(file);
zip.addFile(file.replace(/^\//,''), data);
const h = await sha256(file);
checks.push(`${file}\t${h}`);
console.log(`[BUNDLE] add ${file}`);
}catch(e){ console.error(`[SKIP] ${file}`, e); }
}
await Deno.writeTextFile(CHECKSUMS, checks.join("\n"));
zip.addFile("export/checksums.txt", new TextEncoder().encode(checks.join("\n")));
await Deno.writeFile(OUT_BUNDLE, await zip.compress());
console.log(`[RELEASE] bundle ready: ${OUT_BUNDLE}`);
}


if (import.meta.main) buildArtifacts();
