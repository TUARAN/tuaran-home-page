import BookmarksTocLayout from '../../components/BookmarksTocLayout'

export const dynamic = 'force-static'

export const metadata = {
  title: '开发资源',
  description: '前端、后端、DevOps 等开发相关的优质资源与工具链。',
  alternates: {
    canonical: '/bookmarks/dev-resources',
  },
}

const resources = [
  {
    title: 'Tauri 入门资源',
    description: '官方文档、入门教程、深度文章与生态资源汇总。',
    tags: ['Tauri', 'Beginner', 'Resources'],
    table: {
      headers: ['分类', '资源名称', '类型', '语言', '适合阶段', '核心内容', '链接'],
      rows: [
        {
          category: '官方文档',
          name: 'Tauri 官方文档 v2',
          type: '官方文档',
          language: '英文',
          stage: '入门 → 进阶',
          summary: '完整 API、架构、打包、最佳实践',
          url: 'https://v2.tauri.app',
        },
        {
          category: '官方文档',
          name: 'Tauri 官方文档（中文）',
          type: '官方文档',
          language: '中文',
          stage: '入门',
          summary: '快速开始、项目创建、基础概念',
          url: 'https://v2.tauri.app/zh-cn',
        },
        {
          category: '官方仓库',
          name: 'tauri-apps/tauri',
          type: 'GitHub 仓库',
          language: '英文',
          stage: '全阶段',
          summary: '核心源码、示例、Issue 与生态',
          url: 'https://github.com/tauri-apps/tauri',
        },
        {
          category: '入门教程',
          name: '掘金 Tauri 入门实战',
          type: '博客教程',
          language: '中文',
          stage: '入门',
          summary: 'React/Vue + Tauri 项目实操',
          url: 'https://juejin.cn/post/7269060515728359436',
        },
        {
          category: '入门教程',
          name: '腾讯云 Tauri 开发总结',
          type: '博客教程',
          language: '中文',
          stage: '入门 → 中级',
          summary: '事件系统、窗口、文件系统',
          url: 'https://cloud.tencent.com/developer/article/2359026',
        },
        {
          category: '入门教程',
          name: 'CSDN Tauri 系列',
          type: '博客教程',
          language: '中文',
          stage: '入门',
          summary: '项目结构解析、基础配置',
          url: 'https://blog.csdn.net',
        },
        {
          category: '深度文章',
          name: 'Dev.to Tauri 入门',
          type: '技术文章',
          language: '英文',
          stage: '入门 → 中级',
          summary: 'Rust + Web 桌面开发理念',
          url: 'https://dev.to/debajyotisarkarhome/starting-desktop-application-development-an-introduction-to-tauri-2095',
        },
        {
          category: '深度文章',
          name: 'The New Stack Tauri 架构',
          type: '技术文章',
          language: '英文',
          stage: '中级',
          summary: '架构设计与技术背景',
          url: 'https://thenewstack.io/tauri-mixing-javascript-with-rust-for-gui-desktop-apps',
        },
        {
          category: '对比分析',
          name: 'Tauri vs Electron 对比',
          type: '技术文章',
          language: '英文',
          stage: '中级',
          summary: '性能与架构差异',
          url: 'https://softwarelogic.co/en/blog/how-to-choose-electron-or-tauri-for-modern-desktop-apps',
        },
        {
          category: '视频教程',
          name: '哔哩哔哩 Tauri 入门视频',
          type: '视频',
          language: '中文',
          stage: '入门',
          summary: '从零搭建项目演示',
          url: 'https://www.bilibili.com',
        },
        {
          category: '生态资源',
          name: 'Awesome Tauri',
          type: '资源合集',
          language: '英文',
          stage: '中级 → 进阶',
          summary: '模板、插件、示例集合',
          url: 'https://github.com/tauri-apps/awesome-tauri',
        },
        {
          category: '高级主题',
          name: 'Tauri Sidecar Node.js',
          type: '官方指南',
          language: '英文',
          stage: '进阶',
          summary: 'Node 侧车进程扩展',
          url: 'https://v2.tauri.app/learn/sidecar-nodejs',
        },
      ],
    },
  },
]

const tocItems = resources.map((item, idx) => ({
  id: `resource-${idx}`,
  title: item.title,
  subItems: [{ id: `resource-${idx}-link`, label: '链接' }],
}))

export default function DevResourcesPage() {
  return (
    <BookmarksTocLayout
      title="开发资源"
      description="前端、后端、DevOps 等开发相关的优质资源与工具链。"
      tocItems={tocItems}
      footer={<p>这里会持续补充：优质文档、工具链与工程实践参考。</p>}
    >
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {resources.map((item, idx) => (
          <section
            key={item.url}
            className="border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-900 p-4"
          >
            <h2
              id={`resource-${idx}`}
              className="text-base font-semibold text-[#333] dark:text-gray-100 scroll-mt-24"
            >
              {item.title}
            </h2>
            <div className="text-sm text-[#666] dark:text-gray-300 mt-2">{item.description}</div>

            {item.table ? (
              <div id={`resource-${idx}-link`} className="mt-4 scroll-mt-24">
                <div className="overflow-x-auto border border-gray-200/70 dark:border-gray-800">
                  <table className="min-w-full text-left text-xs sm:text-sm text-[#444] dark:text-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-800/70 text-[#333] dark:text-gray-100">
                      <tr>
                        {item.table.headers.map((header) => (
                          <th key={header} className="px-3 py-2 font-semibold whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {item.table.rows.map((row, rowIndex) => (
                        <tr key={`${row.name}-${rowIndex}`} className="border-t border-gray-200/60 dark:border-gray-800">
                          <td className="px-3 py-2 whitespace-nowrap text-[#555] dark:text-gray-300">{row.category}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{row.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[#555] dark:text-gray-300">{row.type}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[#555] dark:text-gray-300">{row.language}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-[#555] dark:text-gray-300">{row.stage}</td>
                          <td className="px-3 py-2 text-[#666] dark:text-gray-300">{row.summary}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <a
                              href={row.url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-semibold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                            >
                              打开链接
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div id={`resource-${idx}-link`} className="mt-4 text-sm text-[#666] dark:text-gray-300 scroll-mt-24">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#444] dark:text-gray-200 opacity-90 hover:opacity-100 underline underline-offset-4"
                >
                  打开链接
                </a>
                <div className="mt-1 text-xs text-[#999] dark:text-gray-400 break-all">{item.url}</div>
              </div>
            )}

            {item.tags && item.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-3">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-gray-200/70 bg-white/80 px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700/60 dark:bg-gray-900/70 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </BookmarksTocLayout>
  )
}
