// =====================
// CLIENT WATCHDOG
// =====================
export async function watchDog() {
  console.log("[DOG] monitoring heartbeat...");
  try {
    await fetch("https://wic-auto-tools-2025.obk369369-spec.deno.net/health");
    console.log("[DOG] ping ok");
  } catch (e) {
    console.log("[DOG] network issue:", e);
  }
}
