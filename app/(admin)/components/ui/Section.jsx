/** 带标题的内容分区卡（白底 + 0.5px 边 + 圆角）。 */
export default function Section({ title, description, actions, children, className = '' }) {
  return (
    <section
      className={`admin-section rounded-xl border ${className}`}
    >
      {title || actions ? (
        <header className="admin-section__header flex items-start justify-between gap-3 border-b px-4 py-3.5 md:px-5">
          <div className="min-w-0">
            {title ? (
              <h2 className="admin-section__title font-serif text-[1.05rem] font-semibold">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="admin-section__description mb-0 mt-0.5 text-[12.5px] leading-6">
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
