// /ops/autodev_pipeline.ts — spec→generate→index→smoke→packs→bundle→export 순서 실행
async function run(cmd:string[]){ const p=new Deno.Command(cmd[0],{args:cmd.slice(1)}).spawn(); const s=await p.status; if(!s.success) throw new Error(cmd.join(' ')); }


if(import.meta.main){
await run(["deno","run","-A","/core/autodev.ts"]); // 스펙→코드생성
await run(["deno","run","-A","/tools/auto_loader.ts"]); // 인덱스/메타 병합
await run(["deno","run","-A","/ops/smoke_tests.ts"]); // 스모크 검사
await run(["deno","run","-A","/ops/build_packs.ts"]); // 팩 생성
await run(["deno","run","-A","/ops/build_artifacts.ts"]); // 릴리스 번들
await run(["deno","run","-A","/ops/export_latest.ts"]); // 최신 지표 export
}
