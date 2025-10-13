import { NextResponse } from "next/server";
import { kv } from "@/lib/kv";
import registry from "@/tools.json";
export const runtime = "edge";

export async function GET() {
  const total = (registry as any).tools.length;
  const tested = Number(await kv.get("wic:test:count")) || 0;
  const passed = Number(await kv.get("wic:test:pass")) || 0;
  const progress = total ? Math.round((tested/total)*100) : 0;
  const passRate = tested ? Math.round((passed/tested)*100) : 0;
  const report = {
    totalTools: total,
    tested, passed,
    progressPercent: progress,
    passRatePercent: passRate,
    timestamp: new Date().toISOString()
  };
  await kv.set("wic:report:last", report);
  return NextResponse.json({ ok:true, report });
}
