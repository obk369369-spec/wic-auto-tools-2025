// /lib/report.ts
export function isStale90m(obj: any): boolean {
  const ts = typeof obj?.ts === "number" ? obj.ts : 0;
  if (!ts) return true;
  return (Date.now() - ts) > 90 * 60 * 1000;
}

type Tool = {
  name_kr: string;
  progress: number;
  eta_min: number|null;
  status: "active"|"standby"|"blocked"|"done"|"error";
  self_heal: string;
  links?: { progress?: string; eta?: string; logs?: string; health?: string; };
  group?: string;
};

export async function generateCompact(raw: any, origin: string) {
  const tools: Tool[] = Array.isArray(raw?.tools) ? raw.tools : [];
  const ts = typeof raw?.ts === "number" ? raw.ts : 0;

  const rows = tools.map(t => ({
    "도구명(한글)": t.name_kr ?? "-",
    "진행률(%)": Math.round(Number(t.progress ?? 0)),
    "ETA(분)": t.eta_min ?? null,
    "상태": t.status ?? "-",
    "자가치유": t.self_heal ?? "-",
    "링크": {
      progress: t.links?.progress ?? `${origin}/ops/progress`,
      eta:      t.links?.eta      ?? `${origin}/ops/eta`,
      logs:     t.links?.logs     ?? `${origin}/ops/logs`,
      health:   t.links?.health   ?? `${origin}/ops/health`,
    },
    "그룹": t.group ?? "misc",
  }));

  const groups = new Map<string, { cnt:number; active:number; standby:number; blocked:number; done:number; sumProgress:number }>();
  for (const r of rows) {
    const g = r["그룹"];
    if (!groups.has(g)) groups.set(g, { cnt:0, active:0, standby:0, blocked:0, done:0, sumProgress:0 });
    const acc = groups.get(g)!;
    acc.cnt++;
    acc.sumProgress += Number(r["진행률(%)"]) || 0;
    if (r["상태"] === "active") acc.active++;
    else if (r["상태"] === "standby") acc.standby++;
    else if (r["상태"] === "blocked") acc.blocked++;
    else if (r["상태"] === "done") acc.done++;
  }
  const group_summaries = [...groups.entries()].map(([name, v]) => ({
    group: name, active: v.active, standby: v.standby, blocked: v.blocked, done: v.done,
    avg_progress: v.cnt ? Math.round(v.sumProgress / v.cnt) : 0,
  }));

  const stalled = isStale90m({ ts });
  return {
    ok: true,
    ts,
    iso: ts ? new Date(ts).toISOString() : null,
    stalled,
    warn: stalled ? "데이터가 90분 이상 갱신되지 않았습니다. 파이프라인 정지(stalled) 가능성." : null,
    rows,
    group_summaries
  };
}
