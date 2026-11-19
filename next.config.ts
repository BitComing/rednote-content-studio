import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd()),
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
