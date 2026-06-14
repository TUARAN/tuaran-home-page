/** 带标题的内容分区卡（白底 + 0.5px 边 + 圆角）。 */
export default function Section({ title, description, actions, children, className = '' }) {
  return (
    <section
      className={`rounded-xl border border-[#e2e3da] bg-white dark:border-[#1e2733] dark:bg-[#10161f] ${className}`}
    >
      {title || actions ? (
        <header className="flex items-start justify-between gap-3 border-b border-[#eceee6] px-4 py-3 dark:border-[#1b2430] md:px-5">
          <div className="min-w-0">
            {title ? (
              <h2 className="font-serif text-[1.05rem] font-semibold text-[#15140f] dark:text-gray-100">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mb-0 mt-0.5 text-[12.5px] leading-6 text-[#67695d] dark:text-gray-400">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className="px-4 py-4 md:px-5">{children}</div>
    </section>
  )
}
