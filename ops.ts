// ops.ts — WIC 공용 연산 처리 모듈 (v2025.10.22-stable)

export async function handleOps(request: Request): Promise<Response> {
  try {
    const { pathname } = new URL(request.url);

    // 경로별 처리
    if (pathname === "/ops/progress") {
      return new Response(
        JSON.stringify({
          ok: true,
          route: "/ops/progress",
          message: "progress route active",
          timestamp: new Date().toISOString()
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (pathname === "/ops/eta") {
      return new Response(
        JSON.stringify({
          ok: true,
          route: "/ops/eta",
          eta_check: "ready",
          timestamp: new Date().toISOString()
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (pathname === "/ops/health") {
      return new Response(
        JSON.stringify({
          ok: true,
          route: "/ops/health",
          status: "healthy",
          uptime: `${typeof process !== "undefined" && process.uptime ? process.uptime() : "n/a"}s`,
          timestamp: new Date().toISOString()
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 기본 응답
    return new Response(
      JSON.stringify({
        ok: true,
        route: pathname,
        info: "Default route from handleOps()"
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: String(e)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
