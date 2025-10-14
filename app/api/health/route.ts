export async function GET() {
  return new Response(
    JSON.stringify({ ok: true, status: "healthy" }),
    {
      headers: {
        "content-type": "application/json",
      },
    }
  );
}
