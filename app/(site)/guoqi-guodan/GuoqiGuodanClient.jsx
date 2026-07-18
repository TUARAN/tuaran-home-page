'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  IconAlertTriangle,
  IconArrowDown,
  IconArrowUpRight,
  IconBuildingBank,
  IconBuildingFactory2,
  IconCashBanknote,
  IconCheck,
  IconChecklist,
  IconFileInvoice,
  IconInfoCircle,
  IconRoute,
  IconScale,
  IconShieldCheck,
  IconTruckDelivery,
  IconX,
} from '@tabler/icons-react'

import PageContainer from '../components/PageContainer'
import SharePageButton from '../components/SharePageButton'
import styles from './guoqi-guodan.module.css'

const PAGE_URL = 'https://2aran.com/guoqi-guodan'

const SCENARIOS = [
  {
    id: 'finance',
    short: '垫资融资',
    label: '场景 1｜融资性“过单”',
    level: '高风险',
    tone: 'red',
    intro: '民企需要资金，国企以采购付款、赊销回款的形式提供资金。贸易只是资金拆借的外衣。',
    parties: ['上游民企', '国企通道', '下游民企'],
    steps: [
      ['签采购合同', '国企向上游支付全款'],
      ['签销售合同', '下游约定 1—3 个月后付款'],
      ['单据流转', '合同、仓单、发票形成闭环'],
      ['回款加价', '固定差价实质接近资金成本'],
    ],
    signals: ['上下游同一实控人或存在特定关系', '标的物一直由对方控制', '国企收益固定且只关心回款', '合同期限与资金期限高度吻合'],
    essence: '名为买卖，可能实为出借资金；是否构成融资性贸易，要综合商业实质判断。',
  },
  {
    id: 'revenue',
    short: '冲量营收',
    label: '场景 2｜空转 / 循环“过单”',
    level: '高风险',
    tone: 'red',
    intro: '民企需要流水、投标或融资数据，国企需要账面营收；各方通过循环合同、资金与发票放大交易规模。',
    parties: ['民企 A', '国企', '民企 B / 关联方'],
    steps: [
      ['拼接链条', '人为增加没有必要的交易环节'],
      ['循环开票', '同类标的短时间内多次转手'],
      ['资金回流', '交易款沿预设路径形成闭环'],
      ['账面增收', '以低毛利换取大额营业收入'],
    ],
    signals: ['毛利极低但规模异常大', '采购与销售同步锁定', '没有独立定价和客户开发', '资金在关联主体间快速回流'],
    essence: '缺少商业实质的虚假贸易，核心是做大收入或流水，而非完成真实商品经营。',
  },
  {
    id: 'supply',
    short: '真实供应链',
    label: '场景 3｜正常供应链业务',
    level: '需实质核验',
    tone: 'green',
    intro: '民企使用国企的采购、仓储、结算、进出口或渠道能力；国企提供真实服务，并承担与收益匹配的经营风险。',
    parties: ['真实供应商', '供应链服务方', '真实采购方'],
    steps: [
      ['真实采购', '货物、数量、价格可被验证'],
      ['控制货权', '入库、仓单、提货权受控'],
      ['履行交付', '实物流或可验证的占有改定'],
      ['承担风险', '价格、质量、库存、信用风险真实存在'],
    ],
    signals: ['合同、资金、发票、物流可相互印证', '货权边界和交付节点清楚', '服务内容与收费可以解释', '国企有独立风控与处置能力'],
    essence: '有真实商业目的与履约能力。货物是否“物理搬家”只是证据之一，不能取代对货权和风险的核验。',
  },
]

const RED_FLAGS = [
  '上下游由同一实际控制人控制，或存在未披露的特定利益关系',
  '采购与销售合同几乎同时锁定，价格只按固定年化或固定手续费计算',
  '国企不能独立控制仓单、提货权、货物处置或销售对象',
  '没有可交叉核验的物流、入库、质检、交割或现场盘点证据',
  '资金最终回到起点，或由上下游相互代付、过桥、回流',
  '交易毛利极低但规模异常大，主要目标是完成营收或流水指标',
  '尽调、授信、定价、合同、验收由同一人员或外部合作方主导',
]

