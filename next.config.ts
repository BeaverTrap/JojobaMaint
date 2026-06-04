import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow images served from Supabase Storage (public buckets).
    // The hostname looks like: <project-ref>.supabase.co
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
