/**
 * 公开联系渠道的唯一数据源。
 * 页面、弹窗、关于页、简历和页脚都从这里读取，不再各自抄一份微信号或外链。
 * 收款码、赞助和圈子付款不放在这里。
 */

export const CONTACT_PAGE_PATH = '/contact'

export const CONTACT_CHANNELS = [
  {
    id: 'wechat',
    group: 'direct',
    primary: true,
    copyable: true,
    label: '微信',
    labelEn: 'WeChat',
    value: 'atar24',
    detail: '合作、内容更正、资源领取和日常交流，优先加微信。',
    detailEn: 'For collaboration, corrections, resources, and everyday notes, start on WeChat.',
    qr: '/qrcodewechat3.png',
    qrAlt: '站长微信二维码，微信号 atar24',
  },
  {
    id: 'email',
    group: 'direct',
    label: '邮箱',
    labelEn: 'Email',
    value: 'tuaran666@gmail.com',
    href: 'mailto:tuaran666@gmail.com',
    detail: '账号、隐私、数据删除，以及需要留档的正式事项。',
    detailEn: 'Accounts, privacy, data deletion, and anything that should stay on record.',
  },
  {
    id: 'github',
    group: 'direct',
    profile: true,
    sameAs: true,
    label: 'GitHub',
    labelEn: 'GitHub',
    value: 'TUARAN',
    href: 'https://github.com/TUARAN',
    detail: '开源代码和仓库里的问题。',
    detailEn: 'Open-source code and issues filed on the repository.',
  },
  {
    id: 'juejin',
    group: 'social',
    profile: true,
    sameAs: true,
    label: '掘金',
    labelEn: 'Juejin',
    value: '掘金安东尼',
    href: 'https://juejin.cn/user/1521379823340792',
    detail: '技术文章。',
    detailEn: 'Technical writing.',
  },
  {
    id: 'xiaohongshu',
    group: 'social',
    profile: true,
    sameAs: true,
    label: '小红书',
    labelEn: 'Xiaohongshu',
    value: '小红书',
    href: 'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e',
    detail: '短内容。',
    detailEn: 'Short posts.',
  },
  {
    id: 'csdn',
    group: 'social',
    profile: true,
    sameAs: true,
    label: 'CSDN',
    labelEn: 'CSDN',
    value: 'CSDN',
    href: 'https://blog.csdn.net/aifs2025',
    detail: '技术博客。',
    detailEn: 'Technical blog.',
  },
  {
    id: '51cto',
    group: 'social',
    profile: true,
    sameAs: true,
    label: '51CTO',
    labelEn: '51CTO',
    value: '51CTO',
    href: 'https://blog.51cto.com/u_15298598',
    detail: '技术博客。',
    detailEn: 'Technical blog.',
  },
  {
    id: 'linkedin',
    group: 'social',
    profile: true,
    sameAs: true,
    label: '领英',
    labelEn: 'LinkedIn',
    value: '涂阿燃',
    href: 'https://www.linkedin.com/in/%E6%B6%82%E9%98%BF%E7%87%83-tuaran-473841210/',
    detail: '职业档案。',
    detailEn: 'Professional profile.',
  },
]

const PROFILE_ORDER = ['juejin', 'xiaohongshu', 'csdn', '51cto', 'github', 'linkedin']
const SAME_AS_ORDER = ['github', 'linkedin', 'juejin', 'xiaohongshu', 'csdn', '51cto']

export function getContactChannel(id) {
  const channel = CONTACT_CHANNELS.find((item) => item.id === id)
  if (!channel) throw new Error(`Unknown contact channel: ${id}`)
  return channel
}

export function listContactChannels(group) {
  return CONTACT_CHANNELS.filter((item) => !group || item.group === group)
}

export function listProfileLinks() {
  return PROFILE_ORDER.map((id) => getContactChannel(id))
}

export function listContactSameAs() {
  return SAME_AS_ORDER.map((id) => getContactChannel(id).href)
}

export function contactLabel(channel, locale) {
  return locale === 'en' && channel.labelEn ? channel.labelEn : channel.label
}

export function contactDetail(channel, locale) {
  return locale === 'en' && channel.detailEn ? channel.detailEn : channel.detail
}

export const WECHAT_CONTACT = getContactChannel('wechat')
export const EMAIL_CONTACT = getContactChannel('email')
