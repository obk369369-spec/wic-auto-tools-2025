/**
 * fix-imports.mjs
 * 빌드 전에 @, @lib 별칭을 상대경로로 자동 변환
 */
import fs from "fs";
import path from "path";

const repoRoot = process.cwd();
const SRC_DIRS = ["app", "lib"]; // 필요시 추가

const isCode = (p) => /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(p);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (isCode(p)) out.push(p);
  }
  return out;
}

function toRelative(fromFile, target) {
  // target은 'lib/xxx' 또는 'app/xxx' 같은 형태
  const fromDir = path.dirname(fromFile);
  const abs = path.join(repoRoot, target);
  let rel = path.relative(fromDir, abs).replace(/\\/g, "/");
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel;
}

function fixFile(file) {
  let src = fs.readFileSync(file, "utf8");
  let changed = false;

  // @lib/aaaa → ../../lib/aaaa
  src = src.replace(/from\s+["']@lib\/([^"']+)["']/g, (m, sub) => {
    changed = true;
    return `from "${toRelative(file, "lib/" + sub)}"`;
  });

  // @/lib/aaaa 또는 @/app/aaaa → 상대경로
  src = src.replace(/from\s+["']@\/(lib|app)\/([^"']+)["']/g, (m, root, sub) => {
    changed = true;
    return `from "${toRelative(file, `${root}/${sub}`)}"`;
  });

  if (changed) fs.writeFileSync(file, src);
  return changed;
}

let files = [];
for (const d of SRC_DIRS) {
  const p = path.join(repoRoot, d);
  if (fs.existsSync(p)) files = files.concat(walk(p));
}

let count = 0;
for (const f of files) if (fixFile(f)) count++;
console.log(`[fix-imports] updated files: ${count}`);
