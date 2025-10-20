console.log("[RECOVER] recovery standby");

export async function recover() {
  console.log("[RECOVER] checking recovery point");
  await new Promise((r) => setTimeout(r, 10_000));
  console.log("[RECOVER] recovery complete");
}

recover();
