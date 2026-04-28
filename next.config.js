/** @type {import('next').NextConfig} */
const webLlmHeaders = [
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'credentialless',
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
  },
]

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/web-llm/:path*',
        headers: webLlmHeaders,
      },
      {
        source: '/web-llm/embed/:path*',
        headers: webLlmHeaders,
      },
    ]
  },
  async redirects() {
    return [
      {
        source: '/articles/content-os-blogger-matrix-alliance',
        destination: 'https://juejin.cn/post/7595425302968696873',
        permanent: false,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'p0-xtjj-private.juejin.cn',
      },
    ],
  },
}

module.exports = nextConfig
