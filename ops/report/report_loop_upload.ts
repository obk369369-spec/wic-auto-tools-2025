// /ops/report/report_loop_upload.ts
}
if (cfg.tools_whitelist?.length){ const set = new Set(cfg.tools_whitelist); tools = tools.filter(t => set.has(t.name_kr)); }
return tools;
}


function summarize(tools: ToolStatus[]){
const active = tools.filter(t => t.status === "진행중" || t.status === "거의 완료").length;
const standby = tools.filter(t => t.status === "대기").length;
const blocked = tools.filter(t => t.status === "차단").length;
const avg = tools.length ? Math.round(tools.reduce((a,b)=>a+b.progress,0)/tools.length) : 0;
return { active, standby, blocked, avg_progress: avg };
}


async function writeReport(cfg: OpsConfig){
const kst = nowKST();
kst.setUTCMinutes(0,0,0);
const seq = hourSeq(kst);
const tools = await getToolStatuses(cfg);
const payload: ReportPayload = { timestamp_kst: fmtKstISO(kst), hour_seq: seq, summary: summarize(tools), tools };
await ensureDir(cfg.output_dir);
const file = `${cfg.output_dir}/report-${seq}.json`;
await Deno.writeTextFile(file, JSON.stringify(payload, null, 2));
console.log(`[REPORT] ${file} written (${tools.length} tools)`);
return { file, payload };
}


async function postProgress(cfg: OpsConfig, payload: ReportPayload){
if (!cfg.upload?.enabled) return;
const url = cfg.upload.progress_post_url;
const headers: Record<string,string> = { "Content-Type": "application/json" };
if (cfg.upload.auth_token) headers["Authorization"] = `Bearer ${cfg.upload.auth_token}`;
try {
const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
console.log(`[UPLOAD] POST ${url} -> ${res.status}`);
} catch (e){
console.log(`[UPLOAD] failed: ${e}`);
}
}


function msToNextTopOfHourKST(){
const kst = nowKST();
const ms = kst.getTime();
const next = new Date(ms);
next.setUTCMinutes(0,0,0);
if (next <= kst) next.setUTCHours(next.getUTCHours() + 1);
return next.getTime() - ms;
}


async function main(){
const cfg = await loadConfig();
await ensureDir(cfg.output_dir);


const first = await writeReport(cfg);
await postProgress(cfg, first.payload);


const firstDelay = msToNextTopOfHourKST();
console.log(`[SCHED] first run in ${Math.round(firstDelay/1000)}s`);
setTimeout(async ()=>{
const r = await writeReport(cfg); await postProgress(cfg, r.payload);
setInterval(async ()=>{ const r2 = await writeReport(cfg); await postProgress(cfg, r2.payload); }, 60*60*1000);
}, firstDelay);


setInterval(async ()=>{ try{ await Deno.stat(cfg.output_dir);} catch { await ensureDir(cfg.output_dir);} }, 60*1000);
}


if (import.meta.main) main();
