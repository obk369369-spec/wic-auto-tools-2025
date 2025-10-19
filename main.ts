// =============================
// File: main.ts (Deno Deploy Entry)
// =============================
// Deno Deploy/CLI 공통 동작. 별칭/번들/웹팩 전혀 없음.
import { buildV0Toc } from "./lib/toc.ts";

const enc = new TextEncoder();
const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    headers: { "content-type": "application/json; charset=utf-8" },
    ...init,
  });
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  if (path === "/" || path === "/index.html") {
    try {
      const html = await Deno.readTextFile("./static/index.html");
      return new Response(html, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch (_) {
      return new Response("WIC-Auto-Tools-2025 Root Page", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  }

  if (path === "/health") {
    const payload = {
      status: "ok",
      ts: new Date().toISOString(),
      env: Deno.env.get("AUTO_LOOP"),
    };
    return json(payload);
  }

  if (path === "/toc") {
    try {
      const toc = await buildV0Toc();
      return json({ ok: true, toc });
    } catch (e) {
      return json({ ok: false, error: String(e) }, { status: 500 });
    }
  }

  if (path === "/evidence") {
    const data = {
      now: new Date().toISOString(),
      commit: Deno.env.get("GITHUB_SHA"),
      region: Deno.env.get("DENO_REGION"),
    };
    return json(data);
  }

  return new Response("Not Found", { status: 404 });
});

import "./auto_loop.ts";
