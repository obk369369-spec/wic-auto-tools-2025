+ const SLOW_ETA_SEC = Number(Deno.env.get("SLOW_ETA_SEC") ?? 900);
 export function toolStatus(name: Group) {
   const s = registry[name];
   if (!s) return null;
   const now = Date.now();
   const etaSec = s.lastTick ? Math.max(0, Math.floor((s.lastTick + s.intervalMs - now) / 1000)) : null;
+  const stalenessSec = s.lastTick ? Math.floor((now - s.lastTick) / 1000) : null;
+  const isSlow = etaSec !== null && etaSec > SLOW_ETA_SEC;
   return {
     name: s.name,
     status: s.status,
     progress: s.progress,
     lastTickIso: s.lastTick ? new Date(s.lastTick).toISOString() : null,
     intervalMs: s.intervalMs,
     etaSec,
+    stalenessSec,
+    isSlow,
     note: s.notes ?? null,
   };
 }
