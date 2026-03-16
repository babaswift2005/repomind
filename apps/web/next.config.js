/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['simple-git'],
  experimental: {
    serverComponentsExternalPackages: ['simple-git'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...(config.externals || []), 'simple-git']
    }
    return config
  },
}

module.exports = nextConfig
