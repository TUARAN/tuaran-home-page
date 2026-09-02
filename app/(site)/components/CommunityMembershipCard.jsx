import Image from 'next/image'
import {
  IconCheck,
  IconMessageCircleCheck,
  IconReceipt,
  IconShieldCheck,
} from '@tabler/icons-react'

import { COMMUNITY_MEMBERSHIP } from '../../../lib/communityMembership'

const STEPS = [
  {
    icon: IconReceipt,
    title: '微信扫码付款',
    desc: `支付 ${COMMUNITY_MEMBERSHIP.price} 元，并备注“${COMMUNITY_MEMBERSHIP.paymentNote}”。`,
  },
  {
    icon: IconMessageCircleCheck,
    title: '添加作者微信',
    desc: '发送付款截图，并说明想加入的主题圈子。',
  },
  {
    icon: IconShieldCheck,
    title: '核对后拉群',
    desc: '确认付款信息后，由站长邀请进入对应群聊。',
  },
]

export default function CommunityMembershipCard({ compact = false, id }) {
  return (
    <section id={id} className={`community-membership ${compact ? 'is-compact' : ''}`} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="community-membership-intro">
        <p className="community-kicker">PAID MEMBERSHIP</p>
        <div className="community-membership-title-row">
          <div>
            <h2 id={id ? `${id}-title` : undefined}>付费加入圈子</h2>
            <p>一次付费，按你的内容方向进入匹配的主题群。</p>
          </div>
          <div className="community-membership-price" aria-label={`${COMMUNITY_MEMBERSHIP.price} 元每年`}>
            <strong>¥{COMMUNITY_MEMBERSHIP.price}</strong>
            <span>/{COMMUNITY_MEMBERSHIP.period}</span>
          </div>
        </div>

        <div className="community-membership-lists">
          <div>
            <h3>你会获得</h3>
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
          <span>微信支付</span>
          <strong>¥{COMMUNITY_MEMBERSHIP.price}.00</strong>
        </div>
        <div className="community-membership-payment-qr">
          <Image
            src={COMMUNITY_MEMBERSHIP.paymentQr}
            alt={`微信付款码，入圈费用 ${COMMUNITY_MEMBERSHIP.price} 元`}
            width={1279}
            height={1743}
            sizes={compact ? '180px' : '240px'}
            className="h-full w-full object-contain"
          />
        </div>
        <p>付款时请手动填写金额，并保留付款截图。</p>
      </div>

      <ol className="community-membership-steps">
        {STEPS.map((step, index) => {
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
            className="h-full w-full object-contain"
          />
        </a>
        <div className="community-membership-contact-copy">
          <strong>付款后添加作者微信</strong>
          <p>作者微信号：<b>{COMMUNITY_MEMBERSHIP.wechatId}</b></p>
          <p>发送付款截图，并说明想加入的圈子。</p>
          <span className="community-membership-owner-qr-hint">点击二维码可查看原图</span>
        </div>
        <aside className="community-membership-contact-guide" aria-label="添加作者微信消息示例">
          <p className="community-membership-contact-guide-kicker">添加时这样说</p>
          <blockquote>
            你好，我已支付 {COMMUNITY_MEMBERSHIP.price} 元，微信昵称是 ______，想加入 ______ 主题圈子。
          </blockquote>
          <ul>
            <li>附上付款截图</li>
            <li>写清付款备注或微信昵称</li>
            <li>说明希望加入的主题方向</li>
          </ul>
          <div className="community-membership-contact-benefits">
            <p>加入后还可以获得</p>
            <ul>
              <li>独家资源整理</li>
              <li>AI 工具与案例清单</li>
              <li>选题、作品和账号反馈</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}
