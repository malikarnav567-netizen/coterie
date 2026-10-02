import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Dev origin guard: the app is reached as localhost, 127.0.0.1, and — for
  // reviewing on a phone over the home Wi-Fi — the machine's LAN address.
  // Entries are bare hostnames (no port, no protocol).
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.0.100"],
  // The self-contained Node runtime lives in .tools/ — keep it out of the watcher.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
