// =============================
// File: main.ts  (REPLACE)
// =============================

import { buildTOC } from "./lib/toc.ts";
import { handleOps } from "./ops.ts";

const startedAt = new Date();

Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const { pathname } = url;

  if (pathname.startsWith("/ops/")) {
    return handleOps(req);
  }

  if (pathname === "/" || pathname === "/index.html") {
    try {
      const html = await Deno.readTextFile("./static/index.html");
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    } catch (_) {
      return new Response(
        `<!doctype html><html><head><meta charset="utf-8"><title>WIC Auto Tools</title></head><body>
         <h1>WIC Auto Tools 2025</h1>
         <ul>
           <li><a href="/health">/health</a></li>
           <li><a href="/toc">/toc</a></li>
           <li><a href="/evidence">/evidence</a></li>
           <li><a href="/ops/progress">/ops/progress</a></li>
           <li><a href="/ops/eta">/ops/eta</a></li>
         </ul>
        </body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
  }

  if (pathname === "/health") {
    const autoLoop = (Deno.env.get("AUTO_LOOP") ?? "").toLowerCase();
    const payload = {
      status: "ok",
      service: "wic-auto-tools-2025",
      ts: new Date().toISOString(),
      startedAt: startedAt.toISOString(),
      autoLoopEnabled: autoLoop === "true",
      deploymentId: Deno.env.get("DENO_DEPLOYMENT_ID") ?? null,
      region: Deno.env.get("DENO_REGION") ?? "ap-seoul",
    };
    return new Response(JSON.stringify(payload, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  if (pathname === "/toc") {
    try {
      const toc = await buildTOC();
      return new Response(JSON.stringify({ ok: true, toc }, null, 2), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, reason: "TOC module not ready", error: String(err) }, null, 2),
        { headers: { "content-type": "application/json; charset=utf-8" }, status: 501 },
      );
    }
  }

  if (pathname === "/evidence") {
    const data = {
      startedAt: startedAt.toISOString(),
      now: new Date().toISOString(),
      uptimeSec: Math.floor((Date.now() - startedAt.getTime()) / 1000),
      commit: Deno.env.get("GITHUB_SHA") ?? null,
      branch: Deno.env.get("GITHUB_REF_NAME") ?? null,
      status: "ok",
    };
    return new Response(JSON.stringify(data, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  return new Response("Not Found", { status: 404 });
});

// 항상 임포트 → 내부에서 AUTO_LOOP 값으로 실행 제어
import "./auto_loop.ts";
