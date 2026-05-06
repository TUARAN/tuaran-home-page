// 根 loading 是导航到任意路由时的默认骨架。各个特殊布局的路由（如
// /traffic、/web-llm 等）有自己的 loading.jsx 时会覆盖掉这一份。
// 设计原则：尽量中性 —— 只暗示有「标题 + 一段说明 + 一些内容」的结构，
// 不强行画 sidebar/列表/网格，避免在错误布局的页面上闪烁。
export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-8 border-b border-[#eee] dark:border-gray-800 pb-4">
        <div className="h-8 w-40 bg-[#eee] dark:bg-gray-800 animate-pulse" />
        <div className="mt-3 h-4 w-64 bg-[#eee] dark:bg-gray-800 animate-pulse" />
      </header>

      <div className="space-y-3">
        <div className="h-4 w-full bg-[#eee] dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-11/12 bg-[#eee] dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-10/12 bg-[#eee] dark:bg-gray-800 animate-pulse" />
        <div className="h-4 w-9/12 bg-[#eee] dark:bg-gray-800 animate-pulse" />
      </div>
    </div>
  )
}
