const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@gbferry/dto', '@gbferry/ui', 'antd', '@ant-design/icons'],
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },
  // `standalone` optimizes for container deployments by tracing dependencies
  // and copying only necessary files into .next/standalone
  output: 'standalone',
  // Required in monorepos so the file tracer resolves symlinked workspace packages
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

module.exports = nextConfig;
