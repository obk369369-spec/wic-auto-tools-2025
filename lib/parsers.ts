export type TocLine = { raw: string; number?: string; text: string; level: 1|2 };

const NUM_RE = /^\s*(\d+(?:\.\d+)*|\([0-9]+\)|[IVXLCM]+\.?)\s*[-.)]?\s*/i;

export function parseToc(input: string) {
  const lines = input.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
  const out: TocLine[] = [];
  for (const raw of lines) {
    let level: 1|2 = 1;
    let work = raw;
    let number: string|undefined;
    const m = work.match(NUM_RE);
    if (m) { number = m[1]; work = work.replace(m[0], "").trim(); }
    if (!m && /^\s{2,}/.test(raw)) level = 2;
    if (/^[-–•]\s+/.test(raw)) level = 2;
    if (/^\d+\.\d+\.\d+/.test(raw)) continue;
    out.push({ raw, number, text: work, level });
  }
  return out;
}

export function formatTwoLevels(lines: TocLine[]) {
  return lines
    .filter(l => l.level === 1 || l.level === 2)
    .map(l => {
      const label = l.number ? `${l.number} ${l.text}` : l.text;
      return (l.level === 1 ? `${label}` : `  ${label}`);
    }).join("\n");
}
