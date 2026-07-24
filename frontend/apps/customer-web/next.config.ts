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
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
