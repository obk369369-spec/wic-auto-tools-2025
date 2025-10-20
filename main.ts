// =============================
// File: main.ts (Complete with /ops routes)
// =============================
import { buildTOC } from "./lib/toc.ts";
import { snapshot } from "./ops_status.ts";   // ★ 상태 스냅샷 임포트

const startedAt = new Date();

Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const { pathname } = url;

  if (pathname === "/" || pathname === "/index.html") {
    try {
      const html = await Deno.readTextFile("./static/index.html");
      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
      });
    } catch {
      return new Response(
        `<!doctype html><html><head><meta charset="utf-8"><title>WIC Auto Tools</title></head><body>
         <h1>WIC Auto Tools 2025</h1>
         <ul>
           <li><a href="/health">/health</a></li>
           <li><a href="/toc">/toc</a></li>
           <li><a href="/evidence">/evidence</a></li>
           <li><a href="/ops?action=status">/ops?action=status</a></li>
           <li><a href="/ops?action=links">/ops?action=links</a></li>
         </ul>
        </body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
  }

  if (pathname === "/health") {
    const autoLoop = (Deno.env.get("AUTO_LOOP") ?? "").toLowerCase() === "true";
    const payload = {
      status: "ok",
      service: "wic-auto-tools-2025",
      time: new Date().toISOString(),
      startedAt: startedAt.toISOString(),
      autoLoopEnabled: autoLoop,
      deploymentId: Deno.env.get("DENO_DEPLOYMENT_ID") ?? null,
      region: Deno.env.get("DENO_REGION") ?? null,
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
    };
    return new Response(JSON.stringify(data, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  // ---- Ops 라우트: status / links
  if (pathname === "/ops") {
    const action = url.searchParams.get("action");
    const base = "https://wic-auto-tools-2025.obk369369-spec.deno.net";
    const deno = "https://console.deno.com/obk369369-spec/wic-auto-tools-2025";

    if (action === "status") {
      return new Response(JSON.stringify({ ok: true, snapshot: snapshot() }, null, 2), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    if (action === "links") {
      const links = {
        HEALTH: { url: `${base}/health`, menu: "Preview URL → /health" },
        EVIDENCE:{ url: `${base}/evidence`, menu: "Preview URL → /evidence" },
        STATUS:  { url: `${base}/ops?action=status`, menu: "Custom Ops → status" },
        AUTO:    { url: `${deno}/observability/logs?search=%5BAUTO%5D`, menu: "Console → Logs → 검색: [AUTO]" },
        REPORT:  { url: `${deno}/observability/logs?search=%5BREPORT%5D`, menu: "Console → Logs → 검색: [REPORT]" },
        SYNC:    { url: `${deno}/observability/logs?search=%5BSYNC%5D`, menu: "Console → Logs → 검색: [SYNC]" },
        DOG:     { url: `${deno}/observability/logs?search=%5BDOG%5D`, menu: "Console → Logs → 검색: [DOG]" },
        RECOVER: { url: `${deno}/observability/logs?search=%5BRECOVER%5D`, menu: "Console → Logs → 검색: [RECOVER]" },
        BUILDS:  { url: deno, menu: "Overview → Recent Production Builds" },
      };
      return new Response(JSON.stringify({ ok: true, links }, null, 2), {
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    return new Response(JSON.stringify({ ok: false, reason: "unknown action" }, null, 2), {
      headers: { "content-type": "application/json; charset=utf-8" },
      status: 400,
    });
  }

  // 404
  return new Response("Not Found", { status: 404 });
});

// 백그라운드 루프
import "./auto_loop.ts";
