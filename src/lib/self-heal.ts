// /src/lib/self-heal.ts
// 목적: 필요 시 외부에서 직접 호출해 복구 단독 수행(옵션 엔드포인트에서 사용 가능)
export async function heal(origin: string) {
  const s1 = await fetch(`${origin}/ops/bootstrap`, { method: "POST" }).then(r => r.ok);
  const s2 = await fetch(`${origin}/ops/update`, { method: "POST" }).then(r => r.ok);
  return { ok: s1 && s2 };
}
