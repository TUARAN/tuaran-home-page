import { SessionProvider } from '../(site)/components/SessionProvider'
import { ThemeProvider } from '../(site)/components/ThemeProvider'

export const metadata = {
  title: '后台管理',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function AdminLayout({ children }) {
  return (
    <ThemeProvider>
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  )
}
