import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google OAuth avatars
    ],
  },
  // Required for Cloudflare Pages — disable Node.js image optimization
  // (Cloudflare uses @cloudflare/next-on-pages which handles this)
}

export default nextConfig
