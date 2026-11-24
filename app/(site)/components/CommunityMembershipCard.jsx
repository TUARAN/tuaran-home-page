'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import {
  IconCheck,
  IconClock,
  IconFileInvoice,
  IconMail,
  IconReceipt,
  IconShieldCheck,
} from '@tabler/icons-react'

import { COMMUNITY_MEMBERSHIP, getCommunityCountdown, getCommunityPlanPrice } from '../../../lib/auth/communityMembership'
import CommunityPayPanel from './CommunityPayPanel'

function ActivityCountdown({ countdown }) {
  const parts = [
    ['天', countdown.days],
    ['时', countdown.hours],
    ['分', countdown.minutes],
    ['秒', countdown.seconds],
  ]

  return (
    <div className="community-membership-countdown" role="timer" aria-label={`本轮活动剩余 ${countdown.days} 天 ${countdown.hours} 小时 ${countdown.minutes} 分钟`}>
      <div className="community-membership-countdown-copy">
        <IconClock size={17} aria-hidden="true" />
        <span><strong>主题圈年卡 ¥{COMMUNITY_MEMBERSHIP.plans[0].price}</strong>，本轮活动剩余</span>
      </div>
      <div className="community-membership-countdown-units" aria-hidden="true">
        {parts.map(([label, value]) => (
          <span key={label}><b>{String(value).padStart(2, '0')}</b>{label}</span>
        ))}
      </div>
    </div>
  )
}

export default function CommunityMembershipCard({ compact = false, id, waitlist = false, topicName = '' }) {
  const [selectedPlanId, setSelectedPlanId] = useState(COMMUNITY_MEMBERSHIP.plans[0].id)
  // 倒计时只在客户端刷新，避免 SSR 与 hydration 时刻不一致触发 React #418。
  const [countdown, setCountdown] = useState(null)

  useEffect(() => {
    const update = () => setCountdown(getCommunityCountdown())
    update()
    const timer = window.setInterval(update, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const selectedPlan = useMemo(
    () => COMMUNITY_MEMBERSHIP.plans.find((plan) => plan.id === selectedPlanId) || COMMUNITY_MEMBERSHIP.plans[0],
    [selectedPlanId],
  )
  const selectedPrice = getCommunityPlanPrice(selectedPlan)

  if (waitlist) {
    return (
      <section id={id} className={`community-membership ${compact ? 'is-compact' : ''}`} aria-labelledby={id ? `${id}-title` : undefined}>
        <div className="community-membership-intro">
          <p className="community-kicker">WAITLIST</p>
          <div className="community-membership-title-row">
            <div>
              <h2 id={id ? `${id}-title` : undefined}>登记加入意向</h2>
              <p>{topicName || '这个主题圈'}正在筹备。先登记意向，确认开群时间、成员结构和服务安排后再付款。</p>
            </div>
          </div>
          <div className="community-membership-lists">
            <div>
              <h3>登记后会收到</h3>
              <ul>
                <li><IconCheck size={15} aria-hidden="true" /><span>开群时间与首批成员说明</span></li>
                <li><IconCheck size={15} aria-hidden="true" /><span>正式价格、服务周期与退出规则</span></li>
                <li><IconCheck size={15} aria-hidden="true" /><span>确认加入后再发送付款方式</span></li>
              </ul>
            </div>
            <div>
              <h3>当前无需付款</h3>
              <ul>
                <li><span className="community-membership-dot" aria-hidden="true" /><span>添加微信并注明想加入的主题</span></li>
                <li><span className="community-membership-dot" aria-hidden="true" /><span>简单介绍你的内容方向和希望解决的问题</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="community-membership-payment">
          <div className="community-membership-pay-head"><span>微信登记</span><strong>¥0</strong></div>
          <div className="community-membership-payment-qr">
            <Image
              src={COMMUNITY_MEMBERSHIP.ownerQr}
              alt="作者个人微信二维码"
              width={1074}
              height={1455}
              sizes={compact ? '180px' : '240px'}
              unoptimized
              className="h-full w-full object-contain"
            />
          </div>
          <p>微信号：{COMMUNITY_MEMBERSHIP.wechatId}。添加时注明“{topicName || '主题圈'}候补”。</p>
        </div>
      </section>
    )
  }

  const steps = [
    {
      icon: IconReceipt,
      title: '选择方案并在线支付',
      desc: `选好方案后微信扫码付 ¥${selectedPrice}，支付成功本页自动识别。`,
    },
    {
      icon: IconMail,
      title: '留下联系邮箱',
      desc: '支付成功页填写邮箱即可，无需登录；需要发票时一并说明抬头和税号。',
    },
    {
      icon: IconShieldCheck,
      title: '核对后交付',
      desc: selectedPlan.id === 'personal-service' ? '核对订单后安排加入，并预约一对一交流时间。' : '核对订单后，按圈子所在平台邀请加入。',
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

        {countdown ? <ActivityCountdown countdown={countdown} /> : null}

        <div className="community-membership-plans" role="radiogroup" aria-label="选择圈子或个人服务方案">
          {COMMUNITY_MEMBERSHIP.plans.map((plan) => {
            const isSelected = plan.id === selectedPlan.id
            const price = getCommunityPlanPrice(plan)
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
        <CommunityPayPanel key={selectedPlan.resourceKey} plan={selectedPlan} />
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

      <div className="community-membership-contact is-email">
        <div className="community-membership-contact-copy">
          <strong>付款后留下邮箱</strong>
          <p>不用登录，也不用加微信。支付成功页会请你填写邮箱，站长按后台订单核对后通过邮件联系你。</p>
          <p>邮件里确认方案、进群方式或一对一交流时间；需要发票时回复抬头和税号即可。</p>
        </div>
        <aside className="community-membership-contact-guide" aria-label="付款后邮件联系说明">
          <p className="community-membership-contact-guide-kicker">邮件里会确认</p>
          <blockquote>
            已收到「{selectedPlan.name}」的付款，请回复你希望用于进群的账号昵称，方便邀请加入。
          </blockquote>
          <ul>
            <li>所选方案与订单号</li>
            <li>进群方式或交流时间</li>
            <li>发票抬头与税号（如需）</li>
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
