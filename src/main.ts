import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/" || url.pathname === "/portal/launcher") {
    return new Response(await Deno.readTextFile("./static/index.html"), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  if (url.pathname.startsWith("/static/")) {
    return serveFile(req, `.${url.pathname}`);
  }
  if (url.pathname === "/ops/health") {
    return Response.json({
      ok: true,
      tz: "Asia/Seoul",
      iso: new Date().toISOString(),
    });
  }
  if (url.pathname === "/report/live") {
    const json = await Deno.readTextFile("./export/latest.json");
    return new Response(json, { headers: { "content-type": "application/json" } });
  }
  return new Response("OK", { status: 200 });
});
