// main.ts
// WIC: report export + bootstrap/update endpoints
// Deno / Deno Deploy friendly — fallback storage if openKv unavailable

import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

type ExportData = {
  ts: string;
  tz: string;
  iso: string;
  groups: {
    active: number;
    standby: number;
    blocked: number;
    avg_progress: number;
  };
  tools?: Array<Record<string, unknown>>;
  msg?: string;
};

const HOST_CANONICAL = Deno.env.get("CANONICAL_HOST") || "wic-auto-tools-2025.obk369369-spec.deno.net";
const EXPORT_PATH = "/export/latest.json";
const EXPORT_FILE = "./export_latest_cache.json";

let inMemoryCache: ExportData | null = null;
let lastUpdated = 0;

async function writeCacheFile(obj: ExportData) {
  try {
    await Deno.mkdir("./.export_cache", { recursive: true });
    await Deno.writeTextFile(EXPORT_FILE, JSON.stringify(obj, null, 2));
  } catch (e) {
    console.warn("writeCacheFile failed:", e);
  }
}

async function loadCacheFile(): Promise<ExportData | null> {
  try {
    const txt = await Deno.readTextFile(EXPORT_FILE);
    return JSON.parse(txt) as ExportData;
  } catch {
    return null;
  }
}

function nowKSTIso() {
  const d = new Date();
  const iso = d.toISOString();
  return { iso, tz: "Asia/Seoul", ts: Math.floor(d.getTime() / 1000) };
}

async function buildExportSnapshot(reason = "scheduled") {
  // Build a conservative snapshot based on current logs / progress sources.
  // In absence of external telemetry, produce a health snapshot that real workers will replace.
  const { iso, tz, ts } = nowKSTIso();
  const snapshot: ExportData = {
    ts: new Date().toISOString(),
    tz,
    iso,
    groups: {
      active: 0,
      standby: 0,
      blocked: 0,
      avg_progress: 0,
    },
    tools: [],
    msg: `auto-snapshot (${reason})`,
  };

  // If you have a real in-process progress collector, merge here.
  // Minimal placeholder to avoid 404 and ensure JSON exists.
  inMemoryCache = snapshot;
  await writeCacheFile(snapshot);
  lastUpdated = Date.now();
  return snapshot;
}

async function ensureCache() {
  if (inMemoryCache && (Date.now() - lastUpdated) < 90 * 60 * 1000) return inMemoryCache;
  const fileCache = await loadCacheFile();
  if (fileCache) {
    inMemoryCache = fileCache;
    lastUpdated = Date.now();
    return inMemoryCache;
  }
  return await buildExportSnapshot("bootstrap-fallback");
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  if (req.method === "POST" && pathname === "/ops/bootstrap") {
    // bootstrap: create initial snapshot and mark ready
    const snapshot = await buildExportSnapshot("bootstrap");
    return new Response(JSON.stringify({ ok: true, msg: "bootstrapped", snapshot }, null, 2), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "POST" && pathname === "/ops/update") {
    // update: merge payload (if any) into cache and write file
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }

    const base = await ensureCache();
    const merged: ExportData = {
      ...base,
      ts: new Date().toISOString(),
      msg: `update merged`,
      tools: base.tools,
      groups: {
        ...base.groups,
        ...(payload.groups || {}),
      },
    };

    // allow payload to provide per-tool progress updates
    if (payload.tools && Array.isArray(payload.tools)) {
      merged.tools = payload.tools;
      // recompute averages quickly
      const progresses = payload.tools
        .map((t: any) => (typeof t.progress === "number" ? t.progress : NaN))
        .filter((v: number) => !Number.isNaN(v));
      if (progresses.length > 0) {
        merged.groups.avg_progress = Math.round(progresses.reduce((a: number, b: number) => a + b, 0) / progresses.length);
      }
      merged.groups.active = payload.groups?.active ?? merged.groups.active;
      merged.groups.standby = payload.groups?.standby ?? merged.groups.standby;
      merged.groups.blocked = payload.groups?.blocked ?? merged.groups.blocked;
    }

    inMemoryCache = merged;
    await writeCacheFile(merged);
    lastUpdated = Date.now();
    return new Response(JSON.stringify({ ok: true, merged }, null, 2), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "GET" && pathname === EXPORT_PATH) {
    const cache = await ensureCache();
    // if data older than 90 minutes, mark stale (consumer can interpret)
    const ageMs = Date.now() - lastUpdated;
    const ageMin = Math.round(ageMs / 60000);
    const body = {
      ...cache,
      meta: { generated_at: new Date().toISOString(), age_min: ageMin },
    };
    return new Response(JSON.stringify(body, null, 2), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "GET" && pathname === "/ops/health") {
    return new Response(JSON.stringify({ ok: true, status: "healthy", ts: new Date().toISOString() }, null, 2), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "GET" && pathname === "/ops/logs") {
    // simple listing: read cache file
    const file = await loadCacheFile();
    return new Response(JSON.stringify({ ok: true, cache: file }, null, 2), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response("Not Found", { status: 404 });
}

console.log(`starting WIC small server — canonical host ${HOST_CANONICAL}`);
serve(handleRequest, { port: 8000 });
