/** 工具条：过滤器 / 按钮的横向容器，两端对齐、移动端换行。 */
export default function Toolbar({ left, right, children, className = '' }) {
  if (children) {
    return <div className={`flex flex-wrap items-center gap-2 ${className}`}>{children}</div>
  }
  return (
    <div className={`flex min-w-0 w-full max-w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between ${className}`}>
      <div className="flex min-w-0 w-full max-w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">{left}</div>
      {right ? <div className="flex min-w-0 w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">{right}</div> : null}
    </div>
  )
}
