import PrivateVaultGate from '../components/PrivateVaultGate'
import { getOwnerPageState } from '../../../lib/adminPageAuth'
import BookmarkNavigationClient from './BookmarkNavigationClient'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '书签导航',
  description: '站长私有的 Chrome 书签导航、分类检索与导入审计。',
  alternates: { canonical: 'https://bookmarks.2aran.com/' },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default async function BookmarkNavigationPage() {
  const { state } = await getOwnerPageState()
  if (state !== 'owner') {
    return (
      <PrivateVaultGate
        state={state}
        vaultLabel="书签导航"
        returnTo="/bookmark-nav"
        loginHref="https://2aran.com/login?returnTo=https%3A%2F%2Fbookmarks.2aran.com%2F"
        description="Chrome 书签中包含私人工作入口和管理控制台，因此仅站长本人可见。"
      />
    )
  }

  return <BookmarkNavigationClient />
}
