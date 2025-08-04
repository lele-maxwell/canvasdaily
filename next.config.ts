import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
  },
  compiler: {
    emotion: true,
  },
  swcMinify: true,
};

export default nextConfig;
