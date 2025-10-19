# WIC Deno Tools (v0: TOC Normalizer + Health)

**알리아스(별칭) 없음 / 외부 라이브러리 없음 / Deno Deploy 1클릭 배포용.**

## 로컬 테스트
1) Deno 설치 후:
   deno run -A main.ts
2) 브라우저에서: http://localhost:8000
   - /           : 테스트 UI
   - /health     : 상태 확인(JSON)
   - /api/toc/normalize (POST { "text": "..." })

## Deno Deploy 배포
1) GitHub에 이 리포를 올림
2) https://dash.deno.com → New Project → Connect to GitHub → 이 리포 선택
3) Entrypoint: `main.ts` 확인 → Deploy

## 엔드포인트
- GET  /health → { ok: true, service: "wic-deno-tools", timestamp: ... }
- POST /api/toc/normalize → { ok: true, output: "정규화 결과" }
- GET  /            → 간단한 UI 페이지

## 주의
- import alias(별칭) 미사용
- 외부 네트워크/DB 미사용 (무료 한도에서 안전)
