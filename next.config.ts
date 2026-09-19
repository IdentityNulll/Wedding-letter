import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    // Uploads are written to disk; allow reasonably large wedding photos.
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
