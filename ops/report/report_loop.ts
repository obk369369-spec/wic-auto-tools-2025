// /ops/report/report_loop.ts
// Deno runtime: KST 정시 보고 JSON 생성 (백업 경로)
// 실행: deno run -A /ops/report/report_loop.ts


// ----- Types -----
type ToolStatus = {
name_kr: string;
progress: number; // 0~100
eta_minutes: number; // 남은 분
status: "진행중" | "거의 완료" | "완료" | "대기" | "차단";
self_heal: "정상" | "복구" | "점검";
log: string;
link?: string;
};


type ReportPayload = {
timestamp_kst: string;
hour_seq: string; // YYYYMMDD-HH
summary: { active: number; standby: number; blocked: number; avg_progress: number };
tools: ToolStatus[];
};


// ----- Config -----
const CONFIG_PATH = "/ops/report/ops_config.json";
type OpsConfig = {
timezone: "Asia/Seoul";
output_dir: string; // 예: /ops/report/out
sources: { progress_url?: string; eta_url?: string; logs_url?: string };
tools_whitelist?: string[];
rotate_keep?: number;
};


// ----- Time helpers (KST) -----
function nowKST(): Date { return new Date(Date.now() + 9 * 60 * 60 * 1000); }
const pad = (n: number) => String(n).padStart(2, "0");
const fmtKstISO = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}+09:00`;
const hourSeq = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}-${pad(d.getUTCHours())}`;


// ----- IO helpers -----
async function loadConfig(): Promise<OpsConfig> { const raw = await Deno.readTextFile(CONFIG_PATH); return JSON.parse(raw); }
async function ensureDir(dir: string){ await Deno.mkdir(dir, { recursive: true }); }
async function fetchJSON(url: string){ try{ const r = await fetch(url, { headers:{ accept: "application/json" }}); if(!r.ok) return null; return await r.json(); } catch { return null; } }


// ----- Data acquire (endpoints or stub) -----
async function getToolStatuses(cfg: OpsConfig): Promise<ToolStatus[]> {
const p = cfg.sources.progress_url ? await fetchJSON(cfg.sources.progress_url) : null;
const e = cfg.sources.eta_url ? await fetchJSON(cfg.sources.eta_url) : null;
const l = cfg.sources.logs_url ? await fetchJSON(cfg.sources.logs_url) : null;


// 로컬 스텁 (엔드포인트 미연결시)
const stub: ToolStatus[] = [
{ name_kr: "고객필터", progress: 93, eta_minutes: 3, status: "진행중", self_heal: "정상", log: "SYNC 루프 정상", link: "" },
{ name_kr: "구매예측기", progress: 95, eta_minutes: 2, status: "진행중", self_heal: "정상", log: "Predict 안정", link: "" },
{ name_kr: "워커 24h 루프", progress: 97, eta_minutes: 1, status: "진행중", self_heal: "정상", log: "보고루프 정상", link: "" },
{ name_kr: "관리자 대시보드", progress: 100, eta_minutes: 0, status: "완료", self_heal: "복구", log: "잠금 완료", link: "" }
];
let tools: ToolStatus[] = stub;


if (p?.tools){
tools = p.tools.map((t: any) => ({
name_kr: t.name_kr ?? t.name ?? "도구",
progress: Math.max(0, Math.min(100, Number(t.progress ?? 0))),
eta_minutes: Number(t.eta_minutes ?? 0),
status: (t.status ?? "진행중"),
self_heal: (t.self_heal ?? "정상"),
log: String(t.log ?? ""),
link: t.link ?? ""
}));
}
if (e?.tools){
const map = new Map<string, any>();
for (const t of e.tools) map.set((t.name_kr ?? t.name) as string, t);
tools = tools.map(t => map.has(t.name_kr) ? { ...t, eta_minutes: Number(map.get(t.name_kr).eta_minutes ?? t.eta_minutes) } : t);
}
if (l?.tools){
const map = new Map<string, any>();
if (import.meta.main) main();
