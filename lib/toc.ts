// lib/toc.ts
export type TocItem = { id: string; title: string };

// 반드시 "export function buildTOC" 형태로 내보내야 함
export async function buildTOC(): Promise<TocItem[]> {
  // TODO: 실제 구현 연결. 지금은 동작 확인용 더미 데이터
  return [
    { id: "auto",   title: "AUTO tools"   },
    { id: "report", title: "REPORT tools" },
    { id: "sync",   title: "SYNC tools"   },
  ];
}
