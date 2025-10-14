// app/api/tools/[group]/[key]/route.ts
import { NextResponse } from "next/server";
import { scrapeData } from "../../_bridge/scraping"; // ✅ 깊은 경로 금지

export async function GET(
  _req: Request,
  { params }: { params: { group: string; key: string } }
) {
  const { group, key } = params;

  let data: unknown = null;
  if (group === "demo" && key === "scrape") {
    data = await scrapeData();
  }

  return NextResponse.json({ ok: true, group, key, data });
}
