import publishers from "./publishers_300.ts";

export type TocItem = {
  id: string;
  title: string;
  group: "v0" | "core" | "ext";
  link?: string;
};

export function buildV0Toc(): { items: TocItem[]; stats: any } {
  // v0 TOC 최소 셋: 헬스체크/증거로그/다음스텝
  const items: TocItem[] = [
    { id: "health", title: "Health Check", group: "v0", link: "/health" },
    { id: "evidence", title: "Evidence Logs", group: "v0", link: "/evidence" },
    { id: "next", title: "Next Small Step", group: "v0" },
  ];
  return {
    items,
    stats: {
      publishers: publishers.length,
      modules: items.length,
    },
  };
}
