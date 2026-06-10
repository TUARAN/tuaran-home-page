export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/agent-ops/'],
      },
    ],
    sitemap: 'https://2aran.com/sitemap.xml',
  }
}
