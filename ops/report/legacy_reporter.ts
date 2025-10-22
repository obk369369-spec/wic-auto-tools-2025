// /ops/report/legacy_reporter.ts
// 과거 보고 모듈 자리. 중복 방지를 위해 실행 즉시 종료하도록 유지.
if (import.meta.main) {
console.log("[LEGACY-REPORTER] disabled. Use /ops/report/report_loop_upload.ts");
Deno.exit(0);
}
