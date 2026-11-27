/** x.2aran.com 路由切换时的占位：白底 + X 蓝骨架，不用主站灰绿 GenericLoading。 */
export default function XRouteLoading() {
  return (
    <div className="x-route-loading" role="status" aria-busy="true" aria-label="正在加载页面">
      <span className="sr-only">正在加载页面</span>
      <div className="x-route-loading__bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}