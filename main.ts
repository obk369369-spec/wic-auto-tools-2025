import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { handleOps } from "./ops.ts";
const ROOT=Deno.cwd();
const staticServe=(req:Request, base:string)=>serveFile(req, join(ROOT, base, new URL(req.url).pathname.replace(base, "")));
export default { async fetch(req:Request){ const u=new URL(req.url);
if(u.pathname.startsWith("/ops/")) return handleOps(req);
if(u.pathname.startsWith("/apps/")) return staticServe(req, "/");
if(u.pathname.startsWith("/hub/")) return staticServe(req, "/");
if(u.pathname.startsWith("/packs/"))return staticServe(req, "/");
return new Response(`<!doctype html><h1>WIC One-Click</h1><ul>
<li><a href="/hub">/hub</a></li>
<li><a href="/export/latest.json">/export/latest.json</a></li>
</ul>`, { headers:{"Content-Type":"text/html; charset=utf-8"} }); } };
