// /main.ts  (정적 서빙 + /ops 위임)
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { handleOps } from "./ops.ts";

const ROOT = Deno.cwd();
const staticServe = (req: Request, base: string) =>
  serveFile(req, join(ROOT, base, new URL(req.url).pathname.replace(base, "")));

export default {
  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/ops/")) return handleOps(req);
    if (url.pathname.startsWith("/apps/")) return staticServe(req, "/");
    if (url.pathname.startsWith("/hub/"))  return staticServe(req, "/");
    if (url.pathname.startsWith("/packs/"))return staticServe(req, "/");
    if (url.pathname === "/") {
      return new Response(`<!doctype html><h1>WIC Tools (Deno Minimal)</h1>
        <ul><li><a href="/health">/health</a></li><li><a href="/toc">/toc</a></li>
        <li><a href="/evidence">/evidence</a></li><li><a href="/export/latest.json">/export/latest.json</a></li>
        <li><a href="/apps/content/meta_input.html">meta_input</a></li>
        <li><a href="/apps/content/webpage_editor.html">webpage_editor</a></li></ul>`, {
        headers: { "Content-Type": "text/html; charset=utf-8" }
      });
    }
    return new Response("Not Found", { status: 404 });
  },
};
