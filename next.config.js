/** @type {import('next').NextConfig} */
const path = require('path')

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
  transpilePackages: ['@huggingface/transformers'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Next 默认会解析到 transformers.node.mjs，浏览器端必须用 web 构建
      config.resolve.alias = {
        ...config.resolve.alias,
        '@huggingface/transformers$': path.resolve(
          __dirname,
          'node_modules/@huggingface/transformers/dist/transformers.web.js',
        ),
      }
      config.resolve.conditionNames = ['browser', 'import', 'require', 'default']
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      }
      config.module.rules.push({
        test: /\.wasm$/,
        type: 'asset/resource',
      })
    }
    return config
  },
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
      {
        // /weekly 是历史路由，统一归入 /diary 持续更新
        source: '/weekly',
        destination: '/diary',
        permanent: true,
      },
      {
        // /bookmarks/people 已收敛为 /articles?tab=people 的人物调研
        source: '/bookmarks/people',
        destination: '/articles?tab=people',
        permanent: true,
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
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
}

module.exports = nextConfig
