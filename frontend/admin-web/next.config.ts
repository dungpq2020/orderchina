import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // App được Nginx expose dưới "orderchina.com/admin" (1 domain chung với customer-web, tách theo path
  // thay vì subdomain) — basePath khiến Next.js tự thêm prefix "/admin" cho mọi route/asset nội bộ.
  basePath: "/admin",
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
