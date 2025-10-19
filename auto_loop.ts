setInterval(async () => {
  await fetch("https://wic-auto-tools-2025.obk369369-spec.deno.net/health");
  console.log(`[AUTO] Health check complete at ${new Date().toISOString()}`);
}, 1000 * 60 * 60); // 1시간마다 실행
