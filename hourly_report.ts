console.log("[REPORT] loop running");

const base = "https://wic-auto-tools-2025.obk369369-spec.deno.net";

async function reportTick() {
  console.log("[REPORT] tick start");
  try {
    await fetch(`${base}/ops?action=status`)
      .then((r) => r.json())
      .then((j) => console.log("[REPORT] group status", j));
  } catch {
    console.log("[REPORT] group status check failed");
  }
  console.log("[REPORT] tick end");
}

async function loop() {
  while (true) {
    await reportTick();
    await new Promise((r) => setTimeout(r, 3600_000)); // 1시간마다
  }
}

loop();
