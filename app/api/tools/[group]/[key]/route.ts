import { NextRequest, NextResponse } from "next/server";
import registry from "@/tools.json";
export const runtime = "edge";

export async function POST(req: NextRequest, { params }: { params: { group: string, key: string }}) {
  const body = await req.json().catch(()=>({}));
  const def = (registry as any).tools.find((t:any)=> t.group===params.group && t.key===params.key);
  if (!def) return NextResponse.json({ ok:false, error:"UNKNOWN_TOOL" }, { status:404 });

  try {
    if (def.group === "toc") {
      const { parseToc, formatTwoLevels } = await import("@/lib/parsers");
      return NextResponse.json({ ok:true, output: formatTwoLevels(parseToc(body.toc||"")) });
    }
    if (def.group === "scrape") {
      const { fetchHtml, extractLeads } = await import("@/lib/scraping");
      const html = await fetchHtml(body.url);
      return NextResponse.json({ ok:true, ...extractLeads(html) });
    }
    if (def.group === "report") {
      return NextResponse.json({ ok:true, report: { status:"OK", timestamp: new Date().toISOString() } });
    }
    return NextResponse.json({ ok:false, error:"UNSUPPORTED" }, { status:400 });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e.message || "TOOL_FAIL" }, { status:500 });
  }
}
