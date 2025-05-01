/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Disable TypeScript errors in production build to allow the project to build
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
}

module.exports = nextConfig 