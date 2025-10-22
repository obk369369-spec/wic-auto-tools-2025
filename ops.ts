// /ops.ts (v2025.10.22)
export async function handleOps(req: Request, kv: Deno.Kv): Promise<Response> {
const { pathname } = new URL(req.url);


// 최신 보고 업로드: report_loop_upload.ts 가 POST로 보냄
if (pathname === "/ops/progress" && req.method === "POST") {
const payload = await req.json().catch(() => null);
if (!payload) return new Response(JSON.stringify({ ok: false, error: "invalid json" }), { status: 400 });


// KV에 최신본 저장
await kv.set(["wic", "latest_report"], payload);
await kv.set(["wic", "latest_report_ts"], Date.now());
return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
}


// 점검용 GET (선택)
if (pathname === "/ops/progress" && req.method === "GET") {
const r = await kv.get(["wic", "latest_report"]);
if (!r.value) return new Response(JSON.stringify({ ok: false, message: "no report yet" }), { status: 404 });
return new Response(JSON.stringify(r.value), { headers: { "Content-Type": "application/json" } });
}


if (pathname === "/ops/eta") {
const r = await kv.get(["wic", "latest_report"]);
const eta = r.value?.tools?.map((t: any) => ({ name_kr: t.name_kr, eta_minutes: t.eta_minutes })) ?? [];
return new Response(JSON.stringify({ ok: true, eta }), { headers: { "Content-Type": "application/json" } });
}


if (pathname === "/ops/health") {
const ts = await kv.get(["wic", "latest_report_ts"]);
return new Response(JSON.stringify({ ok: true, kv: "ready", last_report_ms: ts.value ?? null }), { headers: { "Content-Type": "application/json" } });
}


return new Response(JSON.stringify({ ok: true, route: pathname }), { headers: { "Content-Type": "application/json" } });
}
