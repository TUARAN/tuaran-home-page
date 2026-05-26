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
  distDir: process.env.NEXT_DIST_DIR || '.next',
  transpilePackages: ['@huggingface/transformers'],
  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'transformers-web-runtime$': path.resolve(
        __dirname,
        'node_modules/@huggingface/transformers/dist/transformers.web.js',
      ),
    }
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
      // pptxgenjs 在浏览器构建时仍会出现 import('node:fs') / import('node:https')
      // 的字面量动态导入；用 NormalModuleReplacementPlugin 把它们重写到空模块。
      const webpack = require('webpack')
      config.plugins = config.plugins || []
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:(fs|https|os|path)$/, (resource) => {
          resource.request = path.resolve(__dirname, 'lib/empty-module.js')
        }),
      )
    }
    return config
  },
  async headers() {
    return [
      {
        source: '/web-llm',
        headers: webLlmHeaders,
      },
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
      {
        source: '/reading/biography',
        destination: '/reading?tab=biography',
        permanent: true,
      },
      {
        source: '/reading/psychology',
        destination: '/reading?tab=psychology',
        permanent: true,
      },
      {
        source: '/reading/sociology',
        destination: '/reading?tab=sociology',
        permanent: true,
      },
      {
        source: '/reading/wealth',
        destination: '/reading?tab=wealth',
        permanent: true,
      },
      {
        source: '/reading/history',
        destination: '/reading?tab=history',
        permanent: true,
      },
      {
        source: '/reading/philosophy',
        destination: '/reading?tab=philosophy',
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
        hostname: 'wsrv.nl',
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
