const ORIGIN = "https://wic-auto-tools-2025.obk369369-spec.deno.net/export";
function json(d: unknown, s=200){return new Response(JSON.stringify(d),{status:s,headers:{"Content-Type":"application/json; charset=utf-8"}});}
async function getLatest(){const r=await fetch(`${ORIGIN}/latest.json`,{cache:"no-store"});if(!r.ok)throw new Error(`fetch failed: ${r.status}`);return r.json();}
Deno.serve(async (req)=>{
  const p=new URL(req.url).pathname;
  if(p==="/ops/health") return json({ok:true,tz:"Asia/Seoul",origin:ORIGIN,iso:new Date().toISOString()});
  if(p==="/ops/bootstrap") return json({ok:true,step:"bootstrap"});
  if(p==="/ops/update") return json({ok:true,step:"update"});
  if(p==="/report/live"){ try{ const latest=await getLatest(); const rows=Array.isArray(latest?.rows)?latest.rows:[]; return json({ok:true,stalled:false,rows,meta:{source:`${ORIGIN}/latest.json`}});}
    catch(e){ const rows=[{tool:"주문자동동기화",status:"ready",uis:0.92},{tool:"고객후속관리",status:"ready",uis:0.90},{tool:"보고서자동생성",status:"ready",uis:0.88}];
      return json({ok:true,stalled:true,reason:String(e?.message??e),rows,meta:{fallback:true,origin:ORIGIN}});}}
  if(p==="/portal/launcher"){const h=`<!doctype html><meta charset="utf-8"><title>WIC Launcher</title>
  <style>body{font:14px system-ui;margin:24px}a{display:block;margin:8px 0}</style>
  <h1>WIC 실행 런처</h1><p>원본: <code>${ORIGIN}</code></p>
  <a href="/report/live" target="_blank">보고(Report Live)</a>
  <a href="/ops/health" target="_blank">헬스체크(Health)</a>
  <a href="/ops/update" target="_blank">업데이트(Update)</a>
  <a href="/ops/bootstrap" target="_blank">부트스트랩(Bootstrap)</a>`; return new Response(h,{headers:{"Content-Type":"text/html; charset=utf-8"}});}
  return new Response("OK",{headers:{"Content-Type":"text/plain; charset=utf-8"}});
});
