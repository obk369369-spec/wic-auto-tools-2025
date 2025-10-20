// lib/toc.ts
// 최소 동작 버전: /toc 응답용

export async function buildTOC() {
  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    items: [], // 필요 시 여기에 파일/모듈 목록을 채우면 됨
  };
}

// (선택) default export도 제공해두면 호환 좋음
export default buildTOC;
