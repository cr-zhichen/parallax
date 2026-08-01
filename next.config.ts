import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["**.*"],
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  transpilePackages: ["echarts", "zrender"],
};

export default nextConfig;
