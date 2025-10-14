import { mkdirSync, writeFileSync, existsSync } from "fs";
import { dirname } from "path";

// 안전하게 폴더/파일 만들기
function ensureFile(filePath, content) {
  const dir = dirname(filePath);
  mkdirSync(dir, { recursive: true });
  if (!existsSync(filePath)) {
    writeFileSync(filePath, content, "utf8");
    console.log("[prebuild] created:", filePath);
  }
}

// app/layout.tsx 자동 생성
ensureFile(
  "app/layout.tsx",
  `export const metadata = { title: "wic-auto-tools-2025", description: "Auto layout" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "system-ui, Apple SD Gothic Neo, Segoe UI, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
`
);

// app/page.tsx 자동 생성
ensureFile(
  "app/page.tsx",
  `export default function Page() {
  return (
    <main style={{ padding: 20 }}>
      <h1>wic-auto-tools-2025</h1>
      <p>자동 프리빌드가 동작했습니다. (app/layout.tsx / app/page.tsx)</p>
    </main>
  );
}
`
);

// tsconfig.json 자동 생성
ensureFile(
  "tsconfig.json",
  `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "jsx": "preserve",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "baseUrl": "."
  },
  "include": ["."]
}
`
);

// next.config.mjs 자동 생성
ensureFile(
  "next.config.mjs",
  `/** @type {import('next').NextConfig} */
const nextConfig = { experimental: { typedRoutes: false } };
export default nextConfig;
`
);

console.log("[prebuild] ensured: layout.tsx, page.tsx, tsconfig.json, next.config.mjs");
