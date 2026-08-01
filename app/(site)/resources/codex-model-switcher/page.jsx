import Link from 'next/link'

import ArticleFooterCta from '../../components/ArticleFooterCta'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'

export const dynamic = 'force-static'

const RESOURCE_SLUG = 'codex-model-switcher'
const RESOURCE_URL = `https://2aran.com/resources/${RESOURCE_SLUG}`
const APP_DOWNLOAD = '/api/resources/deliver?resourceKey=resource%3Acodex-model-switcher&file=macos-universal'
const SKILL_DOWNLOAD = '/api/resources/deliver?resourceKey=resource%3Acodex-model-switcher&file=skill-zip'

export const metadata = {
  title: 'Codex 模型切换器：macOS 窗口、菜单栏与安装 Skill',
  description: '下载通用 macOS Codex 模型切换器，或把完整 Skill 交给 Codex 自动检查、安装和配置。API Key 不进入安装包或聊天。',
  keywords: ['Codex 模型切换器', 'Codex macOS', 'Codex Skill', 'DeepSeek Provider', 'GPT 切换'],
  alternates: { canonical: `/resources/${RESOURCE_SLUG}` },
  openGraph: { title: 'Codex 模型切换器', description: 'macOS App 与可交给 Codex 的自动安装 Skill。', url: RESOURCE_URL, type: 'article' },
}

function DownloadLink({ href, children, secondary = false }) {
  return (
    <a href={href} download className={`inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2 text-sm font-semibold no-underline transition hover:-translate-y-0.5 hover:!no-underline ${secondary ? 'border-[#b8b5aa] bg-white text-[#25251f] hover:border-[#7b776b] dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100' : 'border-[#171713] bg-[#171713] text-white hover:bg-[#34342d] dark:border-white dark:bg-white dark:text-black'}`}>
      {children}
    </a>
  )
}

function Note({ title, children }) {
  return (
    <div className="rounded-xl border border-[#dfdbcf] bg-white/75 p-5 dark:border-gray-800 dark:bg-gray-950/45">
      <h3 className="mb-2 mt-0 text-base font-semibold">{title}</h3>
      <p className="m-0 text-sm leading-7 text-[#626258] dark:text-gray-300">{children}</p>
    </div>
  )
}

export default function CodexModelSwitcherPage() {
  return (
    <PageContainer className="py-8 md:py-12">
      <article className="prose-tuaran mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-[#8b5a1f] dark:text-[#a1ab76]">macOS · Codex · Universal</p>
        <h1>Codex 模型切换器</h1>
        <p className="lead">一个正常窗口加菜单栏入口，在 OpenAI GPT 和已经配置好的 DeepSeek Provider 之间切换。另附完整 Skill，可以直接交给 Codex 完成检查、安装、备份和配置。</p>

        <div className="not-prose my-7 flex flex-wrap gap-3">
          <DownloadLink href={APP_DOWNLOAD}>下载 macOS App v1.1.0</DownloadLink>
          <DownloadLink href={SKILL_DOWNLOAD} secondary>下载完整安装 Skill v1.0.0</DownloadLink>
          <Link href="/skill-center/install-codex-model-switcher" className="inline-flex min-h-11 items-center justify-center px-2 text-sm font-medium text-[#8b5a1f] no-underline hover:underline dark:text-[#a1ab76]">查看 Skill 内容 →</Link>
        </div>

        <div className="not-prose my-8 grid gap-3 md:grid-cols-3">
          <Note title="GPT：复用现有登录">选择 GPT 会复用现有 OpenAI 登录，并应用包内的 GPT-5.6 Sol 预设；账号仍需有对应模型和服务层级权限。</Note>
          <Note title="DeepSeek：先配置">需要使用者自己的 Key、Responses API 兼容端点和模型目录。推荐让配套 Skill 完成本机配置。</Note>
          <Note title="Key 不进安装包">公开包不含维护者或下载者的 Key。Skill 也不会让你把 Key 粘贴到聊天里。</Note>
        </div>

        <h2>下载后能不能直接用？</h2>
        <p>应用本身可以运行在 Apple Silicon 和 Intel Mac，要求 macOS 13 或更高版本。GPT 模式依赖你已有的 OpenAI 登录和对应模型权限；DeepSeek 模式必须先配置自己的 Provider。</p>
        <p>当前社区版没有 Apple Developer ID 公证。首次启动请 <strong>Control 点按应用 → 打开 → 再确认打开</strong>。这是 macOS Gatekeeper 的正常提示，不需要关闭系统安全设置。拿到 Developer ID 并完成 notarization 后，才能做到所有用户普通双击无提示。</p>

        <h2>直接安装</h2>
        <ol>
          <li>下载 App ZIP 并解压，把应用拖进“应用程序”或用户目录的 <code>Applications</code>。</li>
          <li>首次用 Control 点按 → 打开；窗口会显示当前 Provider。</li>
          <li>关闭窗口后，切换器仍留在菜单栏。点击 GPT 或 DS 可重新显示。</li>
          <li>切换会退出并重新打开 Codex，请先等正在运行的任务结束。</li>
        </ol>

        <h2>把 Skill 丢给 Codex</h2>
        <ol>
          <li>下载完整 Skill ZIP 并解压。</li>
          <li>把整个 <code>install-codex-model-switcher</code> 文件夹提供给 Codex，或放到 <code>~/.codex/skills/</code>。</li>
          <li>告诉 Codex：<code>请使用 $install-codex-model-switcher 安装并配置模型切换器。</code></li>
          <li>Codex 会先做只读预检，再安装 App；需要 DeepSeek 时，由本机终端隐藏输入 Key，并生成配置备份。</li>
        </ol>

        <h2>边界</h2>
        <ul>
          <li>配置能被 Codex 解析，不等于第三方端点一定兼容；需要一次真实请求才能最终确认。</li>
          <li>模型名称和第三方 API 可能变化，本页面提供的是版本化兼容预设。</li>
          <li>工具不会修改 Codex 应用包，也不会删除用户已有的配置备份。</li>
        </ul>

        <div className="not-prose mt-8 flex flex-wrap items-center gap-3 border-t border-[#e2dfd6] pt-6 dark:border-gray-800">
          <DownloadLink href={APP_DOWNLOAD}>下载 macOS App</DownloadLink>
          <SharePageButton title="Codex 模型切换器" text="macOS App 与可交给 Codex 自动配置的安装 Skill。" url={RESOURCE_URL} size="md" idleLabel="分享给朋友" />
        </div>
      </article>
      <ArticleFooterCta />
    </PageContainer>
  )
}
