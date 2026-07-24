import path from "path";
import type { NextConfig } from "next";

// Root thật của monorepo (frontend/) — cần thiết để Next.js/Turbopack resolve đúng
// package dùng chung "@orderchina/ui" (nằm ngoài thư mục app này) và trace file chuẩn
// khi build standalone cho Docker.
const workspaceRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
  transpilePackages: ["@orderchina/ui"],
  // App được Nginx expose dưới "orderchina.com/admin" (1 domain chung với customer-web, tách theo path
  // thay vì subdomain) — basePath khiến Next.js tự thêm prefix "/admin" cho mọi route/asset nội bộ.
  basePath: "/admin",
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
