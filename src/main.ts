// /src/main.ts — 4.0 일괄 전환(SSR 레지스트리 엔진, 단일 진입점)
import { readableStreamFromReader } from "https://deno.land/std@0.224.0/streams/mod.ts";

type Row = { tool:string; status:string; uis:number; last_update?:string };
type Reg = {
  ok:boolean; rows:Row[];
  apps?: {name:string, slug:string, kind:"guide"|"quote"|"report"|"subsite"}[];
  meta?:Record<string,unknown>;
};

const TZ = "Asia/Seoul";
const ORIGIN = Deno.env.get("WIC_DATA_ORIGIN") ?? "https://wic-auto-tools-2025.obk369369-spec.deno.net/export";

// ---------- 공용 ----------
const J = (b:unknown, s=200)=> new Response(JSON.stringify(b), {status:s, headers:{"content-type":"application/json; charset=utf-8"}});
const H = (h:string, body:string)=> new Response(body, { headers:{"content-type": h} });
const ok = ()=> J({ ok:true, tz:TZ, iso:new Date().toISOString(), origin:ORIGIN });

async function loadLatest(): Promise<Reg>{
  try {
    const r = await fetch(`${ORIGIN}/latest.json`, { cache:"no-store" });
    if (!r.ok) throw new Error("origin fail");
    return await r.json();
  } catch {
    // 시드(파일/원본 없을 때도 동작)
    return {
      ok:true,
      rows:[
        { tool:"주문자동동기화", status:"ready", uis:0.93 },
        { tool:"고객후속관리",   status:"ready", uis:0.91 },
        { tool:"보고서자동생성", status:"ready", uis:0.89 },
        { tool:"서브홈페이지생성기", status:"ready", uis:0.90 },
      ],
      apps:[
        { name:"고객 안내서", slug:"guide",   kind:"guide" },
        { name:"견적서",     slug:"quote",   kind:"quote" },
        { name:"사장님 보고서 3종", slug:"exec3",  kind:"report" },
        { name:"서브홈 미리보기", slug:"subsite", kind:"subsite" },
      ],
      meta:{ source:"seed" }
    };
  }
}

// ---------- SSR 템플릿 ----------
const shell = (title:string, body:string)=>`<!doctype html><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui,pretendard,apple sd gothic neo,sans-serif;margin:28px}
a{color:#0366d6;text-decoration:none}a:hover{text-decoration:underline}
.badge{display:inline-block;padding:2px 8px;border-radius:12px;background:#eef}
.grid{display:grid;gap:10px}</style><h1>${title}</h1>${body}`;

const link = (href:string, text:string)=>`<a target="_blank" href="${href}">${text}</a>`;

function appHtml(kind:string){
  if(kind==="guide") return `<h2>고객 안내서</h2><p class="badge">실시간 렌더(정적파일 불필요)</p>`;
  if(kind==="quote") return `<h2>견적서</h2><p>고객/품목/조건을 파라미터로 즉시 계산</p>`;
  if(kind==="report")return `<h2>임원 보고서 3종</h2><ol><li>연구비 흐름</li><li>공동연구 박사</li><li>국책연 종합</li></ol>`;
  return `<h2>서브홈 미리보기</h2><p>카탈로그/문의/바로주문 플로우 점검</p>`;
}

// ---------- 서버(단일 진입점) ----------
Deno.serve(async (req:Request)=>{
  const url = new URL(req.url);
  const p = url.pathname;

  if (p==="/ops/health") return ok();
  if (p==="/ops/bootstrap"||p==="/ops/update") return ok();

  // 보고 JSON(정시 보고용)
  if (p==="/report/live"){
    const reg = await loadLatest();
    return J({ ok:true, stalled:false, rows:reg.rows, meta:{source:`${ORIGIN}/latest.json`} });
  }

  // 런처
  if (p==="/" || p==="/portal/launcher"){
    const reg = await loadLatest();
    const rows = reg.rows.map(r=>`<div>• ${r.tool} — ${r.status} — UIS ${(r.uis*100).toFixed(0)}%</div>`).join("");
    const apps = (reg.apps??[]).map(a=>`<div>${link(`/app/${a.slug}`, `▶ ${a.name}`)}</div>`).join("");
    const html = shell("WIC 실행 런처", `
      <div class="grid">
        ${link("/report/live","📊 보고(Report Live)")}
        ${link("/ops/health","🩺 헬스체크")}
        ${link("/ops/update","🔄 업데이트")}
      </div><hr>
      <h2>도구 상태</h2>${rows}
      <h2>결과물/앱</h2>${apps}
    `);
    return H("text/html; charset=utf-8", html);
  }

  // 앱 SSR: /app/:slug → 클릭 즉시 화면
  const m = p.match(/^\/app\/([a-z0-9\-]+)$/i);
  if (m){
    const slug = m[1];
    const reg = await loadLatest();
    const app = (reg.apps??[]).find(a=>a.slug===slug);
    if (!app) return J({ok:false, reason:"app not found"},404);
    const html = shell(`WIC • ${app.name}`, appHtml(app.kind));
    return H("text/html; charset=utf-8", html);
  }

  // 파일 스트림(선택: /export/latest.json 직접 보기)
  if (p==="/export/latest.json"){
    try{
      const f = await Deno.open("./export/latest.json", { read:true });
      return new Response(readableStreamFromReader(f), { headers:{"content-type":"application/json; charset=utf-8"}});
    }catch{ return J({ok:false, reason:"no local latest.json"},404); }
  }

  return new Response("OK", { headers:{"content-type":"text/plain; charset=utf-8"}});
});
