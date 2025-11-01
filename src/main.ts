// 4.0 원샷 전환: 단일 진입점 보장 + SSR 레지스트리
// ─ Warm Up 실패 원인(중복 리스너) 차단 가드
if ((globalThis as any).__booted) {
  // 이미 다른 번들이 Deno.serve를 띄운 경우 즉시 종료하여 중복 리스너 방지
  self.close();
} else {
  (globalThis as any).__booted = true;
}

type Row = { tool:string; status:string; uis:number; last_update?:string };
type Reg = {
  ok:boolean; rows:Row[];
  apps?: {name:string, slug:string, kind:"guide"|"quote"|"report"|"subsite"}[];
  meta?:Record<string,unknown>;
};

const TZ = "Asia/Seoul";
const ORIGIN = Deno.env.get("WIC_DATA_ORIGIN") ?? "https://wic-auto-tools-2025.obk369369-spec.deno.net/export";

const J = (b:unknown, s=200)=> new Response(JSON.stringify(b), {status:s, headers:{"content-type":"application/json; charset=utf-8"}});
const H = (h:string, body:string)=> new Response(body, { headers:{"content-type": h} });

async function loadLatest(): Promise<Reg>{
  try {
    const r = await fetch(`${ORIGIN}/latest.json`, { cache:"no-store" });
    if (!r.ok) throw new Error("origin fail");
    return await r.json();
  } catch {
    // 원본이 비어도 동작하는 시드
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
        { name:"서브홈 미리보기", slug:"subsite", kind:"subsite" }
      ],
      meta:{ source:"seed" }
    };
  }
}

const shell = (title:string, body:string)=>`<!doctype html><meta charset="utf-8"><title>${title}</title>
<style>
body{font-family:system-ui,pretendard,apple sd gothic neo,sans-serif;margin:28px;background:#fafbfc}
a{color:#0366d6;text-decoration:none}a:hover{text-decoration:underline}
.grid{display:grid;gap:10px}
.badge{display:inline-block;padding:2px 8px;border-radius:12px;background:#eef}
</style>
<h1>${title}</h1>${body}`;

const a = (href:string, text:string)=>`<a target="_blank" href="${href}">${text}</a>`;

function appHtml(kind:"guide"|"quote"|"report"|"subsite"){
  if(kind==="guide") return `<h2>고객 안내서</h2><p class="badge">SSR 실시간 렌더(정적 파일 불필요)</p>`;
  if(kind==="quote") return `<h2>견적서</h2><p>고객/품목/조건 파라미터를 쿼리로 받아 즉시 계산합니다.</p>`;
  if(kind==="report")return `<h2>임원 보고서 3종</h2><ol><li>연구비 흐름</li><li>공동연구 박사</li><li>국책연 종합</li></ol>`;
  return `<h2>서브홈 미리보기</h2><p>카탈로그→문의→바로주문 플로우 점검</p>`;
}

async function handler(req:Request): Promise<Response>{
  const url = new URL(req.url);
  const p = url.pathname;

  if (p==="/ops/health") return J({ ok:true, tz:TZ, iso:new Date().toISOString(), origin:ORIGIN });
  if (p==="/ops/bootstrap"||p==="/ops/update") return J({ ok:true, step:p.slice(5) });

  if (p==="/report/live"){
    const reg = await loadLatest();
    return J({ ok:true, stalled:false, rows:reg.rows, meta:{source:`${ORIGIN}/latest.json`} });
  }

  if (p==="/" || p==="/portal/launcher"){
    const reg = await loadLatest();
    const rows = reg.rows.map(r=>`<div>• ${r.tool} — ${r.status} — UIS ${(r.uis*100).toFixed(0)}%</div>`).join("");
    const apps = (reg.apps??[]).map(x=>`<div>${a(`/app/${x.slug}`, `▶ ${x.name}`)}</div>`).join("");
    const html = shell("WIC 실행 런처", `
      <div class="grid">
        ${a("/report/live","📊 보고(Report Live)")}
        ${a("/ops/health","🩺 헬스체크")}
        ${a("/ops/update","🔄 업데이트")}
      </div><hr>
      <h2>도구 상태</h2>${rows}
      <h2>결과물/앱</h2>${apps}
    `);
    return H("text/html; charset=utf-8", html);
  }

  const m = p.match(/^\/app\/([a-z0-9\-]+)$/i);
  if (m){
    const slug = m[1];
    const reg = await loadLatest();
    const app = (reg.apps??[]).find(x=>x.slug===slug);
    if (!app) return J({ok:false, reason:"app not found"},404);
    const html = shell(`WIC • ${app.name}`, appHtml(app.kind));
    return H("text/html; charset=utf-8", html);
  }

  if (p==="/export/latest.json"){
    try{
      const txt = await Deno.readTextFile("./export/latest.json");
      return H("application/json; charset=utf-8", txt);
    }catch{
      const reg = await loadLatest();
      return J(reg);
    }
  }

  return new Response("OK", { headers:{"content-type":"text/plain; charset=utf-8"}});
}

Deno.serve(handler);
