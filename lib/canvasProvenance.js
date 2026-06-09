/**
 * Cursor Canvas → 站内工程页的溯源登记。
 *
 * Canvas 文件只在 Cursor IDE 里编译运行（cursor/canvas），不会直接部署到 2aran.com。
 * 这里记录「先在 Canvas 里做交互原型 → 再落地为 Next.js 工程页」的对应关系，
 * 供 /works、/articles 和详情页展示 Canvas 标签。
 *
 * 新作品流程：
 * 1. 在 ~/.cursor/projects/<workspace>/canvases/<slug>.canvas.tsx 完成交互原型
 * 2. 落地为 app/(site)/<route>/ 工程页
 * 3. 在本文件登记 canvasId，并在 lib/engineeringWorks.js 的条目上写 canvasId
 */

export const CANVAS_REGISTRY = {
  'cloudflare-personal-site-map': {
    label: 'Canvas',
    title: 'Cloudflare 开发者平台选型地图',
    canvasFile: 'cloudflare-personal-site-map.canvas.tsx',
    publishedHref: '/cloudflare-personal-site-map',
    note: '先在 Cursor Canvas 里做交互原型，再落地为站内工程页。',
    publishedAt: '2026-06-09',
  },
  'ai-token-usage-analysis': {
    label: 'Canvas',
    title: 'AI Token 用量结构化调研',
    canvasFile: 'ai-token-usage-analysis.canvas.tsx',
    publishedHref: '/ai-token-usage-research',
    note: '先在 Cursor Canvas 里做图表与口径对照，再落地为站内工程页。',
    publishedAt: '2026-05-31',
  },
}

/** @param {{ canvasId?: string, href?: string }} input */
export function resolveCanvasProvenance(input = {}) {
  const { canvasId, href } = input
  if (canvasId && CANVAS_REGISTRY[canvasId]) {
    return { id: canvasId, ...CANVAS_REGISTRY[canvasId] }
  }
  if (href) {
    const match = Object.entries(CANVAS_REGISTRY).find(([, entry]) => entry.publishedHref === href)
    if (match) {
      return { id: match[0], ...match[1] }
    }
  }
  return null
}

export function listCanvasProvenanceEntries() {
  return Object.entries(CANVAS_REGISTRY).map(([id, entry]) => ({ id, ...entry }))
}
