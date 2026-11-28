import Link from 'next/link'

import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'
import { HARNESS_VERSION, PUBLIC_SKILL_DOWNLOAD_PATH } from '../../../../lib/distribution/harness.js'
import { DISTRIBUTION_AGENT_PLATFORM_IDS } from '../../../../lib/distribution/playbooks.js'
import { distributionPlatformShortLabel } from '../../../../lib/distribution/platforms.js'

export const dynamic = 'force-static'

const PAGE_PATH = '/tools/aran-distributor'
const PAGE_URL = `https://2aran.com${PAGE_PATH}`
const TITLE = '阿燃分发智能体｜本机多平台发文'
const DESCRIPTION =
  '用 ego lite 浏览器与本机 AI（Cursor、Codex、Claude Code）把公开文章或自备 Markdown 发到你的掘金、CSDN、X、小红书、知乎、头条账号。'

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['阿燃分发智能体', '2aran-distributor', 'ego lite', '多平台分发', 'Skill', '2aran'],
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_PATH,
    type: 'website',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: TITLE,
  description: DESCRIPTION,
  url: PAGE_URL,
  inLanguage: 'zh-CN',
  isAccessibleForFree: true,
}

const card = 'rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900'
const platformLine = DISTRIBUTION_AGENT_PLATFORM_IDS.map((id) => distributionPlatformShortLabel(id)).join('、')

export default function AranDistributorPage() {
  return (
    <PageContainer className="min-h-screen py-10 text-slate-900 dark:text-slate-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="面包屑" className="text-sm text-slate-500">
        <Link href="/tools" className="hover:underline">
          工具与下载
        </Link>{' '}
        / 阿燃分发智能体
      </nav>

      <header className="mt-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-12">
        <p className="text-xs font-medium tracking-widest text-emerald-300">Skill + ego lite · harness {HARNESS_VERSION}</p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">阿燃分发智能体</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
          可视化浏览器里由 AI 按平台手册填编辑器，你在自己的账号里登录、核对并点发布。支持把 2aran 公开文章链回原文发到你的号，也支持自备 Markdown 离线任务。
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/skill-center/2aran-distributor"
            className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950"
          >
            Skill 中心安装
          </Link>
          <a
            href={PUBLIC_SKILL_DOWNLOAD_PATH}
            className="rounded-xl border border-slate-600 px-5 py-3 text-sm"
          >
            下载 SKILL.md
          </a>
          <SharePageButton
            title="阿燃分发智能体"
            text="本机 ego lite + skill，把文章发到你的内容平台。"
            url="https://2aran.com/tools/aran-distributor"
          />
          <a href="#quick-start" className="rounded-xl border border-slate-600 px-5 py-3 text-sm">
            快速开始
          </a>
        </div>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="工作流程">
        {[
          ['01 · 安装', '下载 SKILL.md 到 Cursor / Codex / Claude Code 的 skills 目录；安装 ego-browser skill。'],
          ['02 · 浏览器', '新建 ego Profile（默认 SyncBlog），在各平台手工登录一次。'],
          ['03 · 任务', '文章页点「分发到我的号」或自备 Markdown；粘贴任务给智能体，逐平台发布。'],
        ].map(([title, text]) => (
          <div key={title} className={card}>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{text}</p>
          </div>
        ))}
      </section>

      <section id="quick-start" className={`mt-10 scroll-mt-24 ${card}`}>
        <h2 className="text-2xl font-semibold">快速开始</h2>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7">
          <li>
            打开{' '}
            <Link href="/skill-center/2aran-distributor" className="font-medium underline">
              Skill 中心 · 阿燃分发智能体
            </Link>
            ，下载 SKILL.md 到本机对应 skills 文件夹。
          </li>
          <li>运行 <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">ego-browser skill</code>，按指南创建 Profile。</li>
          <li>
            在掘金、CSDN 等创作后台登录你的账号；未登录时智能体会 handOff 给你扫码。
          </li>
          <li>
            打开任意 2aran 公开文章，点击「分发到我的号」复制任务，粘贴给已加载 skill 的智能体。
          </li>
          <li>发布前核对标题与图片；权利声明（原创/转载/翻译）由你本人确认勾选。</li>
        </ol>
      </section>

      <section className={`mt-10 ${card}`}>
        <h2 className="text-2xl font-semibold">浏览器与登录态</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
          登录态保存在你本机 ego Profile 的浏览器数据里，2aran 不会代存各平台密码。建议使用单独 Profile，不要与日常上网混用。平台改版时操作步骤可能失效，按智能体回报里的「手册偏差」更新 skill。
        </p>
        <dl className="mt-5 divide-y divide-slate-200 text-sm dark:divide-slate-800">
          {[
            ['专用 Profile', '默认名称 SyncBlog；任务里可改 profileId。'],
            ['未登录', 'handOff 给你本人，登录成功后再继续。'],
            ['正文来源', '默认打开站内原文 URL 读取页面正文，任务不带全文（防镜像）。'],
            ['站长自用', '文章页 ego 按钮走任务台与全文；仅站长可见。'],
          ].map(([dt, dd]) => (
            <div key={dt} className="py-4">
              <dt className="font-medium">{dt}</dt>
              <dd className="mt-2 leading-7 text-slate-500 dark:text-slate-400">{dd}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`mt-10 ${card}`}>
        <h2 className="text-2xl font-semibold">已实测平台</h2>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{platformLine}</p>
        <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
          各平台编辑器差异大，智能体负责填表与图床处理，最终发布按钮由你点击。更多平台请先跳过或在回报中附手册草稿。
        </p>
      </section>

      <section id="legacy-plugin" className={`mt-10 ${card}`}>
        <h2 className="text-2xl font-semibold">原 AI 分发大师（浏览器插件）</h2>
        <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
          2026 年起插件与 VIP 安装包已停用，不再维护各平台 DOM 适配。多平台差异更适合「ego 可视化浏览器 + 本机智能体」；旧版说明见{' '}
          <Link href="/tools/syncblog-publisher/docs" className="underline">
            历史黄皮书
          </Link>
          （只读存档）。
        </p>
      </section>

      <footer className="mt-10 border-t border-slate-200 pt-6 text-sm leading-7 text-slate-500 dark:border-slate-800">
        技术 id：<code>2aran-distributor</code> · harness {HARNESS_VERSION}。转载或翻译时保留原文链接，并遵守目标平台规则。
      </footer>
    </PageContainer>
  )
}