// =============================
// File: data_sync.ts
// =============================
const SYNC_LOOP = (Deno.env.get("SYNC_LOOP") ?? "").toLowerCase() === "true";

if (SYNC_LOOP) {
  const RAW = Deno.env.get("SYNC_PROBE_URL") ||
    "https://raw.githubusercontent.com/obk369369-spec/wic-auto-tools-2025/main/README.md";
  let lastEtag: string | null = null;

  async function syncOnce() {
    const res = await fetch(RAW);
    const etag = res.headers.get("etag");
    if (etag && etag !== lastEtag) {
      lastEtag = etag;
      console.log("[SYNC] upstream changed → redeploy recommended");
    } else {
      console.log("[SYNC] no change");
    }
  }

  syncOnce().catch(() => {});
  setInterval(syncOnce, 1000 * 60 * 60);
}
