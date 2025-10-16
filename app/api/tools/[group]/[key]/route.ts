import { NextResponse } from "next/server";
export const runtime = "edge";

type Ctx = { params: { group: string; key: string } };

export async function GET(_req: Request, ctx: Ctx) {
  const { group, key } = ctx.params;
  return NextResponse.json({ ok: true, group, key, note: "stub" });
}
