/** 工具条：过滤器 / 按钮的横向容器，两端对齐、移动端换行。 */
export default function Toolbar({ left, right, children, className = '' }) {
  if (children) {
    return <div className={`flex flex-wrap items-center gap-2 ${className}`}>{children}</div>
  }
  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">{left}</div>
      {right ? <div className="flex flex-wrap items-center gap-2">{right}</div> : null}
    </div>
  )
}
