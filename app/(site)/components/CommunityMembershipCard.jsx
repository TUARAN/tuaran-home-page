'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import {
  IconCheck,
  IconClock,
  IconFileInvoice,
  IconMessageCircleCheck,
  IconReceipt,
  IconShieldCheck,
} from '@tabler/icons-react'

import { COMMUNITY_MEMBERSHIP } from '../../../lib/communityMembership'

const EARLY_BIRD_END = new Date(COMMUNITY_MEMBERSHIP.earlyBird.endsAt).getTime()

function getCountdown(now) {
  const remaining = Math.max(0, EARLY_BIRD_END - now)

  return {
    active: remaining > 0,
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining / 3600000) % 24),
    minutes: Math.floor((remaining / 60000) % 60),
    seconds: Math.floor((remaining / 1000) % 60),
  }
}

function EarlyBirdCountdown({ countdown }) {
  if (!countdown) {
    return <div className="community-membership-countdown is-loading" aria-hidden="true" />
  }

  if (!countdown.active) {
    return (
      <div className="community-membership-countdown is-ended">
        <IconClock size={17} aria-hidden="true" />
        <span>早鸟活动已结束，主题圈年卡恢复为 ¥{COMMUNITY_MEMBERSHIP.earlyBird.regularPrice}</span>
      </div>
    )
  }

  const parts = [
    ['天', countdown.days],
    ['时', countdown.hours],
    ['分', countdown.minutes],
    ['秒', countdown.seconds],
  ]

  return (
    <div className="community-membership-countdown" role="timer" aria-label={`早鸟价剩余 ${countdown.days} 天 ${countdown.hours} 小时 ${countdown.minutes} 分钟`}>
      <div className="community-membership-countdown-copy">
        <IconClock size={17} aria-hidden="true" />
        <span><strong>¥{COMMUNITY_MEMBERSHIP.earlyBird.price} 早鸟价</strong>，截止 10 月 7 日 23:59</span>
      </div>
      <div className="community-membership-countdown-units" aria-hidden="true">
        {parts.map(([label, value]) => (
          <span key={label}><b>{String(value).padStart(2, '0')}</b>{label}</span>
        ))}
      </div>
    </div>
  )
}

