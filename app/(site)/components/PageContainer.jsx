// 全站统一的内容容器宽度，避免各页面手写 max-w-* 导致宽度散落。
// 三档语义宽度（详见 CLAUDE.md / 站点布局约定）：
//   narrow   896px  长文阅读、单列正文（articles / diary / 人物 / history 等）
//   standard 1120px 默认页面，与页脚 SiteFooter 对齐
//   wide     1880px 首页与超密集网格，与 SiteHeader 对齐
const WIDTH = {
  narrow: 'max-w-4xl',
  standard: 'max-w-[1120px]',
  wide: 'max-w-[1880px]',
}

export default function PageContainer({
  width = 'standard',
  as: Comp = 'main',
  className = '',
  children,
  ...rest
}) {
  return (
    <Comp className={`mx-auto w-full ${WIDTH[width]} px-4 ${className}`} {...rest}>
      {children}
    </Comp>
  )
}
