// /main.ts — 라우터 예시(핵심: openKv 제거, kv_safe 사용)
import { handleOps } from "./ops.ts";
import { kvGet, kvSet } from "./lib/kv_safe.ts";


export default {
async fetch(req: Request): Promise<Response> {
const url = new URL(req.url);


// 진행률 최신본 export 캐시 (선택)
if (url.pathname === "/export/latest.json") {
const v = await kvGet<string>("latest_report_json");
if (v) return new Response(v, { headers: { "Content-Type": "application/json" } });
return new Response(JSON.stringify({ ok:false, message:"no export yet" }), { status: 404, headers: { "Content-Type": "application/json" }});
}


// /ops/* 라우트 위임
if (url.pathname.startsWith("/ops/")) return handleOps(req);


// 기본 인덱스
return new Response(`<!doctype html><meta charset=\"utf-8\"><h1>WIC Tools (Deno Minimal)</h1><ul><li><a href=\"/health\">/health</a></li><li><a href=\"/toc\">/toc</a></li><li><a href=\"/evidence\">/evidence</a></li><li><a href=\"/export/latest.json\">/export/latest.json</a></li></ul>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
},
};
