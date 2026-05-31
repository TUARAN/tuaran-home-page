import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-static'

export const metadata = {
  title: '社群 · TUARAN ｜ 涂阿燃',
  description:
    '涂阿燃的社群介绍：真实的交友、及时分享信息。微信社群、小红书社群，不制造焦虑，细水长流。',
  keywords: ['涂阿燃', 'tuaran', '社群', '微信', '小红书', '交友'],
  alternates: {
    canonical: '/community',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function CommunityPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <header className="border-b border-[#eee] pb-6 mb-8 dark:border-gray-800">
        <p className="text-xs uppercase tracking-widest text-[#999]">
          Community
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#111] dark:text-white">
          社群介绍
        </h1>
        <p className="mt-3 text-sm text-[#666] dark:text-gray-300">
          真实的交友，及时分享信息。
        </p>
        <div className="mt-4">
          <Link
            href="/"
            className="text-sm text-[#004276] dark:text-blue-400 underline underline-offset-4 opacity-80 hover:opacity-100"
          >
            返回首页
          </Link>
        </div>
      </header>

      <article className="space-y-8 text-sm text-[#666] dark:text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-[#222] dark:text-gray-200 mb-3">
            当前社群
          </h2>
          <p className="mb-4">
            目前有 <strong className="text-[#333] dark:text-gray-100">微信社群 2 个</strong>、<strong className="text-[#333] dark:text-gray-100">小红书社群 1 个</strong>。
            会定期更新社群码，方便大家加入。如果没及时更新，请扫码加微信好友，拉你进群。
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-36 h-36 flex items-center justify-center border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-950 overflow-hidden">
                <Image
                  src="/qrcode-community1.jpg"
                  alt="前端周刊群"
                  width={144}
                  height={144}
                  sizes="144px"
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                />
              </div>
              <span className="text-xs text-[#666] dark:text-gray-400">前端周刊群</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-36 h-36 flex items-center justify-center border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-950 overflow-hidden">
                <Image
                  src="/qrcode-community2.jpg"
                  alt="抽奖粉丝群"
                  width={144}
                  height={144}
                  sizes="144px"
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                />
              </div>
              <span className="text-xs text-[#666] dark:text-gray-400">抽奖粉丝群</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-36 h-36 flex items-center justify-center border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-950 overflow-hidden">
                <Image
                  src="/qrcode-community3.jpg"
                  alt="AI资讯群"
                  width={144}
                  height={144}
                  sizes="144px"
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                />
              </div>
              <span className="text-xs text-[#666] dark:text-gray-400">AI资讯群</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-36 h-36 flex items-center justify-center border border-[#eee] bg-white dark:border-gray-800 dark:bg-gray-950 overflow-hidden">
                <Image
                  src="/qrcode-wechat.jpg"
                  alt="微信号"
                  width={144}
                  height={144}
                  sizes="144px"
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                />
              </div>
              <span className="text-xs text-[#666] dark:text-gray-400">微信号</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#222] dark:text-gray-200 mb-3">
            我对社群的理解
          </h2>
          <p>
            群都是新建时活跃一段，不多久就会死掉。只有持续的运营、持续的活跃，才能让社群保持生命力。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#222] dark:text-gray-200 mb-3">
            我的社群运营
          </h2>
          <p>
            <strong className="text-[#333] dark:text-gray-100">不制造焦虑</strong>，讲究<strong className="text-[#333] dark:text-gray-100">细水长流</strong>。
            希望这里是一个真实、松弛的空间。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-[#222] dark:text-gray-200 mb-3">
            目的
          </h2>
          <p>
            <strong className="text-[#333] dark:text-gray-100">真实的交友</strong>、<strong className="text-[#333] dark:text-gray-100">及时分享信息</strong>。
            仅此而已。
          </p>
        </section>

      </article>
    </div>
  )
}
