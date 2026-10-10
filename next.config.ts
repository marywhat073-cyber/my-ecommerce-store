import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['cursive-slush-crabgrass.ngrok-free.dev'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;