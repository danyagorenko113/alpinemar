import type { NextConfig } from 'next'

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'alpinemar.com' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
    ],
  },
}

export default config
