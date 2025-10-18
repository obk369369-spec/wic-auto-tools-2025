// no imports
export async function GET() {
  return new Response(JSON.stringify({ ok: true, report: "hourly placeholder" }), {
    headers: { "content-type": "application/json" },
  });
}
