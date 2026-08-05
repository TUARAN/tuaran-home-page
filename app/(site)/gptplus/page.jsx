'use client'

import { useState } from 'react'
import {
  IconArrowRight,
  IconBadgeTm,
  IconBolt,
  IconBrandWechat,
  IconCalendarCheck,
  IconCheck,
  IconChevronDown,
  IconClipboardText,
  IconFileInvoice,
  IconMail,
  IconMessageCircle,
  IconX,
  IconShieldCheck,
} from '@tabler/icons-react'

const plans = [
  { id: 'plus', label: 'Plus', sub: '官方20刀', price: 143, old: 148, reduction: 5, note: '周额度  相当于 API 额度的 130 刀' },
  { id: 'pro5', label: 'Pro 5x', sub: '官方100刀', price: 775, old: 800, reduction: 25, note: '周额度  相当于 API 额度的 1,100 刀' },
  { id: 'pro20', label: 'Pro 20x', sub: '官方200刀', price: 1335, old: 1380, reduction: 45, note: '周额度  相当于 API 额度的 2,500 刀' },
]

const reviews = [
  ['MC', 'Musa Chen', '新加坡', 'Plus 用户', '我主要看重能查订单。支付后不是只靠聊天记录确认，订单页能看到状态，后续有问题也能直接按订单号沟通。'],
  ['LP', 'LaoPeng', '中国香港', 'Pro 5x', '给同事临时升级 Pro 前先确认了套餐、金额和售后说明。页面把服务范围写清楚，付款前心里比较有数。'],
  ['MJ', 'Ming Jia', '马来西亚', '老用户', '续费过几次，比较喜欢流程固定：先选套餐，再留联系方式，最后查订单。遇到问题不用重新解释一遍来龙去脉。'],
  ['KL', 'Kris Luo', '美国', '企业咨询', '团队采购需要合同和发票，提前问清楚后再下单。对我们这种要走报销流程的场景，留凭证比单纯便宜更重要。'],
  ['RI', 'Rimika', '日本', 'Plus 续费', '我不想在网页里提交账号密码，这里下单只留联系信息用于查单和售后，这一点让我更放心。'],
  ['林', '小林', '中国台湾', '售后处理', '之前最担心异常没人跟进。这里把售后规则和处理方式写在前面，真要沟通时按订单状态核对，效率高一些。'],
]

const faqs = [
  ['我们网页提供什么服务？', '提供 ChatGPT Plus 与 Pro 订阅充值服务，用户无需在本页提交账号密码，付款后按订单流程完成后续操作。'],
  ['需要填写什么信息？', '仅需要填写可联系到你的手机号或微信手机号，用于订单查询、质保和售后沟通。'],
  ['具体充值流程是怎样的？', '选择套餐并支付，保存订单号，再根据订单页的流程说明完成后续步骤。'],
  ['多久可以处理完成？', '正常情况下工作时间 1—3 分钟内处理完成，特殊情况会在订单页或客服渠道同步。'],
  ['套餐怎么选？', '个人日常使用选择 Plus；需要更高额度或团队使用，可以选择 Pro 5x 或 Pro 20x。'],
  ['订单异常怎么处理？', '请先进入查询订单页，按订单号联系客服，我们会按照订单状态和服务条款协助处理。'],
  ['防封号和质保有哪些注意事项？', '多人共享、反代及其他违规使用场景不在质保范围内，具体以服务条款为准。'],
  ['服务边界是什么？', '本站为独立第三方服务平台，非 OpenAI 官方网站，不存在任何官方授权、代理、合作或背书关系。'],
]

function Mark() {
  return <span className="gpt-mark"><IconBolt size={18} stroke={2.4} /></span>
}

