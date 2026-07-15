import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify: no `output: "standalone"` — the @netlify/plugin-nextjs handles
  // SSR (On-Demand Builders) + API routes (Netlify Functions) automatically.
  typescript: {
    // Don't fail the build on type errors — runtime is already verified.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Lint is run separately in CI; don't block the production build.
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false,
  // Allow the preview sandbox origin to hot-reload (dev only, harmless in prod).
  allowedDevOrigins: ["*.space-z.ai"],
};

export default nextConfig;
