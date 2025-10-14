// app/api/tools/[group]/[key]/route.ts
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { group: string; key: string } }
) {
  const { group, key } = params;

  // ⚠️ 별칭(@) 금지. 상대경로 5단계 업으로 lib/scraping 가져오기
  const { scrapeData } = await import("../../../../../lib/scraping");

  let data: any = null;

  if (group === "demo" && key === "scrape") {
    data = await scrapeData();
  }

  return NextResponse.json({ ok: true, group, key, data });
}
