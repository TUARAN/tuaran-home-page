import Link from 'next/link'

/**
 * 私域 Gate
 * 用于「只有 tuaran 本人能看」的页面，把陌生访客/普通登录用户挡在 UI 层面，
 * 同时不把页面包装成「请注册我吧」。
 *
 * 三种状态：
 *  - state="anonymous"   未登录访客 → 私域提示 + 不显眼的「我是涂阿燃」小链接
 *  - state="not-owner"   已登录但不是 owner → 私域提示 + 返回 / 退出，不暗示能解锁
 *  - state="loading"     还在确认 session → 简单占位
 *
 * 设计要点：
 *  - 不出现「登录」「注册」字样作为主 CTA，避免把私域伪装成公共服务
 *  - owner 入口存在但弱化，给真正的站长一个进入点
 *  - 文案统一为「私域内容 · 仅作者本人可见」
 */
export default function PrivateVaultGate({
  state = 'anonymous',
  vaultLabel = '私域内容',
  description,
  returnTo = '/',
  logoutHref = '/api/auth/logout?returnTo=/',
}) {
  const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`

  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-[560px] flex-col justify-center px-4 py-12">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#8f8069] dark:text-[#8e9ab0]">
        Private · 仅站长可见
      </p>
      <h1 className="mt-3 font-serif text-2xl font-semibold text-[#221f19] dark:text-gray-100">
        {vaultLabel}
      </h1>
      <p className="mt-4 text-[14px] leading-7 text-[#5d554a] dark:text-gray-300">
        {description || '这是站长（涂阿燃）本人的私域空间，里面是私人数据、家庭记录或工作底稿，不向公众开放。'}
      </p>

      {state === 'loading' ? (
        <p className="mt-6 font-mono text-xs text-[#8f8069] dark:text-[#8e9ab0]">checking session…</p>
      ) : state === 'not-owner' ? (
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          <span className="text-[#7a6f5d] dark:text-gray-400">当前账号没有访问权限。</span>
          <Link
            href="/"
            className="text-[#5d503f] underline underline-offset-2 hover:text-[#221f19] dark:text-gray-200 dark:hover:text-white"
          >
            返回首页
          </Link>
          <a
            href={logoutHref}
            className="text-[#8f8069] underline underline-offset-2 hover:text-[#5d503f] dark:text-gray-500 dark:hover:text-gray-300"
          >
            退出登录
          </a>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
          <Link
            href="/"
            className="text-[#5d503f] underline underline-offset-2 hover:text-[#221f19] dark:text-gray-200 dark:hover:text-white"
          >
            返回首页
          </Link>
          <span className="text-[#bbae93] dark:text-[#5a4f3a]" aria-hidden="true">·</span>
          <a
            href={loginHref}
            className="text-[#8f8069] underline underline-offset-2 hover:text-[#5d503f] dark:text-gray-500 dark:hover:text-gray-300"
          >
            我是涂阿燃 →
          </a>
        </div>
      )}
    </main>
  )
}
