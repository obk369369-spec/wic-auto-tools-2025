// /ops_export.ts (v2025.10.22)
export async function handleExport(_req: Request, kv: Deno.Kv): Promise<Response> {
const r = await kv.get(["wic", "latest_report"]);
if (!r.value) {
return new Response(JSON.stringify({ ok: false, message: "no report yet" }), { status: 404, headers: { "Content-Type": "application/json" } });
}
return new Response(JSON.stringify(r.value), { headers: { "Content-Type": "application/json" } });
}
