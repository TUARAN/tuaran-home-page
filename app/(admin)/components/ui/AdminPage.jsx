/**
 * 统一的后台页面容器：标题区 + 描述 + 操作槽 + 一致的边距/宽度。
 * 所有 admin 子控制台都套这层，消除「各写各的 <main>」。
 */
export default function AdminPage({ title, description, actions, children, compact = false }) {
  return (
    <main
      className={`admin-page mx-auto w-full ${
        compact ? 'admin-page--compact py-5' : 'px-4 py-7 sm:px-5 md:px-6 md:py-8'
      }`}
    >
      {!compact ? (
        <header className="admin-page__header mb-6 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="admin-page__title font-serif text-[1.55rem] font-semibold tracking-[-0.02em] md:text-[1.75rem]">
              {title}
            </h1>
            {description ? (
              <p className="admin-page__description mb-0 mt-1.5 max-w-[48rem] text-[13px] leading-6">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </main>
  )
}
