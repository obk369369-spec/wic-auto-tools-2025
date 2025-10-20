// ops_group_eta.ts
import { snapshot } from "./ops_status.ts";

export async function groupETA() {
  const snap = snapshot();
  const groups = snap.reduce((acc, s) => {
    const group = s.name.split("_")[0]; // AUTO, SYNC 등 그룹 단위 추출
    acc[group] = acc[group] || { count: 0, sumETA: 0, sumProgress: 0 };
    acc[group].count++;
    acc[group].sumETA += s.etaSec || 0;
    acc[group].sumProgress += s.progress || 0;
    return acc;
  }, {});

  return Object.keys(groups).map((g) => (
    group: g,
    avgProgress: Math.round(groups[g].sumProgress / groups[g].count),
    avgETA: Math.round(groups[g].sumETA / groups[g].count),
  }));
}

export default groupETA;
