// 상위/하위 2단계만 유지, 번호/로마자/알파벳/원형숫자/불릿 보존
export function normalizeTOC(input: string): string {
  const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];

  // 번호/기호 토큰 캡처 (너무 과하게 복잡하지 않게, 안정 우선)
  const tokenRe = new RegExp(
    String.raw`^((?:\d+(?:\.\d+)*)|[IVXLCM]+|[A-Z]|[①-⑳]|[•\-\*])(?:[\.\)])?\s+`,
    "i",
  );

  for (const raw of lines) {
    let line = raw;
    let token = "";
    let level: 1 | 2 = 1;

    const m = line.match(tokenRe);
    if (m) {
      token = m[0].trim();
      line = line.replace(tokenRe, "").trim();

      // "1.2.3" 같이 점 개수로 레벨 추정
      const numDots = (m[1].match(/\./g) || []).length;
      level = numDots >= 1 ? 2 : 1;

      // 불릿/알파벳/원형 숫자는 보통 하위로 취급
      if (/^[A-Z]|^[①-⑳]|^[•\-\*]/.test(m[1])) level = 2;
    } else {
      // 들여쓰기/불릿 힌트
      if (/^[-•\*]\s+/.test(line)) {
        line = line.replace(/^[-•\*]\s+/, "");
        level = 2;
      } else {
        level = 1;
      }
    }

    // 3단계 이상처럼 보이는 복잡 패턴은 잘라냄(보수적으로 2단계 제한)
    if (/^\d+\.\d+\.\d+/.test(raw)) continue;

    const label = token ? `${token} ${line}`.replace(/\s+/g, " ").trim() : line;
    out.push(level === 1 ? label : `  ${label}`); // 하위 2칸 들여쓰기
  }

  // 연속 공백 줄 제거
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
