// =====================================
// File: main.ts  (REPLACE)
// 역할: HTTP 라우팅(/ops/*, /health, /evidence) + AUTO 루프 기동
// =====================================

import { buildTOC } from "./lib/toc.ts";
import { handleOps } from "./ops.ts";
import { initAutoLoop } from "./auto_loop.ts"; // ✅ AUTO 루프 함수

// 부트 타임스탬프
const startedAt = new Date();

// 백그라운드 AUTO 루프 시작(논블로킹)
initAutoLoop();

// 공용 헬퍼
function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json; charset=utf-8", ...(init.headers ?? {}) },
  });
}

// 서버
Deno.serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const { pathname } = url;

  // 1) 운용/진행 라우트 (/ops/progress, /ops/eta)
  if (pathname.startsWith("/ops/")) {
    return handleOps(req);
  }

  // 2) 헬스체크
  if (pathname === "/health") {
    return json({
      status: "ok",
      service: "wic-auto-tools-2025",
      time: new Date().toISOString(),
    });
  }

  // 3) 실행 증거(가동시간/커밋 등)
  if (pathname === "/evidence") {
    const now = new Date();
    const uptimeSec = Math.floor((+now - +startedAt) / 1000);

    // 환경변수에서 커밋/브랜치 주입 가능(없으면 null)
    const commit = Deno.env.get("GIT_COMMIT") ?? null;
    const branch = Deno.env.get("GIT_BRANCH") ?? null;

    return json({
      startedAt: startedAt.toISOString(),
      now: now.toISOString(),
      uptimeSec,
      commit,
      branch,
    });
  }

  // 4) TOC(기존 기능 유지, 필요 시 /lib/toc.ts 사용)
  if (pathname === "/toc") {
    try {
      const html = await buildTOC();
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    } catch (e) {
      return json({ ok: false, error: (e && e.message) || String(e) }, { status: 500 });
    }
  }

  // 5) 루트/정적(간단 인덱스)
  if (pathname === "/" || pathname === "/index.html") {
    try {
      const html = await Deno.readTextFile("./static/index.html");
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    } catch {
      // static 이 없으면 간단 기본 페이지
      return new Response(
        `<!doctype html><meta charset="utf-8"><title>WIC Tools</title><h1>WIC Auto Tools 2025</h1>`,
        { headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
  }

  // 6) 그 외
  return new Response("Not Found", { status: 404 });
});
