/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
  // Proxy-friendly: API_BASE_URL is read at runtime in BFF route handlers.
};

export default nextConfig;
