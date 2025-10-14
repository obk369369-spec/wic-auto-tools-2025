import { scrapeData } from '../../../lib/scraping';

export async function GET() {
  const data = await scrapeData();

  return new Response(
    JSON.stringify({
      ok: true,
      source: 'wic-auto-tools-2025',
      status: 'healthy',
      result: data
    }),
    {
      headers: { 'content-type': 'application/json' },
    }
  );
}
