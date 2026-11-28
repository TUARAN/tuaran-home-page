/**
 * 统一的后台页面容器：标题区 + 描述 + 操作槽 + 一致的边距/宽度。
 * 所有 admin 子控制台都套这层，消除「各写各的 <main>」。
 * stickyHeader：把标题 + 右上角操作区固定在顶部（钉在 AdminTopbar 下方），
 * 适用于长列表页（如内容管理），避免滚动后头部“一会显示一会又消失”。
 * hideTitle：书籍样式页由书封承担标题，隐藏可见标题区（h1 仅留给读屏），actions 仍显示。
 */
export default function AdminPage({ title, description, actions, children, compact = false, stickyHeader = false, notificationTargetReady, embedded = false, hideTitle = false }) {
  if (embedded) {
    if (notificationTargetReady === undefined) return children
    return (
      <div id="notification-destination" data-notification-ready={notificationTargetReady ? 'true' : 'false'}>
        {children}
      </div>
    )
  }

  return (
    <main
      id={notificationTargetReady === undefined ? undefined : 'notification-destination'}
      data-notification-ready={notificationTargetReady === undefined ? undefined : notificationTargetReady ? 'true' : 'false'}
      className={`admin-page mx-auto min-w-0 w-full ${
        compact ? 'admin-page--compact py-5' : 'px-4 py-7 sm:px-5 md:px-6 md:py-8'
      }`}
    >
      {!compact && hideTitle ? (
        <>
          <h1 className="sr-only">{title}</h1>
          {actions ? <div className="mb-4 flex flex-wrap items-center justify-end gap-2">{actions}</div> : null}
        </>
      ) : null}
      {!compact && !hideTitle ? (
        <header
          className={`admin-page__header mb-6 flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between ${
            stickyHeader ? 'admin-page__header--sticky' : ''
          }`}
        >
          <div className="min-w-0">
            <h1 className="admin-page__title font-serif text-[1.55rem] font-semibold tracking-[-0.02em] md:text-[1.75rem]">
              {title}
            </h1>
            {description ? (
              <p className="admin-page__description mb-0 mt-1.5 max-w-[48rem] break-words text-[13px] leading-6 [overflow-wrap:anywhere]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex w-full min-w-0 shrink-0 flex-wrap items-center gap-2 sm:w-auto">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </main>
  )
}
