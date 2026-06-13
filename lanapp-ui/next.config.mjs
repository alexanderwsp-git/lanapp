/** @type {import('next').NextConfig} */
const lanappUrl = process.env.LANAPP_SERVICE_URL || "http://localhost:4001"
const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:4000"

const nextConfig = {
  transpilePackages: ["@sheep/domain"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/lanapp/:path*",
        destination: `${lanappUrl}/api/v1/lanapp/:path*`,
      },
      {
        source: "/api/v1/g/:path*",
        destination: `${authUrl}/api/v1/g/:path*`,
      },
    ]
  },
}

export default nextConfig
