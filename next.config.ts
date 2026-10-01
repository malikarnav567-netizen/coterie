import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Dev origin guard: the app is reached as both localhost and 127.0.0.1.
  // Entries are bare hostnames (no port, no protocol).
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  // The self-contained Node runtime lives in .tools/ — keep it out of the watcher.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
