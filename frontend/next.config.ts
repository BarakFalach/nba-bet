import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.nba.com',
        pathname: '/headshots/nba/latest/1040x760/**',
      },
    ],
  },
};

export default nextConfig;
