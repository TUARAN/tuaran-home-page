import Link from 'next/link'
import PageContainer from '../../components/PageContainer'
import SharePageButton from '../../components/SharePageButton'
import ExtensionDownloadButton from '../../resources/x-reply-clipboard-extension/ExtensionDownloadButton'
import { WECHAT_CONTACT } from '../../../lib/site/contactChannels'

export const dynamic = 'force-static'
export const metadata = {
  title: 'AI 分发大师｜浏览器插件工具',
  description: '在创作台组织观点、文章、电子书与项目介绍，通过浏览器插件适配平台、准备草稿，再由你检查并发布。',
  alternates: { canonical: '/tools/syncblog-publisher' },
}

const capabilities = [
  ['观点', '短观点与讨论内容', '按短内容入口准备帖子。'],
  ['文章', '标题与 Markdown 正文', '适配支持的空白编辑器，其余平台提供手动入口。'],
  ['电子书', '书名、介绍与阅读或购买链接', '生成介绍帖；文件上传与平台付费小册需另行处理。'],
  ['项目', '名称、介绍与演示或仓库链接', '生成项目介绍帖，保留访问链接。'],
]
const platforms = [
  ['X、掘金沸点、知乎想法、微博', '支持短内容填写，使用前核对当前编辑器'],
  ['小红书', '已有标题与纯文字填写适配；图片、封面手动处理'],
  ['掘金、CSDN、思否、博客园', '支持 Markdown 编辑入口，使用前核对当前编辑器'],
  ['公众号、知乎长文、X 长文及云社区等', '提供手动入口与正文复制'],
]
const card = 'rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900'

export default function SyncblogPublisherPage() {
  return (
    <PageContainer className="min-h-screen py-10 text-slate-900 dark:text-slate-100">
      <nav aria-label="面包屑" className="text-sm text-slate-500"><Link href="/tools" className="hover:underline">工具与下载</Link> / AI 分发大师</nav>
      <header className="mt-6 rounded-3xl bg-slate-950 p-7 text-white sm:p-12">
        <p className="text-xs font-medium tracking-widest text-emerald-300">浏览器插件 · VIP 下载</p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-6xl">AI 分发大师</h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">在网站创作，在平台执行。把观点、文章、电子书和项目介绍整理好，通过一个插件切换平台、预览 AI 改写、准备草稿，检查后自行发布。</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="https://syncblog.2aran.com/" className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-semibold text-slate-950">打开创作台 ↗</a>
          <ExtensionDownloadButton href="/api/resources/syncblog-download" title="AI 分发大师" credentialLabel="人员码 / 站长总密钥" buttonLabel="VIP 下载 · 输入人员码" downloadHint={`联系站长微信 ${WECHAT_CONTACT.value} 获取人员码。安装包已打包并内置凭证，安装后自动读取，首次心跳绑定设备。`} />
          <SharePageButton title="AI 分发大师" text="整理内容、适配平台，核对草稿后发布。" url="https://2aran.com/tools/syncblog-publisher" />
          <Link href="/tools/syncblog-publisher/docs" className="rounded-xl border border-slate-600 px-5 py-3 text-sm">文档中心</Link>
          <a href="#install" className="rounded-xl border border-slate-600 px-5 py-3 text-sm">安装与使用</a>
        </div>
        <p className="mt-5 text-xs leading-6 text-slate-400">VIP 安装包已打包；联系站长微信 {WECHAT_CONTACT.value} 获取人员码，站长可使用总密钥领取。支持 Chrome / Edge 116+。</p>
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="工作流程">
        {[['01 · 创作', '在创作台整理内容，也可在插件中编写或采集网页选中文字。'], ['02 · 适配', '按当前网站启用对应能力；自配 AI 服务后，先预览，再采用改写。'], ['03 · 核对', '准备平台草稿，逐项查看记录；确认标题、正文和链接后手动发布。']].map(([title, text]) => <div key={title} className={card}><h2 className="font-semibold">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">{text}</p></div>)}
      </section>

      <section className="mt-10"><h2 className="text-2xl font-semibold">四类内容，一个工作台</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{capabilities.map(([title, input, detail]) => <article key={title} className={card}><h3 className="text-lg font-semibold">{title}</h3><p className="mt-3 text-sm font-medium">{input}</p><p className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">{detail}</p></article>)}</div></section>

      <section className={`mt-10 ${card}`}><h2 className="text-2xl font-semibold">平台能力现状</h2><p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">使用前请确认已登录目标平台。平台编辑器和账号权限可能影响填写；准备草稿后，请逐项核对并刷新确认保存结果。</p><dl className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">{platforms.map(([name, status]) => <div key={name} className="py-4"><dt className="font-medium">{name}</dt><dd className="mt-2 text-sm leading-7 text-slate-500 dark:text-slate-400">{status}</dd></div>)}</dl><p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm leading-7 text-amber-950 dark:bg-amber-950 dark:text-amber-100">“已准备”表示页面填写并回读成功。云端保存需刷新后核对，正式发布需另行确认。打开页面、填写、保存和发布分别记录与判断。</p></section>

      <section id="install" className={`mt-10 scroll-mt-24 ${card}`}><h2 className="text-2xl font-semibold">安装与使用</h2><ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-7"><li>点击 VIP 下载，输入人员码或站长总密钥；领取已内置凭证的安装包并解压，在 Chrome / Edge 扩展管理页开启开发者模式，加载包内含 manifest.json 的目录。已有安装请重新加载原目录。</li><li>打开目标平台并登录，点击浏览器工具栏图标或页面浮动入口，确认识别的平台。</li><li>切换内容类型，填写标题、正文和来源链接，保存本地草稿。</li><li>需要 AI 改写时，配置自己的 HTTPS 模型服务、模型名和密钥，授权服务域名；检查预览后采用。请求会把材料发给所配服务。</li><li>选择平台准备草稿，查看分项记录。失败项重试前先核对平台是否已留下内容；已有正文的编辑器应停止填写。</li><li>核对标题、段落、链接与格式，刷新检查保存状态，最后自行发布。</li></ol><p className="mt-5 text-sm leading-7 text-slate-500 dark:text-slate-400">模型密钥、本地草稿与记录保存在扩展本地。卸载或清理扩展数据会丢失；本地保存不等于网站账号同步。</p></section>

      <footer className="mt-10 border-t border-slate-200 pt-6 text-sm leading-7 text-slate-500 dark:border-slate-800">创作前往 <a href="https://syncblog.2aran.com/" className="underline">syncblog.2aran.com</a>。VIP 安装包请通过上方下载入口领取。平台保存与发布结果请在目标网站确认。</footer>
    </PageContainer>
  )
}
