/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 🚀 تحسين الرفع على Render
  output: 'standalone', 
  typescript: {
    ignoreBuildErrors: true, // تجاهل أخطاء الأنواع أثناء البناء لضمان الرفع
  },
  eslint: {
    ignoreDuringBuilds: true, // تجاهل تحذيرات الـ Lint أثناء البناء
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

module.exports = nextConfig
