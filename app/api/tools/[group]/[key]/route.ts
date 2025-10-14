// app/api/tools/[group]/[key]/route.ts
import { NextResponse } from 'next/server';

type Params = { params: { group: string; key: string } };

export async function GET(_req: Request, { params }: Params) {
  const { group, key } = params;

  if (key === 'scrape') {
    // 🔧 절대별칭(@/..) 금지 — 루트의 lib/scraping.ts로 5단계 위로 올라감
    const { scrapeData } = await import('../../../../../lib/scraping');
    const data = await scrapeData();
    return NextResponse.json({ ok: true, group, key, data });
  }

  return NextResponse.json(
    { ok: false, error: 'unknown key', group, key },
    { status: 400 }
  );
}
