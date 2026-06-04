import CancersOverviewClient from './CancersOverviewClient'

export const dynamic = 'force-static'

export const metadata = {
  title: '癌症全景 · 发病 / 死亡 / 生存 / 风险因子可视化',
  description:
    '10 种主要癌症的发病率、死亡率、5 年生存率、性别 / 年龄分布与关键风险因子，数据基于 GLOBOCAN 2022 与 US SEER；支持筛选与分享。本页为科普整理，不构成医学建议。',
  alternates: {
    canonical: '/cancers-overview',
  },
}

export default function CancersOverviewPage() {
  return <CancersOverviewClient />
}
