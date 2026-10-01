export const COMMUNITY_MEMBERSHIP = {
  paymentQr: '/donate-wechat.jpg',
  ownerQr: '/qrcode-wechat.jpg',
  wechatId: 'atar24',
  paymentNote: '所选方案 + 你的微信昵称',
  earlyBird: {
    price: 69,
    regularPrice: 99,
    endsAt: '2026-10-07T23:59:59+08:00',
  },
  plans: [
    {
      id: 'topic-circle',
      category: '圈子服务',
      name: '主题圈年卡',
      price: 99,
      earlyBirdPrice: 69,
      period: '年',
      description: '适合先从一个明确主题开始交流。',
      features: [
        '进入 1 个匹配主题的微信群',
        '获取群内工具、案例与实操分享',
        '参与选题、作品和账号互评',
      ],
    },
    {
      id: 'all-circles',
      category: '进阶圈子服务',
      name: '全圈通行',
      price: 199,
      period: '年',
      description: '适合同时经营多个平台或内容方向。',
      features: [
        '进入全部现有主题圈子',
        '有效期内可加入新开放的主题圈',
        '优先参与小范围线上交流',
      ],
    },
    {
      id: 'personal-service',
      category: '个人服务',
      name: '一对一梳理',
      price: 699,
      period: '次',
      description: '适合需要针对具体问题一起拆解的人。',
      features: [
        '含 1 年全圈通行权益',
        '1 次 60 分钟线上交流',
        '会后问题清单与行动建议',
      ],
    },
  ],
  benefits: [
    '按内容方向进入对应微信群，与正在做内容和产品的人交流',
    '获取群内分享的 AI 工具、案例、复盘与实操经验',
    '参与选题、作品和账号的具体反馈与互助',
  ],
  boundaries: [
    '圈子服务是交流社群，不是课程、训练营或收益承诺',
    '个人服务按所选方案交付，不承诺代运营或结果指标',
    '广告、刷量、骚扰和交换账号密码会被移出群聊',
  ],
  invoice: '付款后提供发票抬头和税号即可。',
}

export function getCommunityPlanPrice(plan, now = Date.now()) {
  const earlyBirdEndsAt = new Date(COMMUNITY_MEMBERSHIP.earlyBird.endsAt).getTime()
  const earlyBirdActive = Number.isFinite(earlyBirdEndsAt) && now < earlyBirdEndsAt

  if (earlyBirdActive && plan.earlyBirdPrice) return plan.earlyBirdPrice
  return plan.price
}