const SOURCES = [
  {
    label: '国资委：2023 年责任追究工作通知',
    note: '对融资性贸易、“空转”“走单”虚假业务明确“零容忍”。',
    url: 'https://wap.sasac.gov.cn/n2588030/n2588959/c27700648/content.html',
    tag: '监管口径',
  },
  {
    label: '国资委令第 46 号',
    note: '《中央企业违规经营投资责任追究实施办法》自 2026 年 1 月 1 日施行，建立责任认定与追究框架。',
    url: 'https://www.sasac.gov.cn/n2588035/c35128064/content.html',
    tag: '责任追究',
  },
  {
    label: '广州市国资委：融资性贸易界定',
    note: '列出虚构背景、关联上下游、货物由对方控制、变相提供资金等识别特征。',
    url: 'https://gzw.gz.gov.cn/hd/dwzsk/cwjg/content/post_8875427.html',
    tag: '识别标准',
  },
  {
    label: '最高人民法院公报案例',
    note: '封闭式循环买卖在特定事实下被认定为以买卖形式掩盖的借贷关系。',
    url: 'https://gongbao.court.gov.cn/Details/bb06ea1a246a4aa770173c64f0f15b.html',
    tag: '裁判观察',
  },
  {
    label: '中央纪委国家监委：空转贸易案例分析',
    note: '从虚假贸易、资金拆借和国资损失角度讨论责任与刑事风险。',
    url: 'https://www.ccdi.gov.cn/hdjln/ywtt/202309/t20230913_293225.html',
    tag: '案例风险',
  },
  {
    label: '国家税务总局：发票管理规则',
    note: '发票应与实际经营业务相符；是否构成行政违法或犯罪，需要依据具体事实与法定要件判断。',
    url: 'https://zhejiang.chinatax.gov.cn/art/2024/5/17/art_24107_615514.html',
    tag: '税务边界',
  },
]

const toneClasses = {
  red: 'border-[#c86b5f]/35 bg-[#b84c3e]/[0.07] text-[#93382f] dark:text-[#ef9f94]',
  green: 'border-[#4d927f]/35 bg-[#2e7663]/[0.07] text-[#246451] dark:text-[#84c9b6]',
}

function SectionHeading({ eyebrow, title, copy, inverted = false }) {
  return (
    <div className="max-w-3xl">
      <p className={`m-0 font-mono text-[10px] font-black uppercase tracking-[0.24em] ${inverted ? 'text-[#edc883]' : 'text-[#85560e] dark:text-[#e1aa51]'}`}>{eyebrow}</p>
      <h2 className="m-0 mt-2 text-3xl font-black tracking-[-0.035em] text-[#12233b] dark:text-white md:text-4xl">{title}</h2>
      {copy ? <p className={`${inverted ? styles.darkPanelCopy : ''} m-0 mt-3 text-sm leading-7 text-[#617080] dark:text-[#9ca8b5]`}>{copy}</p> : null}
    </div>
  )
}

