/* 仅满足可安装条件：不拦截、不缓存页面，避免和 Next.js 路由抢响应。 */
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {})
