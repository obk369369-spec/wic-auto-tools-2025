import { NextResponse } from "next/server";

// 0) 로컬 인라인 레지스트리 (추가만 하면 130종까지 확대)
type Tool = { group: string; key: string; enabled?: boolean };
const registry: Tool[] = [
  { group: "core", key: "health", enabled: true },
  // TODO: 여기 아래로 { group: "...", key: "..." } 항목을 계속 추가
];

// 1) 각 도구 실행 (지금은 플레이스홀더; 실제 구현 붙일 때 이 함수만 바꾸면 됨)
async function runTool(t: Tool) {
  // 네트워크/파일 접근 없이 바로 통과: 빌드 안전
  return { ok: true, note: `ran ${t.group}/${t.key}` };
}

// 2) API 핸들러: 시뮬레이션/실행/리포트 고정 체크리스트
export async function GET() {
  const ran: string[] = [];
  const errors: string[] = [];
  const evidence: string[] = [];

  for (const t of registry) {
    try {
      const r = await runTool(t);
      ran.push(`${t.group}/${t.key}`);
      if (r?.note) evidence.push(r.note);
    } catch (e: any) {
      errors.push(`${t.group}/${t.key}: ${e?.message ?? String(e)}`);
    }
  }

  return NextResponse.json({
    ok: errors.length === 0,
    ran,                      // 1) what ran
    errors,                   // 2) errors
    evidence,                 // 3) evidence links/files (지금은 메모)
    next: "append 3 tools in registry and re-run", // 4) next one small step
    blocker: errors.length ? "investigate first failing tool" : null, // 5) blocker
  });
}
