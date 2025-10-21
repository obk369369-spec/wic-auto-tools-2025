// =====================================
// File: ops_group_eta.ts
// =====================================
import { snapshot } from "./ops_status.ts";

export async function groupETA() {
  const snap = snapshot();
  const groups = Object.entries(snap);
  const result = groups.map(([group, s]: any) => ({
    group,
    avgProgress: s.progress ?? 0,
    avgETA: s.intervalMs ? Math.round(s.intervalMs / 1000) : 0,
  }));
  return result;
}
