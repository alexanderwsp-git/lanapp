import path from "node:path"
import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
// dev restart trigger: ensure NEXT_PUBLIC_* env vars are inlined from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(__dirname, "..")

const lanappUrl = process.env.LANAPP_SERVICE_URL || "http://localhost:4001"

const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ["@sheep/domain"],
  serverExternalPackages: [
    "@aws-sdk/client-cognito-identity-provider",
    "@aws-sdk/credential-providers",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@sheep/domain": path.resolve(monorepoRoot, "packages/domain"),
    }
    return config
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/lanapp/:path*",
        destination: `${lanappUrl}/api/v1/lanapp/:path*`,
      },
    ]
  },
}

export default nextConfig
