import WallpaperGallery from './WallpaperGallery'
import { T } from '../../components/LocaleProvider'
import PageContainer from '../../components/PageContainer'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export const metadata = {
  title: '壁纸下载｜可下载壁纸资源',
  description:
    '涂阿燃（tuaran）整理的可下载壁纸资源：自然、抽象、极简与城市等主题，存储于 Cloudflare R2，支持按分类筛选与原图下载。',
  keywords: ['壁纸下载', '壁纸资源', '高清壁纸', '桌面壁纸', '涂阿燃', 'tuaran', 'wallpaper'],
  alternates: {
    canonical: '/resources/wallpapers',
  },
  openGraph: {
    title: '壁纸下载｜可下载壁纸资源',
    description: '按主题整理的可下载壁纸，存储于 Cloudflare R2，支持原图下载。',
    url: 'https://2aran.com/resources/wallpapers',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function WallpapersPage() {
  return (
    <PageContainer className="py-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          <T zh="壁纸下载" en="Wallpapers" />
        </h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          <T
            zh="按主题整理的可下载壁纸，点选分类筛选，点「下载」获取原图。"
            en="Downloadable wallpapers organized by theme. Filter by category and click Download for the full-resolution image."
          />
        </p>
      </header>

      <WallpaperGallery />
    </PageContainer>
  )
}
