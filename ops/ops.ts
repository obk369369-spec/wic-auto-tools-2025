// /ops/ops.ts — 필요 라우트 연결 (수정 없음; handleOps 유지)
export async function handleOps(request: Request): Promise<Response> {
const { pathname } = new URL(request.url);
if (pathname === "/ops/progress") return new Response(JSON.stringify({ ok:true, route:"/ops/progress" }), { headers: { "Content-Type":"application/json" }});
if (pathname === "/ops/eta") return new Response(JSON.stringify({ ok:true, route:"/ops/eta" }), { headers: { "Content-Type":"application/json" }});
if (pathname === "/ops/health") return new Response(JSON.stringify({ ok:true, route:"/ops/health", status:"healthy" }), { headers: { "Content-Type":"application/json" }});
return new Response(JSON.stringify({ ok:true, route: pathname }), { headers:{"Content-Type":"application/json"} });
}
