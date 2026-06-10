import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: '项目经理 | tuaran',
  description: 'PMP 证书与项目管理背景展示页面。',
}

export default function ProjectManagerPage() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 py-8">
      <section className="rounded-[24px] border border-[#dcded6] bg-[#f9faf7] p-5 shadow-[0_12px_40px_rgba(82,69,45,0.06)] dark:border-[#252d36] dark:bg-[#0f141b] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.24em] text-[#858876] dark:text-[#8e9ab0]">
              Project Management
            </p>
            <h1 className="home-section-title mb-2">项目经理 · PMP 认证</h1>
            <p className="mb-0 text-[14px] leading-7 text-[#5d5d55] dark:text-gray-300">
              已通过 PMI（Project Management Institute）PMP 认证，证书有效期至 2028 年 3 月。
            </p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[#d1d3cb] bg-white/90 px-4 py-1.5 text-[12px] text-[#53554d] no-underline transition hover:border-[#b2b4a6] hover:text-[#252620] dark:border-[#2d3440] dark:bg-[#121821] dark:text-gray-300 dark:hover:border-[#3b4656] dark:hover:text-gray-100"
          >
            返回首页
          </Link>
        </div>

        <a
          href="/certifications/pmp-certificate.png"
          target="_blank"
          rel="noreferrer"
          className="no-external-arrow block overflow-hidden rounded-2xl border border-[#d9dad2] bg-white shadow-[0_16px_40px_rgba(82,69,45,0.08)] transition hover:shadow-[0_22px_52px_rgba(82,69,45,0.13)] dark:border-[#2a3440] dark:bg-[#0f141b]"
        >
          <Image
            src="/certifications/pmp-certificate.png"
            alt="PMP 证书"
            width={1280}
            height={905}
            className="h-auto w-full object-contain"
            priority
          />
        </a>
      </section>
    </div>
  )
}