export default function CommunityMembershipCard({ compact = false, id }) {
  const [selectedPlanId, setSelectedPlanId] = useState(COMMUNITY_MEMBERSHIP.plans[0].id)
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    const update = () => setCountdown(getCountdown(Date.now()))
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const selectedPlan = useMemo(
    () => COMMUNITY_MEMBERSHIP.plans.find((plan) => plan.id === selectedPlanId) || COMMUNITY_MEMBERSHIP.plans[0],
    [selectedPlanId],
  )
  const selectedPrice = countdown?.active && selectedPlan.earlyBirdPrice
    ? selectedPlan.earlyBirdPrice
    : selectedPlan.price

  const steps = [
    {
      icon: IconReceipt,
      title: '选择方案并扫码付款',
      desc: `支付 ${selectedPrice} 元，并备注“${selectedPlan.name} + 你的微信昵称”。`,
    },
    {
      icon: IconMessageCircleCheck,
      title: '添加作者微信',
      desc: '发送付款截图；需要发票时一并提供抬头和税号。',
    },
    {
      icon: IconShieldCheck,
      title: '核对后交付',
      desc: selectedPlan.id === 'personal-service' ? '确认信息后拉群，并预约一对一交流时间。' : '确认信息后，由站长邀请进入对应群聊。',
    },
  ]

  return (
    <section id={id} className={`community-membership ${compact ? 'is-compact' : ''}`} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="community-membership-intro">
        <p className="community-kicker">MEMBERSHIP &amp; PERSONAL SERVICE</p>
        <div className="community-membership-title-row">
          <div>
            <h2 id={id ? `${id}-title` : undefined}>选择适合你的服务</h2>
            <p>从单个主题圈、全圈交流到一对一梳理，按实际需要选择。</p>
          </div>
          <div className="community-membership-price" aria-label={`${selectedPlan.name} ${selectedPrice} 元每${selectedPlan.period}`}>
            <strong>¥{selectedPrice}</strong>
            <span>/{selectedPlan.period}</span>
          </div>
        </div>

        <EarlyBirdCountdown countdown={countdown} />

        <div className="community-membership-plans" role="radiogroup" aria-label="选择圈子或个人服务方案">
          {COMMUNITY_MEMBERSHIP.plans.map((plan) => {
            const isSelected = plan.id === selectedPlan.id
            const price = countdown?.active && plan.earlyBirdPrice ? plan.earlyBirdPrice : plan.price
            return (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`community-membership-plan ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <span className="community-membership-plan-category">{plan.category}</span>
                <span className="community-membership-plan-head">
                  <strong>{plan.name}</strong>
                  <span>
                    {plan.earlyBirdPrice && countdown?.active ? <del>¥{plan.price}</del> : null}
                    <b>¥{price}</b>/{plan.period}
                  </span>
                </span>
                <span className="community-membership-plan-desc">{plan.description}</span>
                <span className="community-membership-plan-features">
                  {plan.features.map((feature) => (
                    <span key={feature}><IconCheck size={14} aria-hidden="true" />{feature}</span>
                  ))}
                </span>
              </button>
            )
          })}
        </div>

        <div className="community-membership-lists">
          <div>
            <h3>服务说明</h3>
            <ul>
              {COMMUNITY_MEMBERSHIP.benefits.map((item) => (
                <li key={item}><IconCheck size={15} aria-hidden="true" /><span>{item}</span></li>
              ))}
            </ul>
          </div>
          <div>
            <h3>先说清楚</h3>
            <ul>
              {COMMUNITY_MEMBERSHIP.boundaries.map((item) => (
                <li key={item}><span className="community-membership-dot" aria-hidden="true" /><span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="community-membership-payment">
        <div className="community-membership-pay-head">
          <span>微信支付 · {selectedPlan.name}</span>
          <strong>¥{selectedPrice}.00</strong>
        </div>
        <div className="community-membership-payment-qr">
          <Image
            src={COMMUNITY_MEMBERSHIP.paymentQr}
            alt={`微信付款码，${selectedPlan.name}费用 ${selectedPrice} 元`}
            width={1279}
            height={1743}
            sizes={compact ? '180px' : '240px'}
            unoptimized
            className="h-full w-full object-contain"
          />
        </div>
        <p>付款时请手动填写 ¥{selectedPrice}，备注所选方案并保留付款截图。</p>
        <div className="community-membership-invoice">
          <IconFileInvoice size={16} aria-hidden="true" />
          <span><strong>支持开具电子发票</strong>{COMMUNITY_MEMBERSHIP.invoice}</span>
        </div>
      </div>

      <ol className="community-membership-steps">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          return (
            <li key={step.title}>
              <span className="community-membership-step-number">{index + 1}</span>
              <StepIcon size={18} aria-hidden="true" />
              <div>
                <strong>{step.title}</strong>
                <p>{step.desc}</p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="community-membership-contact">
        <a
          href={COMMUNITY_MEMBERSHIP.ownerQr}
          target="_blank"
          rel="noreferrer"
          className="community-membership-owner-qr"
          aria-label="查看作者微信二维码原图"
        >
          <Image
            src={COMMUNITY_MEMBERSHIP.ownerQr}
            alt="作者个人微信二维码"
            width={1074}
            height={1455}
            sizes="(max-width: 900px) 136px, 176px"
            unoptimized
            className="h-full w-full object-contain"
          />
        </a>
        <div className="community-membership-contact-copy">
          <strong>付款后添加作者微信</strong>
          <p>作者微信号：<b>{COMMUNITY_MEMBERSHIP.wechatId}</b></p>
          <p>发送付款截图，并说明所选服务。</p>
          <span className="community-membership-owner-qr-hint">点击二维码可查看原图</span>
        </div>
        <aside className="community-membership-contact-guide" aria-label="添加作者微信消息示例">
          <p className="community-membership-contact-guide-kicker">添加时这样说</p>
          <blockquote>
            你好，我已支付 {selectedPrice} 元，选择「{selectedPlan.name}」，微信昵称是 ______。{selectedPlan.id === 'personal-service' ? '我想梳理的问题是 ______。' : '想加入 ______ 主题圈子。'}
          </blockquote>
          <ul>
            <li>附上付款截图</li>
            <li>写清付款备注或微信昵称</li>
            <li>需要发票请提供抬头和税号</li>
          </ul>
          <div className="community-membership-contact-benefits">
            <p>当前方案包含</p>
            <ul>
              {selectedPlan.features.map((feature) => <li key={feature}>{feature}</li>)}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}
