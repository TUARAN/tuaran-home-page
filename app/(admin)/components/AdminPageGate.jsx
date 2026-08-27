/**
 * Admin 页面授权由 middleware 在返回页面或 RSC 内容前统一完成。
 * 组件保留为语义边界，避免每个页面直接依赖 cookies()/headers() 而被迫进入 Worker。
 * 所有后台 API 仍须独立调用 getOwnerOrReject，不能依赖页面层授权。
 */
export default function AdminPageGate({ children }) {
  return children
}
