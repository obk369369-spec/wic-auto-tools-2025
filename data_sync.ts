// data_sync.ts — 외부/레포 동기화
import { registerTick, setProgress } from "./ops_status.ts";

const SYNC_LOOP = (Deno.env.get("SYNC_LOOP") ?? "").toLowerCase() === "true";
const EVERY_MS = Number(Deno.env.get("SYNC_MS") ?? 1000 * 60 * 5); // 5m
const PROBE = Deno.env.get("SYNC_PROBE_URL")
  ?? "https://raw.githubusercontent.com/obk369369-spec/wic-auto-tools-2025/main/README.md";

let lastEtag: string | null = null;

export async function syncOnce() {
  try {
    setProgress("SYNC", 10, "probe");
    const t0 = performance.now();
    const res = await fetch(PROBE, { method: "GET" });
    const dt = performance.now() - t0;

    const etag = res.headers.get("etag");
    const changed = etag && etag !== lastEtag;
    if (changed) lastEtag = etag;

    registerTick("SYNC", { progress: changed ? 100 : 80, ok: res.ok, note: changed ? "upstream changed" : "no change" });
    console.log(`[SYNC] ${res.status} (+${dt.toFixed(0)}ms) changed=${!!changed}`);
    setTimeout(() => setProgress("SYNC", 0, "idle"), 500);
  } catch (e) {
    registerTick("SYNC", { ok: false, note: String(e) });
    console.log("[SYNC] error:", e);
  }
}
if (SYNC_LOOP) { syncOnce().catch(()=>{}); setInterval(syncOnce, EVERY_MS); }
else console.log("[SYNC] disabled");
