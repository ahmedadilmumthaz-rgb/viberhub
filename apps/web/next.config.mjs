/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const apiTarget = process.env.API_INTERNAL_URL || 'http://localhost:4000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiTarget}/api/v1/:path*`,
      },
      {
        source: '/healthz',
        destination: `${apiTarget}/healthz`,
      },
      {
        source: '/readyz',
        destination: `${apiTarget}/readyz`,
      }
    ];
  },
};

export default nextConfig;
