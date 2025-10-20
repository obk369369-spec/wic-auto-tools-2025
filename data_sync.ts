console.log("[SYNC] data sync active");

export async function syncData() {
  console.log("[SYNC] syncing data...");
  await new Promise((r) => setTimeout(r, 5000));
  console.log("[SYNC] done");
}

syncData();
