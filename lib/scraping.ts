import * as cheerio from "cheerio";

export async function fetchHtml(url: string) {
  const r = await fetch(url, { headers: { "user-agent":"WIC-Tool/1.0" } });
  if (!r.ok) throw new Error(`HTTP_${r.status}`);
  return await r.text();
}

export function extractLeads(html: string) {
  const $ = cheerio.load(html);
  $("script,style,noscript").remove();
  const text = $("body").text().replace(/\s+/g," ").toLowerCase();
  const emails = Array.from(new Set((text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g) || [])));
  const phones = Array.from(new Set((text.match(/\+?\d[\d\s().-]{7,}\d/g) || [])));
  const signals = (text.match(/\b(grant|funding|rfp|tender|proposal|sbir|nih|nsf|horizon)\b/g) || []);
  return { emails, phones, signals };
}
