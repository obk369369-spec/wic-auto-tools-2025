// tools/prebuild.mjs
// ───────────────────────────────────────────────
// ✅ 목적: 빌드 전 자동 교정(self-heal) 루프
// 1) 필수 설정 파일(Next, Vercel, Package.json) 자동 점검
// 2) HTML-only 구조 감지 → Next.js app router 구조로 교정
// 3) 누락된 설정/폴더 자동 생성
// 4) 로그 출력으로 디버그 용이
// ───────────────────────────────────────────────

import fs from "fs";
import path from "path";

// 점검 대상 파일
const essentialFiles = ["next.config.js", "vercel.json", "package.json"];

// ✅ 1. 필수 파일 존재 확인 및 자동 생성
essentialFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "{}", "utf-8");
    console.log(`🆕 Created missing file: ${file}`);
  }
});

// ✅ 2. package.json 보정: HTML-only → Next.js app router
const pkgPath = path.resolve("package.json");
const pkgData = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

pkgData.scripts = pkgData.scripts || {};
pkgData.scripts.build = "next build";
pkgData.scripts.dev = "next dev";
pkgData.scripts.start = "next start";

pkgData.dependencies = pkgData.dependencies || {};
pkgData.dependencies.next = pkgData.dependencies.next || "14.2.12";
pkgData.dependencies.react = pkgData.dependencies.react || "18.3.1";
pkgData.dependencies["react-dom"] = pkgData.dependencies["react-dom"] || "18.3.1";

fs.writeFileSync(pkgPath, JSON.stringify(pkgData, null, 2), "utf-8");
console.log("🧩 package.json updated successfully");

// ✅ 3. vercel.json 보정: 빌드 명령 자동화 삽입
const vercelPath = path.resolve("vercel.json");
let vercelConfig = {};

try {
  vercelConfig = JSON.parse(fs.readFileSync(vercelPath, "utf-8"));
} catch {
  vercelConfig = {};
}

vercelConfig.buildCommand = "node tools/prebuild.mjs && npm run build";
vercelConfig.installCommand = "npm install";
vercelConfig.framework = "nextjs";

fs.writeFileSync(vercelPath, JSON.stringify(vercelConfig, null, 2), "utf-8");
console.log("🔧 vercel.json updated successfully");

// ✅ 4. app 디렉터리 자동 생성 (Next.js App Router 구조)
const appDir = path.resolve("app");
if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir);
  fs.writeFileSync(path.join(appDir, "page.tsx"), "export default function Page(){return <h1>WIC Auto Tools v0</h1>}", "utf-8");
  console.log("📁 Created Next.js app router base structure");
}

// ✅ 5. 완료 로그
console.log("✅ Prebuild self-heal process completed successfully.");
