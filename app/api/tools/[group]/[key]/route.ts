// app/api/tools/[group]/[key]/route.ts
import { NextResponse } from 'next/server';

type Params = { params: { group: string; key: string } };

export async function GET(_req: Request, { params }: Params) {
  const { group, key } = params;

  if (key === 'scrape') {
    // 별칭(@lib) 없이 상대경로로 로드
    const { scrapeData } = await import('../../../../lib/scraping');
    const data = await scrapeData();
    return NextResponse.json({ ok: true, group, key, data });
  }

  return NextResponse.json(
    { ok: false, error: 'unknown key', group, key },
    { status: 400 }
  );
}
