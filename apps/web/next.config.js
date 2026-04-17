/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gbferry/dto', '@gbferry/ui', 'antd', '@ant-design/icons'],
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  // `standalone` uses filesystem links that can fail on Windows without Developer Mode.
  // Enable explicitly for container/CI builds with: NEXT_STANDALONE=true
  output: 'standalone',
};

module.exports = nextConfig;
