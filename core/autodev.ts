// /core/autodev.ts
const specs = await listSpecs();
const manifest:any={ version:new Date().toISOString(), tools:[] };


for(const sp of specs){
const y= (await readText(sp));
const spec = parseYAML(y); // 아래 간단 파서 사용
// 웹앱 생성
if(spec.kind.includes("web")){
const htmlTpl = await readText("/core/templates/web_app.html.tmpl");
const html = tpl(htmlTpl,{ id: spec.id, name_kr: spec.name_kr });
const webPath = spec.routes.web;
const abs = join(ROOT, webPath);
await Deno.mkdir(abs.replace(/\/[^/]+$/,''),{recursive:true}).catch(()=>{});
await Deno.writeTextFile(abs, html);
}
// API 생성
if(spec.kind.includes("api") && spec.routes.api){
for(const a of spec.routes.api){
const codeTpl = await readText("/core/templates/api_handler.ts.tmpl");
const code = tpl(codeTpl,{
id: spec.id,
handler_name: `handle_${spec.id}_api`,
method: a.method,
json_schema: JSON.stringify(a.schema)
});
const apiOut = `/ops/${spec.id}/api.ts`;
await Deno.mkdir(`/ops/${spec.id}`,{recursive:true}).catch(()=>{});
await Deno.writeTextFile(apiOut, code);
// ops 라우팅 등록 파일에 추가(append)
await appendRoute(spec.id, a.path);
}
}
// 매니페스트 갱신
manifest.tools.push({ id: spec.id, name_kr: spec.name_kr, run_url: spec.routes.web||"", download_url: `/packs/${spec.id}.zip`, health_url: spec.health?.url||"", enabled: true, pack_src: spec.pack?.src||"" });
}
await Deno.writeTextFile("/tools/tools_manifest.json", JSON.stringify(manifest,null,2));
}


// 매우 단순한 YAML 파서(키:값 / 들여쓰기 기반). 실제 운용시 js-yaml 대체 가능
function parseYAML(y:string){
const obj:any={}; const lines=y.split(/\r?\n/);
let cur:any=obj, stack:any[]=[obj], indents:number[]=[0];
for(const line of lines){
if(!line.trim()||line.trim().startsWith("#")) continue;
const m = line.match(/^(\s*)([^:]+):\s*(.*)$/); if(!m) continue;
const indent=m[1].length, key=m[2].trim(), val=m[3].trim();
while(indent < indents[indents.length-1]){ stack.pop(); indents.pop(); cur=stack[stack.length-1]; }
if(val==='') { cur[key]={}; stack.push(cur[key]); indents.push(indent+2); cur=cur[key]; }
else { cur[key]= (/^(\d+|true|false|null)$/i.test(val)? JSON.parse(val): val); }
}
return obj;
}


async function appendRoute(id:string, path:string){
const marker = "// [AUTO_ROUTES]";
const opsPath = "/ops/ops.ts";
let src = await readText(opsPath).catch(()=>"export async function handleOps(r:Request){const {pathname}=new URL(r.url);\n"+marker+"\nreturn new Response(JSON.stringify({ok:true,route:pathname}),{headers:{'Content-Type':'application/json'}});}\n");
if(!src.includes(marker)) src += "\n"+marker+"\n";
const stub = `if(pathname === "${path}") { const mod = await import("/ops/${id}/api.ts"); return mod.handle_${id}_api(r); }\n`;
if(!src.includes(stub)) src = src.replace(marker, stub+marker);
await Deno.writeTextFile(opsPath, src);
}


if(import.meta.main) generate();
