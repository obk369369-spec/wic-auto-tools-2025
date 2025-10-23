// /ingest/requirements_parser.ts — 요구사항 docx를 간단 규칙으로 스펙 YAML로 추출
// 실제 구현시 docx 파서 라이브러리로 교체 가능(여기선 텍스트 전처리 가정)
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
export async function docxToSpecs(docPath:string){
const raw = await Deno.readTextFile(docPath.replace(/\.docx$/,'.txt'));
// 규칙 예: [TOOL:id name=한글명 kind=web|api routes.web=/apps/...]
const lines = raw.split(/\n/).filter(Boolean);
for(const ln of lines){
const m = ln.match(/^\[TOOL:(\w+)\s+name=(.+?)\s+kind=([\w+]+)\s+web=(\S+)\]/);
if(m){
const yaml = `id: ${m[1]}\nname_kr: ${m[2]}\nkind: ${m[3]}\nroutes:\n web: ${m[4]}\n`;
await Deno.mkdir('/specs',{recursive:true}).catch(()=>{});
await Deno.writeTextFile(join('/specs',`${m[1]}.yaml`), yaml);
}
}
}
if(import.meta.main){ const p = Deno.args[0]||'/ingest/requirements.txt'; docxToSpecs(p); }
