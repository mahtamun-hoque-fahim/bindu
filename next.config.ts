import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Vercel handles image optimization natively — no changes needed
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google OAuth avatars
    ],
  },
  // Silence bcrypt WASM build warnings
  experimental: {
    serverComponentsExternalPackages: ['@node-rs/bcrypt'],
  },
}

export default nextConfig
