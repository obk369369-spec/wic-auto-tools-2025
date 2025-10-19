// =============================
// File: main.ts
// =============================
import { buildV0Toc } from "./lib/toc.ts";

const startedAt = new Date();

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "content-type": "application/json; charset=utf-8" },
    ...init,
  });
}

Deno.serve(async (req: Request) => {
  const { pathname } = new URL(req.url);

  if (pathname === "/" || pathname === "/index.html") {
    try {
      const html = await Deno.readTextFile("./static/index.html");
      return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
    } catch (_) {
      return new Response(
        `<!doctype html><meta charset="utf-8"><h1>WIC Auto Tools 2025</h1><ul>
         <li><a href="/health">/health</a></li>
         <li><a href="/toc">/toc</a></li>
         <li><a href="/evidence">/evidence</a></li>
         </ul>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
  }

  if (pathname === "/health") {
    const autoLoop = (Deno.env.get("AUTO_LOOP") ?? "").toLowerCase() === "true";
    const payload = {
      status: "ok",
      ts: new Date().toISOString(),
      startedAt: startedAt.toISOString(),
      autoLoopEnabled: autoLoop,
      deploymentId: Deno.env.get("DENO_DEPLOYMENT_ID") ?? null,
      region: Deno.env.get("DENO_REGION") ?? null,
    };
    return json(payload);
  }

  if (pathname === "/toc") {
    try {
      const toc = await buildV0Toc();
      return json({ ok: true, toc });
    } catch (err) {
      return json({ ok: false, reason: "TOC module not ready", error: String(err) }, { status: 501 });
    }
  }

  if (pathname === "/evidence") {
    return json({
      startedAt: startedAt.toISOString(),
      now: new Date().toISOString(),
      uptimeSec: Math.floor((Date.now() - startedAt.getTime()) / 1000),
      commit: Deno.env.get("GITHUB_SHA") ?? null,
      branch: Deno.env.get("GITHUB_REF_NAME") ?? null,
    });
  }

  return new Response("Not Found", { status: 404 });
});

import "./auto_loop.ts";
import "./hourly_report.ts";
import "./auto_recover.ts";
import "./client_watchdog.ts";
import "./data_sync.ts";
