import Image from 'next/image'
import Link from 'next/link'
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconBrandWechat,
  IconCircleCheck,
  IconNetwork,
  IconRadar,
  IconShieldCheck,
  IconSparkles,
  IconWorld,
} from '@tabler/icons-react'

import PageContainer from '../../components/PageContainer'
import { DOMAIN_SERVICE_DOMAINS } from '../../../../lib/workItems'

export const dynamic = 'force-static'

export const metadata = {
  title: '域名服务',
  description: '查看 TUARAN 当前持有的域名；如有购买意向，可扫码添加微信咨询。',
  keywords: ['域名服务', '域名购买', '域名资产', 'TUARAN'],
  alternates: { canonical: '/products/domain-service' },
  openGraph: {
    title: '域名服务',
    description: '查看 TUARAN 当前持有的域名；如有购买意向，可扫码添加微信咨询。',
    url: '/products/domain-service',
    type: 'website',
  },
}

const domainServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: '域名服务',
  description: '查看 TUARAN 当前持有的域名；如有购买意向，可扫码添加微信咨询。',
  url: 'https://2aran.com/products/domain-service',
  inLanguage: 'zh-CN',
}

const HERO_DOMAINS = ['2aran.com', 'blogger-alliance.cn', 'frontendnext.com']

function DomainOrb({ children, className = '' }) {
  return (
    <span className={`absolute rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 font-mono text-[10px] text-white/70 shadow-[0_10px_40px_rgba(0,0,0,0.24)] backdrop-blur-md ${className}`}>
      {children}
    </span>
  )
}

