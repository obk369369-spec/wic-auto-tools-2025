console.log("[AUTO] loop started");

export async function autoLoop() {
  while (true) {
    console.log("[AUTO] running...");
    await new Promise((r) => setTimeout(r, 3600_000)); // 1시간 루프
  }
}

autoLoop();
