import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/galleries", destination: "/", permanent: true },
      { source: "/galleries/:path*", destination: "/", permanent: true },
      { source: "/admin/galleries", destination: "/admin", permanent: false },
      { source: "/admin/galleries/:path*", destination: "/admin", permanent: false },
    ];
  },
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
