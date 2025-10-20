// =====================
// DATA SYNC MODULE
// =====================
export async function syncData() {
  console.log("[SYNC] data sync active");
  try {
    await new Promise((r) => setTimeout(r, 5000));
    console.log("[SYNC] done");
  } catch (e) {
    console.log("[SYNC] error:", e);
  }
}
