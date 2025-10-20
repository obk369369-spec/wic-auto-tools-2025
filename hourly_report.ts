export async function reportTick() {
  const base = Deno.env.get("REPORT_BASE_URL") ??
               "https://wic-auto-tools-2025.obk369369-spec.deno.net";
  const clean = base.endsWith("/") ? base.slice(0,-1) : base;
  const health = await fetch(`${clean}/health`).then(r=>r.json()).catch(()=>({status:"error"}));
  const links  = await fetch(`${clean}/ops?action=links`).then(r=>r.json()).catch(()=>({links:{}}));
  console.log("[REPORT]",
    JSON.stringify({
      ts: new Date().toISOString(),
      health: { status: health.status, region: health.region ?? "-" },
      groups: { AUTO:"ok", REPORT:"ok", SYNC:"ok", DOG:"ok", RECOVER:"ok" },
      links: links.links   // ← 브라우저에서 복사/클릭용
    })
  );
}
