// no imports
export async function GET(_: Request, { params }: { params: { group: string; key: string } }) {
  return new Response(JSON.stringify({ ok: true, group: params.group, key: params.key }), {
    headers: { "content-type": "application/json" },
  });
}
