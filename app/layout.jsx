import './globals.css'

export const metadata = {
  title: {
    default: '涂阿燃的网络日志',
    template: '%s · 涂阿燃的网络日志',
  },
  description: '涂阿燃的网络日志：AKA 掘金安东尼 / 安东尼404。分享编程与生活。',
}

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
