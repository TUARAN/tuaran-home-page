import AdminPageGate from '../../components/AdminPageGate'
import LongCompassClient from '../../../(site)/long-compass/LongCompassClient'
import ShareAdminClient from '../share/ShareConsole'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '私域与分享',
  description: '长期罗盘强私密 + 加密分享分发入口。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function AdminLongCompassPage() {
  return (
    <AdminPageGate
      label="私域与分享"
      returnTo="/admin/long-compass"
      description="一个入口同时管理长期罗盘强私密内容和加密分享分发内容，仅站长本人可见。"
    >
      <PrivateContentHubIntro />
      <div id="long-compass">
        <LongCompassClient
          returnTo="/admin/long-compass"
          eyebrow="Admin · 强私密模型"
          description="长期罗盘：密文存储，本页输入口令后只在浏览器本地解密。"
        />
      </div>
      <div id="encrypted-share" className="mx-auto w-full max-w-[1120px] px-4 pb-2 pt-4 md:px-6">
        <div className="border-t border-[#dee0db] dark:border-[#252e39]" />
      </div>
      <ShareAdminClient />
    </AdminPageGate>
  )
}

function PrivateContentHubIntro() {
  return (
    <section className="mx-auto w-full max-w-[1120px] px-4 pt-7 md:px-6 md:pt-9">
      <div className="rounded-xl border border-[#d9dbd1] bg-[#f7f8f2] p-4 dark:border-[#263140] dark:bg-[#10161f]">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#767869] dark:text-[#8e9ab0]">
          Private Content Hub
        </p>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-[#15140f] dark:text-gray-100">
          私域与分享
        </h1>
        <p className="mt-2 max-w-[52rem] text-[13.5px] leading-7 text-[#56564e] dark:text-gray-400">
          这里保留两套安全模型：长期罗盘用于强私密长期记录，密文存储、浏览器本地解密；加密分享用于对外分发，后台站长可直接查看明文，公开链接只返回密文信封。
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <a
            href="#long-compass"
            className="rounded-lg border border-[#d5d7cd] bg-white p-3 transition hover:border-[#b7baaa] dark:border-[#2a3544] dark:bg-[#0d131b] dark:hover:border-[#465366]"
          >
            <div className="text-sm font-semibold text-[#15140f] dark:text-gray-100">长期罗盘</div>
            <p className="mt-1 text-xs leading-6 text-[#66675d] dark:text-[#9aa6b6]">
              强私密内容库：资产、复盘、行动框架。服务端只持有密文，需要口令解锁。
            </p>
          </a>
          <a
            href="#encrypted-share"
            className="rounded-lg border border-[#d5d7cd] bg-white p-3 transition hover:border-[#b7baaa] dark:border-[#2a3544] dark:bg-[#0d131b] dark:hover:border-[#465366]"
          >
            <div className="text-sm font-semibold text-[#15140f] dark:text-gray-100">加密分享</div>
            <p className="mt-1 text-xs leading-6 text-[#66675d] dark:text-[#9aa6b6]">
              分发内容库：后台明文管理，公开访问者只拿密文链接，凭密码在浏览器解锁。
            </p>
          </a>
        </div>
      </div>
    </section>
  )
}
