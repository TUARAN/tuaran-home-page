import BookmarksTocLayout from '../../components/BookmarksTocLayout'
import ContentPvBeacon from '../../components/ContentPvBeacon'
import RanbiPaywall from '../../components/RanbiPaywall'

export const dynamic = 'force-static'

export const metadata = {
  title: '开发资源',
  description: '前端、后端、数据库、测试、DevOps、安全与架构相关的优质开发资源与工具链。',
  alternates: {
    canonical: '/bookmarks/dev-resources',
  },
}

const RESOURCE_HEADERS = ['分类', '资源名称', '类型', '语言', '适合阶段', '核心内容', '链接']

const resources = [
  {
    title: '开发基础与路线图',
    description: '适合建立长期学习地图：Web 基础、语言基础、路线图和现代 Web 体验。',
    tags: ['Roadmap', 'Web Platform', 'Foundation'],
    table: {
      headers: RESOURCE_HEADERS,
      rows: [
        {
          category: '路线图',
          name: 'roadmap.sh',
          type: '学习路线',
          language: '英文',
          stage: '入门 → 进阶',
          summary: '前端、后端、DevOps、AI Engineer 等交互式路线图',
          url: 'https://roadmap.sh/',
        },
        {
          category: '路线图',
          name: 'developer-roadmap',
          type: 'GitHub 仓库',
          language: '英文',
          stage: '全阶段',
          summary: 'roadmap.sh 开源仓库，可看路线图来源与更新记录',
          url: 'https://github.com/nilbuild/developer-roadmap',
        },
        {
          category: 'Web 标准',
          name: 'MDN Web Docs',
          type: '官方文档',
          language: '多语言',
          stage: '全阶段',
          summary: 'HTML、CSS、JavaScript、Web API 与兼容性资料',
          url: 'https://developer.mozilla.org/en-US/',
        },
        {
          category: 'Web 体验',
          name: 'web.dev',
          type: '官方指南',
          language: '多语言',
          stage: '入门 → 进阶',
          summary: '性能、可访问性、Baseline、Core Web Vitals 与现代 Web 实践',
          url: 'https://web.dev/',
        },
        {
          category: '类型系统',
          name: 'TypeScript Docs',
          type: '官方文档',
          language: '英文',
          stage: '入门 → 进阶',
          summary: 'Handbook、类型系统、配置与迁移资料',
          url: 'https://www.typescriptlang.org/docs/',
        },
        {
          category: '运行时',
          name: 'Node.js Learn',
          type: '官方教程',
          language: '英文',
          stage: '入门 → 中级',
          summary: 'Node.js 基础、异步模型、包管理、安全与最佳实践',
          url: 'https://nodejs.org/learn',
        },
      ],
    },
  },
  {
    title: '前端工程与全栈框架',
    description: '覆盖日常前端开发、React/Next.js、构建工具、样式系统和组件工程。',
    tags: ['Frontend', 'React', 'Full-stack'],
    table: {
      headers: RESOURCE_HEADERS,
      rows: [
        {
          category: 'React',
          name: 'React Learn',
          type: '官方文档',
          language: '中文 / 英文',
          stage: '入门 → 进阶',
          summary: '现代 React 心智模型、Hooks、状态、组件设计',
          url: 'https://react.dev/learn',
        },
        {
          category: '全栈框架',
          name: 'Next.js Docs',
          type: '官方文档',
          language: '英文',
          stage: '中级 → 进阶',
          summary: 'App Router、Server Components、缓存、路由与部署',
          url: 'https://nextjs.org/docs',
        },
        {
          category: '构建工具',
          name: 'Vite Guide',
          type: '官方文档',
          language: '中文 / 英文',
          stage: '入门 → 中级',
          summary: '现代前端开发服务器、构建、插件和库模式',
          url: 'https://vite.dev/guide/',
        },
        {
          category: '样式系统',
          name: 'Tailwind CSS Docs',
          type: '官方文档',
          language: '英文',
          stage: '入门 → 中级',
          summary: '原子化 CSS、主题变量、响应式与组件样式组织',
          url: 'https://tailwindcss.com/docs',
        },
        {
          category: '组件库',
          name: 'shadcn/ui',
          type: '组件文档',
          language: '英文',
          stage: '中级',
          summary: '可复制源码的 React 组件体系，适合后台和工具型产品',
          url: 'https://ui.shadcn.com/docs',
        },
        {
          category: '设计系统',
          name: 'Storybook Docs',
          type: '官方文档',
          language: '英文',
          stage: '中级 → 进阶',
          summary: '组件开发、文档、交互测试、视觉回归和设计系统工作流',
          url: 'https://storybook.js.org/docs',
        },
      ],
    },
  },
  {
    title: '测试、质量与可维护性',
    description: '从单元测试、端到端测试、组件文档到性能审计，优先保留能直接接入项目的工具。',
    tags: ['Testing', 'Quality', 'CI'],
    table: {
      headers: RESOURCE_HEADERS,
      rows: [
        {
          category: '端到端测试',
          name: 'Playwright Docs',
          type: '官方文档',
          language: '英文',
          stage: '入门 → 进阶',
          summary: '跨 Chromium / WebKit / Firefox 的 E2E 测试、Trace、CI 与报告',
          url: 'https://playwright.dev/docs/intro',
        },
        {
          category: '单元测试',
          name: 'Vitest Guide',
          type: '官方文档',
          language: '英文',
          stage: '入门 → 中级',
          summary: 'Vite 生态测试框架，适合前端、库和 Node 项目',
          url: 'https://vitest.dev/guide/',
        },
        {
          category: 'React 测试',
          name: 'Testing Library Docs',
          type: '官方文档',
          language: '英文',
          stage: '中级',
          summary: '以用户行为为中心的 DOM / React 测试方法',
          url: 'https://testing-library.com/docs/',
        },
        {
          category: '代码规范',
          name: 'ESLint Docs',
          type: '官方文档',
          language: '英文',
          stage: '入门 → 进阶',
          summary: 'JavaScript / TypeScript 代码检查、规则配置和插件生态',
          url: 'https://eslint.org/docs/latest/',
        },
        {
          category: '格式化',
          name: 'Prettier Docs',
          type: '官方文档',
          language: '英文',
          stage: '入门',
          summary: '统一代码格式，减少团队代码风格争论',
          url: 'https://prettier.io/docs/',
        },
        {
          category: '性能审计',
          name: 'Lighthouse Docs',
          type: '官方文档',
          language: '英文',
          stage: '中级',
          summary: '性能、可访问性、SEO、PWA 与最佳实践审计',
          url: 'https://developer.chrome.com/docs/lighthouse',
        },
      ],
    },
  },
  {
    title: '后端、API 与数据层',
    description: '后端开发的核心参考：API 规范、服务端框架、数据库、缓存和 ORM。',
    tags: ['Backend', 'API', 'Database'],
    table: {
      headers: RESOURCE_HEADERS,
      rows: [
        {
          category: 'API 规范',
          name: 'OpenAPI Specification',
          type: '标准规范',
          language: '英文',
          stage: '中级 → 进阶',
          summary: 'REST API 契约、Schema、工具生成和接口协作基础',
          url: 'https://swagger.io/specification/',
        },
        {
          category: 'Node 后端',
          name: 'NestJS Docs',
          type: '官方文档',
          language: '英文',
          stage: '中级',
          summary: '模块化 Node.js 服务端框架，适合复杂业务 API',
          url: 'https://docs.nestjs.com/',
        },
        {
          category: 'Python 后端',
          name: 'FastAPI Docs',
          type: '官方文档',
          language: '英文',
          stage: '入门 → 中级',
          summary: '类型驱动 API、自动 OpenAPI、异步服务端开发',
          url: 'https://fastapi.tiangolo.com/',
        },
        {
          category: 'Go 后端',
          name: 'Go Documentation',
          type: '官方文档',
          language: '英文',
          stage: '入门 → 进阶',
          summary: '语言规范、标准库、模块、并发和服务端开发基础',
          url: 'https://go.dev/doc/',
        },
        {
          category: '关系数据库',
          name: 'PostgreSQL Documentation',
          type: '官方文档',
          language: '英文',
          stage: '中级 → 进阶',
          summary: 'SQL、索引、事务、复制、性能调优和管理手册',
          url: 'https://www.postgresql.org/docs/current/',
        },
        {
          category: '缓存 / KV',
          name: 'Redis Docs',
          type: '官方文档',
          language: '英文',
          stage: '中级',
          summary: '数据类型、缓存、队列、流、持久化和集群',
          url: 'https://redis.io/docs/latest/',
        },
        {
          category: 'ORM',
          name: 'Prisma Documentation',
          type: '官方文档',
          language: '英文',
          stage: '入门 → 中级',
          summary: 'TypeScript ORM、迁移、Schema、查询和数据库工作流',
          url: 'https://www.prisma.io/docs',
        },
      ],
    },
  },
  {
    title: 'DevOps、部署与云平台',
    description: '从本地容器化到 CI/CD、Kubernetes、边缘部署和云厂商文档。',
    tags: ['DevOps', 'Cloud', 'Deployment'],
    table: {
      headers: RESOURCE_HEADERS,
      rows: [
        {
          category: '容器',
          name: 'Docker Docs',
          type: '官方文档',
          language: '英文',
          stage: '入门 → 进阶',
          summary: '镜像、容器、Compose、Build、Registry 与生产化实践',
          url: 'https://docs.docker.com/',
        },
        {
          category: '编排',
          name: 'Kubernetes Docs',
          type: '官方文档',
          language: '多语言',
          stage: '中级 → 进阶',
          summary: 'Pod、Deployment、Service、Ingress、配置、存储和集群运维',
          url: 'https://kubernetes.io/docs/home/',
        },
        {
          category: 'CI/CD',
          name: 'GitHub Actions Docs',
          type: '官方文档',
          language: '英文',
          stage: '入门 → 进阶',
          summary: 'Workflow、Runner、Secrets、OIDC、部署和自动化',
          url: 'https://docs.github.com/en/actions',
        },
        {
          category: '边缘平台',
          name: 'Cloudflare Developer Docs',
          type: '官方文档',
          language: '英文',
          stage: '中级 → 进阶',
          summary: 'Workers、Pages、D1、R2、KV、Durable Objects、AI Gateway',
          url: 'https://developers.cloudflare.com/',
        },
        {
          category: '前端云平台',
          name: 'Vercel Docs',
          type: '官方文档',
          language: '英文',
          stage: '入门 → 进阶',
          summary: '部署、Functions、Edge、AI SDK、Observability、Storage',
          url: 'https://vercel.com/docs',
        },
        {
          category: '云厂商',
          name: 'AWS Documentation',
          type: '官方文档',
          language: '英文',
          stage: '中级 → 进阶',
          summary: 'AWS 全产品文档、架构、CLI、SDK、最佳实践入口',
          url: 'https://docs.aws.amazon.com/',
        },
        {
          category: 'IaC',
          name: 'Terraform Documentation',
          type: '官方文档',
          language: '英文',
          stage: '中级',
          summary: '基础设施即代码、Provider、State、Module 与部署流程',
          url: 'https://developer.hashicorp.com/terraform/docs',
        },
        {
          category: '可观测',
          name: 'OpenTelemetry Docs',
          type: '官方文档',
          language: '英文',
          stage: '中级 → 进阶',
          summary: 'Trace、Metric、Log、Collector 和跨语言观测标准',
          url: 'https://opentelemetry.io/docs/',
        },
      ],
    },
  },
  {
    title: '架构、安全与 SRE',
    description: '从工程原则、安全风险到可靠性体系，适合中高级工程师长期反复查。',
    tags: ['Architecture', 'Security', 'SRE'],
    table: {
      headers: RESOURCE_HEADERS,
      rows: [
        {
          category: '安全基线',
          name: 'OWASP Top 10',
          type: '安全项目',
          language: '英文',
          stage: '中级',
          summary: 'Web 应用最常见安全风险与防护基线',
          url: 'https://owasp.org/www-project-top-ten/',
        },
        {
          category: '安全训练',
          name: 'PortSwigger Web Security Academy',
          type: '实战课程',
          language: '英文',
          stage: '中级 → 进阶',
          summary: 'XSS、SQL 注入、认证、SSRF、OAuth 等可交互实验',
          url: 'https://portswigger.net/web-security',
        },
        {
          category: '云原生原则',
          name: 'The Twelve-Factor App',
          type: '方法论',
          language: '英文',
          stage: '中级',
          summary: '配置、依赖、日志、进程、环境一致性等应用交付原则',
          url: 'https://12factor.net/',
        },
        {
          category: '架构',
          name: 'Martin Fowler Architecture Guide',
          type: '文章索引',
          language: '英文',
          stage: '中级 → 进阶',
          summary: '架构模式、微服务、演进式设计、重构和组织协作',
          url: 'https://martinfowler.com/architecture/',
        },
        {
          category: '可靠性',
          name: 'Google SRE Books',
          type: '在线书籍',
          language: '英文',
          stage: '进阶',
          summary: 'SRE、监控、事故响应、错误预算、可靠性工程体系',
          url: 'https://sre.google/books/',
        },
        {
          category: '系统设计',
          name: 'System Design Primer',
          type: 'GitHub 仓库',
          language: '英文',
          stage: '中级 → 进阶',
          summary: '系统设计基础、扩展性、缓存、队列、数据库和面试题',
          url: 'https://github.com/donnemartin/system-design-primer',
        },
        {
          category: '架构记录',
          name: 'Architecture Decision Records',
          type: 'GitHub 资料',
          language: '英文',
          stage: '中级',
          summary: 'ADR 写法、模板和用决策记录沉淀架构上下文',
          url: 'https://github.com/joelparkerhenderson/architecture-decision-record',
        },
      ],
    },
  },
  {
    title: 'Tauri 入门资源',
    description: '桌面应用开发专题：Tauri v2、官方仓库、生态资源和入门参考。',
    tags: ['Tauri', 'Beginner', 'Resources'],
    table: {
      headers: RESOURCE_HEADERS,
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
          category: '生态资源',
          name: 'Awesome Tauri',
          type: '资源合集',
          language: '英文',
          stage: '中级 → 进阶',
          summary: '模板、插件、示例集合',
          url: 'https://github.com/tauri-apps/awesome-tauri',
        },
        {
          category: '插件生态',
          name: 'Tauri Plugins',
          type: '官方文档',
          language: '英文',
          stage: '中级',
          summary: '窗口、文件系统、Shell、通知、HTTP 等插件体系',
          url: 'https://v2.tauri.app/plugin/',
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
        {
          category: '替代方案',
          name: 'Electron Docs',
          type: '官方文档',
          language: '英文',
          stage: '中级',
          summary: '桌面应用主进程、渲染进程、打包、安全和自动更新',
          url: 'https://www.electronjs.org/docs/latest/',
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
    <>
      <ContentPvBeacon category="resource" slug="bookmarks-dev-resources" />
      <RanbiPaywall resourceKey="resource:bookmarks-dev-resources" unitLabel="资源">
        <BookmarksTocLayout
          title="开发资源"
          description="按真实开发工作流整理：基础、前端、测试、后端、数据、DevOps、架构、安全与桌面应用。"
          tocItems={tocItems}
          footer={<p>筛选原则：优先官方文档、长期维护的开源资料和可直接进入项目实践的工具链；泛泛的博客合集只在必要时补充。</p>}
        >
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {resources.map((item, idx) => (
          <section
            key={item.title}
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
      </RanbiPaywall>
    </>
  )
}
