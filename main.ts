// main.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve((_req) => new Response(JSON.stringify({ ok: true, service: "wic" }), {
  headers: { "content-type": "application/json" },
}));
