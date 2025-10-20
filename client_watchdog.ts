console.log("[DOG] watchdog monitoring");

export async function watchdog() {
  while (true) {
    console.log("[DOG] heartbeat check");
    await new Promise((r) => setTimeout(r, 900_000)); // 15분
  }
}

watchdog();
