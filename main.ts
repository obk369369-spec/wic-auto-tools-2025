// =============================
// File: main.ts (routes: /, /health, /toc, /evidence, /ops?action=links|status|eta)
// =============================
import { buildTOC } from "./lib/toc.ts";
import { snapshot, toolStatus, groupETA } from "./ops_status.ts";

const startedAt = new Date();

Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const { pathname } = url;

  // index
  if (pathname === "/" || pathname === "/index.html") {
    try {
      const html = await Deno.readTextFile("./static/index.html");
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    } catch {
      return new Response(
        `<!doctype html><html><head><meta charset="utf-8"><title>WIC Auto Tools</title></head><body>
         <h1>WIC Auto Tools 2025</h1>
         <ul>
           <li><a href="/health">/health</a></li>
           <li><a href="/toc">/toc</a></li>
           <li><a href="/evidence">/evidence</a></li>
           <li><a href="/ops?action=status">/ops?action=status</a></li>
           <li><a href="/ops?action=eta">/ops?action=eta</a></li>
           <li><a href="/ops?action=links">/ops?action=links</a></li>
         </ul>
        </body></html>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
  }

  // health
  if (pathname === "/health") {
    const payload = {
      status: "ok",
      service: "wic-auto-tools-2025",
      time: new Date().toISOString(),
      startedAt: startedAt.toISOString(),
      autoLoopEnabled: (Deno.env.get("AUTO_LOOP") ?? "").toLowerCase() === "true",
      deploymentId: Deno.env.get("DENO_DEPLOYMENT_ID") ?? null,
      region: Deno.env.get("DENO_REGION") ?? null,
    };
    return new Response(JSON.stringify(payload, null, 2), { headers: { "content-type": "application/json; charset=utf-8" } });
  }

  // toc
  if (pathname === "/toc") {
    try {
      const toc = await buildTOC();
      return new Response(JSON.stringify({ ok: true, toc }, null, 2), { headers: { "content-type": "application/json; charset=utf-8" } });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, reason: "TOC module not ready", error: String(err) }, null, 2),
        { headers: { "content-type": "application/json; charset=utf-8" }, status: 501 });
    }
  }

  // evidence
  if (pathname === "/evidence") {
    const data = {
      startedAt: startedAt.toISOString(),
      now: new Date().toISOString(),
      uptimeSec: Math.floor((Date.now() - startedAt.getTime()) / 1000),
      commit: Deno.env.get("GITHUB_SHA") ?? null,
      branch: Deno.env.get("GITHUB_REF_NAME") ?? null,
    };
    return new Response(JSON.stringify(data, null, 2), { headers: { "content-type": "application/json; charset=utf-8" } });
  }

  // ops: status / eta / links
  if (pathname === "/ops") {
    const action = url.searchParams.get("action");
    if (action === "status") {
      const tool = url.searchParams.get("tool") as any;
      if (tool) {
        const s = toolStatus(tool);
        return new Response(JSON.stringify({ ok: !!s, tool: s ?? null }, null, 2), {
          headers: { "content-type": "application/json; charset=utf-8" }, status: s ? 200 : 404
        });
      }
      return new Response(JSON.stringify({ ok: true, snapshot: snapshot() }, null, 2),
        { headers: { "content-type": "application/json; charset=utf-8" } });
    }
    if (action === "eta") {
      return new Response(JSON.stringify({ ok: true, groupETA: groupETA() }, null, 2),
        { headers: { "content-type": "application/json; charset=utf-8" } });
    }
    if (action === "links") {
      const base = "https://wic-auto-tools-2025.obk369369-spec.deno.net";
      const links = {
        HEALTH:   { url: `${base}/health`,              menu: "Endpoint: /health" },
        EVIDENCE: { url: `${base}/evidence`,            menu: "Endpoint: /evidence" },
        STATUS:   { url: `${base}/ops?action=status`,   menu: "Endpoint: /ops?action=status" },
        ETA:      { url: `${base}/ops?action=eta`,      menu: "Endpoint: /ops?action=eta" },
        // Deno 콘솔 내부 링크는 권한/공개설정 이슈로 제외(500 방지)
      };
      return new Response(JSON.stringify({ ok: true, links }, null, 2),
        { headers: { "content-type": "application/json; charset=utf-8" } });
    }
    return new Response(JSON.stringify({ ok: false, reason: "unknown action" }, null, 2),
      { headers: { "content-type": "application/json; charset=utf-8" }, status: 400 });
  }

  // 404
  return new Response("Not Found", { status: 404 });
});

// 백그라운드 루프 (서버는 main.ts 단일 진입점)
import "./auto_loop.ts";
import "./hourly_report.ts";