export default function DomainServicePage() {
  const activeCount = DOMAIN_SERVICE_DOMAINS.filter((item) => item.use === '在用').length
  const holdingCount = DOMAIN_SERVICE_DOMAINS.length - activeCount

  return (
    <PageContainer className="overflow-hidden py-4 md:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(domainServiceJsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="mx-auto max-w-6xl">
        <Link href="/works" className="mb-6 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--site-muted)] no-underline transition hover:-translate-x-0.5 hover:text-[var(--site-ink)]">
          <IconArrowLeft size={16} aria-hidden="true" />
          返回产品集
        </Link>

        <header className="relative isolate overflow-hidden rounded-[28px] border border-[#293756] bg-[#07111f] text-white shadow-[0_28px_90px_rgba(7,17,31,0.26)] md:rounded-[36px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(46,203,255,0.22),transparent_29%),radial-gradient(circle_at_22%_92%,rgba(123,92,255,0.22),transparent_34%),linear-gradient(135deg,#07111f_0%,#0b172a_52%,#101329_100%)]" />
          <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="absolute -right-24 -top-36 h-[420px] w-[420px] rounded-full border border-cyan-300/15" />
          <div className="absolute -right-10 -top-24 h-[300px] w-[300px] rounded-full border border-cyan-300/15" />

          <div className="relative grid min-h-[520px] gap-10 px-6 py-8 sm:px-10 md:grid-cols-[minmax(0,1fr)_420px] md:items-center md:px-14 md:py-14 lg:px-16">
            <div className="relative z-10">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/[0.08] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-100">
                <span className="h-1.5 w-1.5 rounded-full bg-[#53f5bf] shadow-[0_0_12px_#53f5bf]" />
                Domain Portfolio · 2026
              </div>
              <h1 className="mb-5 max-w-xl break-words text-[42px] font-black leading-[0.96] tracking-[-0.055em] text-white sm:text-[58px] md:text-[66px]">
                给好名字，
                <span className="block bg-gradient-to-r from-[#73e9ff] via-[#adbdff] to-[#d3a9ff] bg-clip-text text-transparent">一个长期入口。</span>
              </h1>
              <p className="mb-0 max-w-xl text-[15px] leading-7 text-slate-300 md:text-[16px] md:leading-8">
                一组围绕个人品牌、内容产品、创作者服务与品牌实验持续积累的域名资产。部分域名开放购买咨询。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#domain-list" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[13px] font-bold text-[#07111f] no-underline transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(255,255,255,0.18)]">
                  浏览域名资产 <IconArrowUpRight size={16} />
                </a>
                <a href="#contact" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-5 py-3 text-[13px] font-bold text-white no-underline backdrop-blur-md transition hover:border-white/35 hover:bg-white/[0.1]">
                  <IconBrandWechat size={17} /> 购买咨询
                </a>
              </div>
            </div>

            <div className="relative mx-auto h-[330px] w-full max-w-[410px]" aria-hidden="true">
              <div className="absolute left-1/2 top-1/2 h-[270px] w-[270px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-200/15" />
              <div className="absolute left-1/2 top-1/2 h-[195px] w-[195px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-violet-200/25" />
              <div className="absolute left-1/2 top-1/2 h-[115px] w-[115px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-300/25 to-violet-400/20 blur-xl" />
              <div className="absolute left-1/2 top-1/2 flex h-[104px] w-[104px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[30px] border border-white/20 bg-white/[0.09] shadow-[0_0_70px_rgba(92,220,255,0.2)] backdrop-blur-xl">
                <IconWorld size={46} stroke={1.25} className="text-cyan-100" />
              </div>
              <DomainOrb className="left-0 top-12">{HERO_DOMAINS[0]}</DomainOrb>
              <DomainOrb className="right-0 top-5">{HERO_DOMAINS[1]}</DomainOrb>
              <DomainOrb className="bottom-9 right-3">{HERO_DOMAINS[2]}</DomainOrb>
              <div className="absolute bottom-3 left-5 flex items-center gap-2 rounded-2xl border border-white/15 bg-[#091525]/80 px-4 py-3 shadow-xl backdrop-blur-md">
                <IconRadar size={21} className="text-[#62f0c1]" />
                <div>
                  <p className="mb-0 font-mono text-[18px] font-bold leading-none text-white">{DOMAIN_SERVICE_DOMAINS.length}</p>
                  <p className="mb-0 mt-1 text-[9px] uppercase tracking-[0.16em] text-white/45">digital coordinates</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative grid border-t border-white/10 bg-black/10 sm:grid-cols-3">
            {[
              ['总持有', `${DOMAIN_SERVICE_DOMAINS.length}`, '独立域名'],
              ['投入使用', `${activeCount}`, '产品与品牌入口'],
              ['资产储备', `${holdingCount}`, '备用与实验域'],
            ].map(([label, value, detail]) => (
              <div key={label} className="flex items-center gap-4 border-b border-white/10 px-7 py-5 last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
                <strong className="font-mono text-[26px] text-white">{value}</strong>
                <div>
                  <p className="mb-0 text-[12px] font-bold text-white/85">{label}</p>
                  <p className="mb-0 mt-0.5 text-[10px] text-white/40">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </header>

        <div className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-start lg:py-14">
          <section id="domain-list" aria-labelledby="domain-list-title" className="scroll-mt-28">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[#7357d3] dark:text-[#bba8ff]">
                  <IconNetwork size={18} />
                  <p className="mb-0 font-mono text-[10px] font-bold uppercase tracking-[0.22em]">Asset map</p>
                </div>
                <h2 id="domain-list-title" className="mb-0 border-0 p-0 text-[28px] font-black tracking-[-0.03em] md:text-[34px]">域名资产地图</h2>
              </div>
              <span className="hidden rounded-full border border-[var(--site-line)] px-3 py-1.5 text-[11px] text-[var(--site-faint)] sm:inline-flex">不含子域名</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {DOMAIN_SERVICE_DOMAINS.map((item, index) => {
                const active = item.use === '在用'
                return (
                  <article key={item.domain} className="group relative overflow-hidden rounded-2xl border border-[var(--site-line)] bg-white/65 p-5 transition duration-300 hover:-translate-y-1 hover:border-[#9a8cd4] hover:shadow-[0_18px_45px_rgba(65,52,116,0.11)] dark:bg-[#101721]/75 dark:hover:border-[#7060ae]">
                    <div className="absolute -right-7 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-cyan-300/0 to-violet-400/10 transition duration-500 group-hover:scale-150" />
                    <div className="relative flex items-start justify-between gap-4">
                      <span className="font-mono text-[10px] text-[var(--site-faint)]">/{String(index + 1).padStart(2, '0')}</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold ${active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-violet-500/10 text-violet-700 dark:text-violet-300'}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-violet-500'}`} />
                        {item.use}
                      </span>
                    </div>
                    <h3 className="relative mb-2 mt-7 border-0 p-0 font-mono text-[16px] font-black tracking-[-0.025em] text-[var(--site-ink)] sm:text-[17px]">{item.domain}</h3>
                    <p className="relative mb-0 min-h-10 text-[12px] leading-5 text-[var(--site-muted)]">{item.role}</p>
                    <div className="relative mt-4 flex items-center gap-2 border-t border-[var(--site-line)] pt-3 text-[10px] text-[var(--site-faint)]">
                      <IconCircleCheck size={14} className={active ? 'text-emerald-500' : 'text-violet-500'} />
                      DNS / Brand / Identity
                    </div>
                  </article>
                )
              })}
            </div>
          </section>

          <aside id="contact" className="scroll-mt-28 space-y-4 lg:sticky lg:top-[calc(var(--site-header-height)+24px)]">
            <div className="relative overflow-hidden rounded-[28px] border border-[#222f45] bg-[#0a1423] p-6 text-center text-white shadow-[0_22px_55px_rgba(9,20,35,0.18)]">
              <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_50%_0%,rgba(87,223,255,0.18),transparent_68%)]" />
              <div className="relative mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-bold text-emerald-200">
                <IconSparkles size={14} /> AVAILABLE FOR INQUIRY
              </div>
              <h2 className="relative mb-2 border-0 p-0 text-[22px] font-black">发现感兴趣的名字？</h2>
              <p className="relative mb-5 text-[12px] leading-6 text-slate-400">扫码添加微信，备注“域名 + 感兴趣的域名”。是否出售与价格以沟通结果为准。</p>
              <div className="relative mx-auto w-fit rounded-[22px] bg-white p-3 shadow-[0_16px_35px_rgba(0,0,0,0.25)]">
                <Image src="/qrcodewechat3.png" alt="域名购买咨询微信二维码" width={190} height={190} unoptimized className="h-[190px] w-[190px] rounded-xl" />
              </div>
              <div className="relative mt-5 flex items-center justify-center gap-2 text-[12px] text-slate-300">
                <IconBrandWechat size={16} className="text-[#5ee193]" />
                微信 <span className="font-mono font-bold text-white">atar24</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-[var(--site-line)] bg-white/55 p-4 dark:bg-[#101721]/70">
                <IconShieldCheck size={20} className="mb-3 text-[#5678d7]" />
                <p className="mb-1 text-[12px] font-bold">一对一沟通</p>
                <p className="mb-0 text-[10px] leading-5 text-[var(--site-faint)]">确认用途、报价与转移方式</p>
              </div>
              <div className="rounded-2xl border border-[var(--site-line)] bg-white/55 p-4 dark:bg-[#101721]/70">
                <IconWorld size={20} className="mb-3 text-[#8b65d6]" />
                <p className="mb-1 text-[12px] font-bold">独立域名</p>
                <p className="mb-0 text-[10px] leading-5 text-[var(--site-faint)]">列表不包含任何子域名</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageContainer>
  )
}
