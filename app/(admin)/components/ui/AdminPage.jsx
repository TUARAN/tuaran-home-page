/**
 * 统一的后台页面容器：标题区 + 描述 + 操作槽 + 一致的边距/宽度。
 * 所有 admin 子控制台都套这层，消除「各写各的 <main>」。
 */
export default function AdminPage({ title, description, actions, children, maxWidth = '1100px' }) {
  return (
    <main className="mx-auto w-full px-4 py-7 md:px-6 md:py-9" style={{ maxWidth }}>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-[1.55rem] font-semibold text-[#15140f] dark:text-gray-100 md:text-[1.75rem]">
            {title}
          </h1>
          {description ? (
            <p className="mb-0 mt-1.5 max-w-[48rem] text-[13.5px] leading-7 text-[#56564e] dark:text-gray-400">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </main>
  )
}
