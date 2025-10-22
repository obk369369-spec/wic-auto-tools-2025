// /main.ts (v2025.10.22)
import { handleOps } from "./ops.ts";
import { handleExport } from "./ops_export.ts";


const kv = await Deno.openKv();


export default {
async fetch(req: Request): Promise<Response> {
const { pathname } = new URL(req.url);


if (pathname.startsWith("/ops/")) {
return await handleOps(req, kv);
}
if (pathname === "/export/latest.json") {
return await handleExport(req, kv);
}


// 루트 인덱스
const body = `<!doctype html><html><body>
<h1>WIC Tools (Deno Minimal)</h1>
<ul>
<li><a href="/health">/health</a></li>
<li><a href="/toc">/toc</a></li>
<li><a href="/evidence">/evidence</a></li>
<li><a href="/export/latest.json">/export/latest.json</a> (실측 보고)</li>
</ul>
</body></html>`;
return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
},
};