export default function HomePage() {
  const [selected, setSelected] = useState('plus')
  const [phone, setPhone] = useState('')
  const [openFaq, setOpenFaq] = useState(null)
  const [wechatOpen, setWechatOpen] = useState(false)
  const plan = plans.find((item) => item.id === selected) || plans[0]

  function checkout() {
    if (!phone.trim()) {
      document.querySelector('#phone')?.focus()
      return
    }
    window.alert(`已选择 ${plan.label}，请添加微信 atar24 完成支付。`)
  }

  return (
    <div className="gpt-page">
      <header className="gpt-header">
        <a href="#top" className="gpt-brand"><Mark /><span><strong>ChatGPT 充值服务</strong><small>GPT Plus｜PRO 充值</small></span></a>
        <nav className="gpt-nav"><a href="#top">首页</a><a href="#faq">帮助</a><a href="#workflow">教程</a><a href="#offers">上车</a></nav>
        <a className="gpt-order" href="#offers"><IconClipboardText size={17} /> 查询订单</a>
      </header>

      <main id="top">
        <section className="gpt-hero gpt-wrap">
          <p className="gpt-eyebrow">GPT PLUS / PRO 服务</p>
          <h1>ChatGPT Plus/Pro<br /><span>充值服务</span></h1>
          <div className="gpt-highlight">工作时间1-3 分钟极速到账</div>
          <p className="gpt-lede">我们通过正规渠道 1-3分钟内即可完成 ChatGPT Plus/Pro订阅，帮个人轻松订阅，助力企业采购报销</p>
          <div className="gpt-actions"><a className="gpt-button gpt-button-dark" href="#offers">马上上车 <IconArrowRight size={16} /></a><a className="gpt-button" href="#workflow">查看流程</a></div>
          <div className="gpt-trust-grid">
            {[[IconFileInvoice, '正规发票', '按实际金额开票，报销无忧，联系客服即可。'], [IconShieldCheck, '1 个月质保', '独享账号'], [IconCalendarCheck, '批量采购', '可走对公，可签合同'], [IconBadgeTm, '正规渠道充值', '1-3分钟内到账']].map(([Icon, title, copy]) => <article className="gpt-trust-card" key={title}><span className="gpt-icon-box"><Icon size={19} /></span><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
        </section>

        <section className="gpt-section gpt-wrap" id="offers">
          <p className="gpt-section-kicker">选择套餐</p><h2>选择套餐，马上上车</h2><p className="gpt-section-lede">进入第二屏后再选择 Plus 或 Pro 套餐。支付前请确认价格、联系方式和服务说明。</p>
          <div className="gpt-offer-layout">
            <div className="gpt-plan-list">{plans.map((item) => <button key={item.id} className={`gpt-plan gpt-plan-${item.id} ${selected === item.id ? 'is-selected' : ''}`} onClick={() => setSelected(item.id)}><span className="gpt-plan-sub">{item.sub}</span><strong>{item.label}</strong><span className="gpt-price">¥{item.price} {item.old && <del>¥{item.old}</del>}</span><span className="gpt-reduction">立减 ¥{item.reduction}</span><small>{item.note}</small>{selected === item.id && <IconCheck className="gpt-selected" size={18} />}</button>)}</div>
            <aside className="gpt-checkout"><label htmlFor="phone">手机号：<small>（为后续质保和找回订单，与充值账号无关）</small></label><input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="填写微信手机号" /><button className="gpt-button gpt-button-dark gpt-pay" onClick={checkout}>去支付 <b>¥{plan.price}</b></button><div className="gpt-badges"><span>质保一个月</span><span>可走淘宝/咸鱼</span><span>可开发票</span></div></aside>
          </div>
          <a className="gpt-text-link" href="#workflow">查看充值流程 <IconArrowRight size={15} /></a>
        </section>

        <section className="gpt-section gpt-wrap gpt-reviews" id="reviews"><p className="gpt-section-kicker">用户稳定充值反馈</p><h2>多地用户的充值与售后反馈</h2><p className="gpt-section-lede">覆盖个人续费、订单查询、售后沟通和企业采购等常见场景，帮助你提前了解服务流程。</p><div className="gpt-review-grid">{reviews.map(([initials, name, region, tag, copy]) => <article className="gpt-review" key={name}><div className="gpt-stars">★★★★★</div><p>“{copy}”</p><footer><span className="gpt-avatar">{initials}</span><span><strong>{name}</strong><small>{region} · {tag}</small></span></footer></article>)}</div></section>

        <section className="gpt-section gpt-wrap" id="workflow"><p className="gpt-section-kicker">充值流程</p><h2>三步完成 GPT 账户充值</h2><p className="gpt-section-lede">先选择套餐并支付，再通过查询订单页查看状态和教程。用户进入页面后可以先上车，也可以先看教程与常见问题。</p><div className="gpt-steps">{[['01', '选择套餐', '在上车区选择 Plus 或 PRO 套餐，确认价格和服务说明', '价格以支付前页面为准'], ['02', '填写联系方式', '留下用于查单和售后的联系方式，用于核对订单与质保时间', '不在此处索要账号密码'], ['03', '查询订单', '支付后到查询订单页查看状态，按教程完成后续操作', '异常按订单状态协助处理']].map(([number, title, copy, note]) => <article className="gpt-step" key={number}><b>{number}</b><h3>{title}</h3><p>{copy}</p><small>{note}</small></article>)}</div></section>

        <section className="gpt-section gpt-wrap gpt-service"><div><p className="gpt-section-kicker">服务说明</p><h2>流程清楚，售后有据。</h2><p className="gpt-section-lede">1. 可查询订单状态和售后记录<br />2. 异常按服务条款协助处理</p></div><div className="gpt-service-grid">{[['对公打款', '金额 1 万以上可走对公。'], ['可签合同', '企业可签长期合同。'], ['正规发票', '按实际金额开票，报销无忧，联系客服即可。'], ['清楚的订单流程', '支付后可在查询订单页查看订单状态和后续说明。'], ['1 个月质保', '按服务条款处理非用户原因导致的会员中断；反代、多人共享等违规场景除外。'], ['服务边界透明', '本站为独立第三方服务平台，非 OpenAI 官方网站。']].map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

        <section className="gpt-section gpt-wrap" id="faq"><p className="gpt-section-kicker">常见疑问</p><h2>常见问题</h2><p className="gpt-section-lede">集中回答购买前最常见的服务范围、信息填写、处理时效和售后问题。</p><div className="gpt-faq-list">{faqs.map(([question, answer], index) => <div className={`gpt-faq ${openFaq === index ? 'is-open' : ''}`} key={question}><button onClick={() => setOpenFaq(openFaq === index ? null : index)}>{question}<IconChevronDown size={18} /></button>{openFaq === index && <p>{answer}</p>}</div>)}</div></section>
      </main>

      <footer className="gpt-footer"><div className="gpt-wrap gpt-footer-inner"><div><a className="gpt-brand" href="#top"><Mark /><span><strong>ChatGPT 充值服务</strong><small>GPT Plus｜PRO 充值</small></span></a><p>本站为独立第三方服务平台，不是 ChatGPT 或 OpenAI 官方网站，也不存在任何官方授权、代理、合作、背书或隶属关系。</p></div><div className="gpt-footer-links"><strong>快速充值</strong><a href="#offers">充值产品列表</a><a href="#workflow">充值教程</a><a href="#faq">常见问题</a></div><div className="gpt-footer-links"><strong>服务支持</strong><a href="mailto:support@2aran.com"><IconMail size={14} /> 联系支持</a><a href="#offers"><IconMessageCircle size={14} /> 查询订单</a></div></div><p className="gpt-copyright">退款政策：未开始处理的订单可按规则申请退款；处理异常会按订单状态协助解决。<br />© 2026 ChatGPT 充值服务 版权所有。</p></footer>
      <button className="gpt-float" type="button" onClick={() => setWechatOpen(true)} aria-label="打开我的微信"><IconBrandWechat size={23} /><small>我的微信</small></button>
      {wechatOpen && <div className="gpt-wechat-backdrop" role="presentation" onClick={() => setWechatOpen(false)}><div className="gpt-wechat-card" role="dialog" aria-modal="true" aria-labelledby="wechat-title" onClick={(event) => event.stopPropagation()}><button className="gpt-wechat-close" type="button" onClick={() => setWechatOpen(false)} aria-label="关闭"><IconX size={18} /></button><p className="gpt-section-kicker">联系微信</p><h2 id="wechat-title">添加我的微信</h2><img src="/qrcodewechat3.png" alt="微信二维码" /><strong>微信号：atar24</strong><p>添加时请备注“GPT Plus”，方便快速确认订单。</p></div></div>}
    </div>
  )
}