function ScenarioPanel({ scenario }) {
  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.25fr]">
      <div className="rounded-2xl border border-[#d8d1c3] bg-white/55 p-5 dark:border-white/10 dark:bg-white/[0.035] md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#7a6a55] dark:text-[#a99d8c]">{scenario.label}</span>
          <span className={`rounded-full border px-3 py-1 text-[11px] font-black ${toneClasses[scenario.tone]}`}>{scenario.level}</span>
        </div>
        <p className="mt-5 text-[15px] font-bold leading-8 text-[#253247] dark:text-[#dfe5ec]">{scenario.intro}</p>
        <div className="mt-6 flex flex-col gap-7 md:flex-row md:items-stretch">
          {scenario.parties.map((party, index) => (
            <div key={party} className={`${styles.flowLine} flex min-h-20 flex-1 items-center justify-center rounded-xl border border-[#d7cfbf] bg-[#f7f2e8] px-3 text-center text-xs font-black text-[#2c3a50] dark:border-white/10 dark:bg-black/15 dark:text-[#dde4ec]`}>
              <span><span className="mb-1 block font-mono text-[9px] text-[#a4752b]">0{index + 1}</span>{party}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border-l-4 border-[#d49427] bg-[#d49427]/[0.08] p-4 text-sm leading-7 text-[#5d4a2c] dark:text-[#dfc18e]">
          <strong className="block text-[#40331f] dark:text-[#f0d6a8]">实质判断</strong>
          {scenario.essence}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {scenario.steps.map(([title, copy], index) => (
          <article key={title} className="rounded-2xl border border-[#d8d1c3] bg-white/[0.48] p-5 dark:border-white/10 dark:bg-white/[0.025]">
            <span className="font-mono text-3xl font-black text-[#d7c6a5] dark:text-[#4e5661]">0{index + 1}</span>
            <h3 className="m-0 mt-5 text-base font-black text-[#15233a] dark:text-white">{title}</h3>
            <p className="m-0 mt-2 text-xs leading-6 text-[#657181] dark:text-[#9faab6]">{copy}</p>
          </article>
        ))}
        <div className="rounded-2xl border border-[#c9b98f] bg-[#efe7d3]/55 p-5 dark:border-[#5d5139] dark:bg-[#221f18] sm:col-span-2">
          <p className="m-0 mb-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#976917] dark:text-[#deb05e]">识别信号</p>
          <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
            {scenario.signals.map((signal) => (
              <li key={signal} className="flex gap-2 text-xs leading-6 text-[#594e3e] dark:text-[#cfc5b6]"><IconAlertTriangle size={14} className="mt-1.5 shrink-0 text-[#bb7f1d]" />{signal}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function GuoqiGuodanClient() {
  const [scenarioId, setScenarioId] = useState('finance')
  const [checked, setChecked] = useState([])
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) || SCENARIOS[0]
  const score = checked.length
  const verdict = useMemo(() => {
    if (score >= 5) return { label: '红色区：高度疑似缺少商业实质', copy: '应暂停新增敞口，由法务、财务、税务、风控与纪检监督共同复核，并保全合同、资金、货权和履约证据。', tone: 'red' }
    if (score >= 2) return { label: '黄色区：存在显著异常信号', copy: '不能仅凭合同和发票放行；需穿透关联关系、资金去向、货权控制、定价逻辑和真实交付。', tone: 'amber' }
    return { label: '绿色区：暂未发现集中红旗', copy: '这不等于自动合规。仍需逐笔确认真实商业目的、四流证据、会计处理和内部授权。', tone: 'green' }
  }, [score])

  const toggleFlag = (index) => {
    setChecked((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index])
  }

  return (
    <main className={`${styles.page} min-h-screen`}>
      <PageContainer width="wide" className="relative z-[1] py-7 md:py-10">
        <header className={`${styles.hero} surface-inverse p-5 md:p-10 lg:p-14`}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)] lg:items-end">
            <div>
              <div className="mb-7 flex flex-wrap items-center gap-2">
                <Link href="/rich-pages" className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[11px] font-bold text-white/75 no-underline hover:bg-white/10">多维页面</Link>
                <span className="rounded-full border border-[#d9a64e]/35 bg-[#d9a64e]/10 px-3 py-1.5 text-[11px] font-bold text-[#edc883]">国企贸易合规专题</span>
                <span className="font-mono text-[10px] text-white/45">UPDATED 2026.07.18</span>
              </div>
              <p className="m-0 font-mono text-[11px] font-black uppercase tracking-[0.3em] text-[#e2b45f]">Trade substance field guide</p>
              <h1 className="m-0 mt-4 max-w-5xl text-[40px] font-black leading-[1.03] tracking-[-0.055em] sm:text-[56px] lg:text-[72px]">
                国企“过单”是什么意思？<br /><span className="text-[#e4b65f]">一页看懂走单、空转贸易与融资性贸易</span>
              </h1>
              <p className={`${styles.heroCopy} m-0 mt-6 max-w-3xl text-[15px] leading-8 text-white/[0.66] md:text-base`}>
                行业里都叫“过单”，法律与监管判断却不看叫法，而看交易实质：有没有真实商业目的，谁控制货权，谁承担风险，资金为什么流动，合同、发票、资金与履约证据能否互相印证。
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href="#definition" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#e0aa4f] px-5 text-sm font-black text-[#182238] no-underline transition hover:-translate-y-0.5 hover:bg-[#efc373] dark:text-[#182238]">先看定义 <IconArrowDown size={17} /></a>
                <SharePageButton title="国企过单是什么意思？走单、空转贸易、融资性贸易全流程与风险详解" text="从交易实质判断正常供应链与违规空转走单。" url={PAGE_URL} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['3', '典型场景', IconRoute],
                ['4', '核心风险', IconAlertTriangle],
                ['5', '实质维度', IconChecklist],
                ['6', '官方来源', IconScale],
              ].map(([value, label, Icon]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 backdrop-blur">
                  <Icon size={18} className="text-[#e1b55e]" />
                  <strong className="mt-6 block font-mono text-3xl text-white">{value}</strong>
                  <span className="mt-1 block text-xs text-white/[0.48]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <nav aria-label="页面目录" className="my-6 overflow-x-auto rounded-2xl border border-[#d9d2c5] bg-white/55 px-3 py-2 dark:border-white/10 dark:bg-white/[0.035]">
          <div className="flex min-w-max items-center gap-1">
            {[
              ['定义', '#definition'], ['场景', '#scenarios'], ['动机', '#motives'], ['风险', '#risks'], ['自查', '#check'], ['依据', '#sources'],
            ].map(([label, href], index) => <a key={href} href={href} className="rounded-xl px-4 py-2 text-xs font-bold text-[#586779] no-underline hover:bg-[#12233b] hover:text-white dark:text-[#abb5c0] dark:hover:bg-white/10">0{index + 1} {label}</a>)}
          </div>
        </nav>

        <section id="definition" className="scroll-mt-24 py-9 md:py-14">
          <SectionHeading eyebrow="01 / Plain-language definition" title="先别问“货动没动”，先问交易到底在做什么" copy="“过单”不是统一的法律术语，而是行业口语。它可能指正常的代采代销，也可能指监管严禁的融资性贸易或“空转”“走单”虚假业务。" />
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            <article className="rounded-3xl border border-[#5d9a89]/35 bg-[#2e7663]/[0.07] p-6 md:p-8">
              <div className="flex items-center justify-between gap-3"><IconShieldCheck size={25} className="text-[#2e7663] dark:text-[#7dc4b0]" /><span className="rounded-full bg-[#2e7663] px-3 py-1 text-[10px] font-black text-white">真实供应链</span></div>
              <h3 className="m-0 mt-10 text-2xl font-black text-[#173f35] dark:text-[#a8ddcd]">真实交易，多一道专业服务环节</h3>
              <p className="mt-4 text-sm leading-8 text-[#4e6d65] dark:text-[#a8bbb5]">货物真实存在，国企或供应链企业能够控制货权并实际提供采购、仓储、结算、渠道或进出口服务，收益与承担的价格、质量、库存、信用风险相匹配。</p>
              <div className="mt-6 flex flex-wrap gap-2">{['真实商业目的', '货权可控制', '履约可验证', '风险收益匹配'].map((item) => <span key={item} className="rounded-full border border-[#4d927f]/25 bg-white/45 px-3 py-1.5 text-[11px] font-bold text-[#326b5c] dark:bg-white/5 dark:text-[#91cdbd]">{item}</span>)}</div>
            </article>
            <article className="rounded-3xl border border-[#c96b60]/35 bg-[#b84c3e]/[0.07] p-6 md:p-8">
              <div className="flex items-center justify-between gap-3"><IconAlertTriangle size={25} className="text-[#b84c3e] dark:text-[#ed9589]" /><span className="rounded-full bg-[#b84c3e] px-3 py-1 text-[10px] font-black text-white">虚假 / 融资性贸易</span></div>
              <h3 className="m-0 mt-10 text-2xl font-black text-[#6c2822] dark:text-[#f0b0a8]">单据像贸易，实质却是融资或冲量</h3>
              <p className="mt-4 text-sm leading-8 text-[#7a504b] dark:text-[#c6aaa6]">只按预设路径循环合同、资金与发票；中间方不控制货、不承担经营风险，收益表现为固定资金回报或通道费，核心目标是出借资金、放大营收或美化流水。</p>
              <div className="mt-6 flex flex-wrap gap-2">{['人为增加环节', '固定收益', '资金回流', '无独立经营判断'].map((item) => <span key={item} className="rounded-full border border-[#c96b60]/25 bg-white/45 px-3 py-1.5 text-[11px] font-bold text-[#8d4139] dark:bg-white/5 dark:text-[#e5a099]">{item}</span>)}</div>
            </article>
          </div>
          <div className="mt-5 flex gap-3 rounded-2xl border border-[#d9b86e]/40 bg-[#d49427]/[0.08] p-5 text-sm leading-7 text-[#654f2b] dark:text-[#ddc18e]">
            <IconInfoCircle size={19} className="mt-1 shrink-0" />
            <p className="m-0"><strong>关键纠偏：</strong>“货物原地不动”是风险信号，不是单独的违法结论。大宗商品可能通过仓单、指示交付或占有改定完成交付；真正要穿透的是货权、控制、定价、风险、资金与商业目的。</p>
          </div>
        </section>

        <section id="scenarios" className="scroll-mt-24 border-t border-[#d8d1c5] py-10 dark:border-white/10 md:py-14">
          <SectionHeading eyebrow="02 / Three operating patterns" title="国企 × 民企：三类常见场景逐步拆解" copy="点选场景查看交易路径。前两类通常聚焦资金或报表，第三类聚焦真实供应链能力；名称相似，实质完全不同。" />
          <div className="mt-7 flex flex-wrap gap-2" role="tablist" aria-label="过单场景">
            {SCENARIOS.map((item) => <button key={item.id} type="button" role="tab" aria-selected={scenarioId === item.id} onClick={() => setScenarioId(item.id)} className={`rounded-full border px-4 py-2.5 text-xs font-black transition ${scenarioId === item.id ? 'border-[#12233b] bg-[#12233b] text-white dark:border-[#e4b65f] dark:bg-[#e4b65f] dark:text-[#111a29]' : 'border-[#d2c9bb] bg-white/45 text-[#687383] hover:border-[#a89473] dark:border-white/10 dark:bg-white/[0.025] dark:text-[#aeb7c1]'}`}>{item.short}</button>)}
          </div>
          <ScenarioPanel scenario={scenario} />
        </section>

        <section id="motives" className="scroll-mt-24 border-t border-[#d8d1c5] py-10 dark:border-white/10 md:py-14">
          <SectionHeading eyebrow="03 / Incentive matrix" title="为什么一拍即合？因为双方交换的不是同一种东西" copy="民企常看中资金、流水与资质；国企一侧的错误激励可能来自营收考核、固定通道费和闲置授信。动机本身不是定性结论，但会解释交易为何偏离商业实质。" />
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {[
              { icon: IconBuildingFactory2, who: '民企一侧', color: '#2e7663', items: [['低成本融资', '借助国企信用与银行授信，取得原本难以获得的资金。'], ['美化经营数据', '放大营业收入、资金流水或交易规模，用于融资、投标或资本运作。'], ['借用能力与资质', '使用国企的准入、仓储、渠道、进出口和结算能力；其中真实服务可以合规。']] },
              { icon: IconBuildingBank, who: '国企一侧', color: '#b84c3e', items: [['完成营收考核', '以低毛利、高周转交易快速放大账面销售规模。'], ['赚固定通道费', '不承担商品经营风险，却按交易额或占款时间收取固定回报。'], ['变现授信资源', '将低成本融资能力转换为对外资金敞口，收益像利差而非贸易利润。']] },
            ].map(({ icon: Icon, who, color, items }) => (
              <article key={who} className="rounded-3xl border border-[#d7cfc1] bg-white/[0.48] p-6 dark:border-white/10 dark:bg-white/[0.025] md:p-8">
                <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ backgroundColor: `${color}16`, color }}><Icon size={22} /></span><h3 className="m-0 text-xl font-black text-[#18263b] dark:text-white">{who}</h3></div>
                <div className="mt-7 space-y-5">{items.map(([title, copy], index) => <div key={title} className="grid grid-cols-[28px_1fr] gap-3"><span className="font-mono text-xs font-black" style={{ color }}>0{index + 1}</span><div><h4 className="m-0 text-sm font-black text-[#263347] dark:text-[#e1e7ed]">{title}</h4><p className="m-0 mt-1 text-xs leading-6 text-[#697586] dark:text-[#9ba6b2]">{copy}</p></div></div>)}</div>
              </article>
            ))}
          </div>
        </section>

        <section id="risks" className={`${styles.darkPanel} surface-inverse scroll-mt-24 rounded-3xl bg-[#12233b] px-5 py-9 text-white md:px-9 md:py-12`}>
          <SectionHeading eyebrow="04 / Risk stack" title="违规“过单”的风险不是一条线，而是四层连锁反应" copy="先出现经营与资金风险，再向国资追责、民事重定性、发票与刑事责任扩散。是否触发哪一层，取决于具体事实、损失、主观认知与法定构成要件。" inverted />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ['01', '国资监管与追责', '融资性贸易及“空转”“走单”虚假业务一直是重点整治对象。发生损失或严重后果时，可能启动责任认定、组织处理、扣减薪酬等。', IconScale],
              ['02', '资金与坏账', '中间方往往先付款、后回款。一旦民企资金链断裂，缺少真实可处置货物和有效担保的风险敞口会迅速暴露。', IconCashBanknote],
              ['03', '民事重定性', '法院可能根据闭环交易、反常定价、固定收益等事实，认定名为买卖、实为借贷；合同效力和返还范围需个案判断。', IconFileInvoice],
              ['04', '税务与刑事', '发票与实际经营业务不符可能触发补税、滞纳金、行政处罚；达到犯罪构成要件的，单位及责任人员可能承担刑责。', IconAlertTriangle],
            ].map(([index, title, copy, Icon]) => (
              <article key={index} className="rounded-2xl border border-white/10 bg-white/[0.055] p-5">
                <div className="flex items-center justify-between"><span className="font-mono text-[11px] font-black text-[#e0ae55]">{index}</span><Icon size={19} className="text-white/45" /></div>
                <h3 className="m-0 mt-10 text-lg font-black">{title}</h3>
                <p className={`${styles.darkPanelCopy} m-0 mt-3 text-xs leading-6 text-white/[0.58]`}>{copy}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-[#e0ae55]/25 bg-[#e0ae55]/[0.08] p-5 text-xs leading-6 text-[#ead6ae]">
            <strong className="text-[#f4dfb7]">关于第 46 号令：</strong>它是 2026 年起施行的《中央企业违规经营投资责任追究实施办法》，提供中央企业违规经营投资责任追究框架；对融资性贸易、“空转”“走单”虚假业务的明确“零容忍”表述，可见于国资委 2023 年责任追究工作通知等文件。二者不应混为一条规定。
          </div>
        </section>

        <section id="check" className="scroll-mt-24 py-10 md:py-14">
          <SectionHeading eyebrow="05 / Interactive checklist" title="七问自查：这笔业务是在经营货，还是在经营资金和报表？" copy="勾选你已经观察到的异常。结果只用于初筛，不替代律师、税务师、会计师和企业内部合规程序的个案意见。" />
          <div className="mt-7 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
            <div className="space-y-3">
              {RED_FLAGS.map((flag, index) => {
                const active = checked.includes(index)
                return <button key={flag} type="button" onClick={() => toggleFlag(index)} aria-pressed={active} className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${active ? 'border-[#b84c3e]/45 bg-[#b84c3e]/[0.08]' : 'border-[#d8d0c2] bg-white/45 hover:border-[#b6a585] dark:border-white/10 dark:bg-white/[0.025]'}`}><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${active ? 'border-[#b84c3e] bg-[#b84c3e] text-white' : 'border-[#b8ac9b] text-transparent dark:border-white/25'}`}><IconCheck size={13} /></span><span className="text-sm font-medium leading-6 text-[#3e4b5c] dark:text-[#c5cdd5]">{flag}</span></button>
              })}
            </div>
            <aside className="h-fit rounded-3xl border border-[#d6cdbf] bg-[#ece5d6] p-6 dark:border-white/10 dark:bg-[#161d27] md:p-8 xl:sticky xl:top-24">
              <p className="m-0 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#8b6c38] dark:text-[#d6ad68]">Current signal</p>
              <div className="mt-5 flex items-end gap-2"><strong className="font-mono text-6xl leading-none text-[#17243a] dark:text-white">{score}</strong><span className="mb-1 text-sm text-[#7b7061] dark:text-[#9da6b1]">/ 7 项</span></div>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><div className={`${styles.riskMeter} h-full rounded-full transition-all`} style={{ width: `${Math.max(4, score / 7 * 100)}%` }} /></div>
              <h3 className={`m-0 mt-7 text-lg font-black ${verdict.tone === 'red' ? 'text-[#a33f35] dark:text-[#f09c91]' : verdict.tone === 'amber' ? 'text-[#976615] dark:text-[#e2b762]' : 'text-[#256553] dark:text-[#81c7b4]'}`}>{verdict.label}</h3>
              <p className="m-0 mt-3 text-sm leading-7 text-[#5e6670] dark:text-[#a7b0ba]">{verdict.copy}</p>
              {score > 0 ? <button type="button" onClick={() => setChecked([])} className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#6f6557] underline underline-offset-4 dark:text-[#aab2bb]"><IconX size={14} />清空重测</button> : null}
            </aside>
          </div>
        </section>

        <section className="border-y border-[#d8d1c5] py-10 dark:border-white/10 md:py-14">
          <SectionHeading eyebrow="One-sentence distinction" title="一句话区分：看“货、权、钱、票、险”是否共同指向真实经营" />
          <div className="mt-7 overflow-x-auto rounded-2xl border border-[#d7cfc0] bg-white/45 dark:border-white/10 dark:bg-white/[0.025]">
            <table className="w-full min-w-[820px] border-collapse text-left text-xs">
              <thead><tr className="bg-[#12233b] text-white"><th className="px-5 py-4">判断维度</th><th className="px-5 py-4 text-[#9bd1c2]">正常供应链业务</th><th className="px-5 py-4 text-[#f1aaa1]">疑似违规“过单”</th></tr></thead>
              <tbody>{[
                ['货', '货物真实存在，规格数量可验证', '标的虚构、重复使用或始终无法核验'],
                ['权', '货权取得、控制、转移与处置路径清楚', '中间方从未控制货权，仓单由对方掌握'],
                ['钱', '付款对应履约，信用政策符合行业逻辑', '资金按预设周期回流，收益近似固定利息'],
                ['票', '合同、发票与实际经营内容一致', '票据只为拼接闭环，内容与实际业务不符'],
                ['险', '承担价格、质量、库存、信用等经营风险', '只收通道费，不承担与收益匹配的风险'],
              ].map((row) => <tr key={row[0]} className="border-b border-[#dfd8cc] last:border-0 dark:border-white/10"><th className="px-5 py-4 text-base font-black text-[#a56e16] dark:text-[#deb05f]">{row[0]}</th><td className="px-5 py-4 leading-6 text-[#41665d] dark:text-[#9fc5ba]"><IconCheck size={14} className="mr-2 inline" />{row[1]}</td><td className="px-5 py-4 leading-6 text-[#86524c] dark:text-[#d1a39e]"><IconX size={14} className="mr-2 inline" />{row[2]}</td></tr>)}</tbody>
            </table>
          </div>
        </section>

        <section id="sources" className="scroll-mt-24 py-10 md:py-14">
          <SectionHeading eyebrow="06 / Primary sources" title="监管依据与延伸阅读" copy="优先列出国资监管、法院、纪检监察与税务机关公开资料。页面是一般性信息整理，不构成对任何具体交易的法律、税务或审计意见。" />
          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SOURCES.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className={`${styles.sourceCard} rounded-2xl border border-[#d7cfc1] bg-white/45 p-5 text-[#253247] no-underline dark:border-white/10 dark:bg-white/[0.025] dark:text-[#dfe5ec]`}><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-[#d49427]/10 px-2.5 py-1 font-mono text-[9px] font-black uppercase tracking-wider text-[#966616] dark:text-[#deb05f]">{source.tag}</span><IconArrowUpRight size={16} className="text-[#9a8b73]" /></div><h3 className="m-0 mt-6 text-sm font-black leading-6">{source.label}</h3><p className="m-0 mt-2 text-xs leading-6 text-[#6d7785] dark:text-[#9ea8b3]">{source.note}</p></a>)}
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#d7cfc1] bg-[#eee8dc] p-5 dark:border-white/10 dark:bg-white/[0.035] sm:flex-row sm:items-center sm:justify-between">
            <div><p className="m-0 text-sm font-black text-[#273449] dark:text-white">阅读结论：别用“有没有物流车”代替商业实质判断</p><p className="m-0 mt-1 text-xs leading-6 text-[#687382] dark:text-[#9ea8b3]">可靠的合规判断，需要把关联关系、商业目的、货权控制、风险承担、资金路径、发票内容和会计处理放在同一张图里审视。</p></div>
            <a href="#definition" className="shrink-0 text-xs font-black text-[#2e7663] underline underline-offset-4 dark:text-[#83c8b5]">回到开头</a>
          </div>
        </section>
      </PageContainer>
    </main>
  )
}
