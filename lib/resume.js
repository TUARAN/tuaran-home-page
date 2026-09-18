import { AVATAR_PATH } from './avatar.js'
import { OPENCLAW_ACHIEVEMENT_COUNT, OPENCLAW_ACHIEVEMENTS } from './openClawAchievements.js'

export const RESUME_PATH = '/about/resume'
export const RESUME_CANONICAL = 'https://2aran.com/about/resume'
export const RESUME_TITLE = '求职简历｜涂阿燃 TUARAN'
export const RESUME_DESCRIPTION =
  '涂阿燃（TUARAN）求职简历：AI 前沿部署工程师、矩联科技创始人、技术作者与 OpenClaw 贡献者。一页履历，可在线查看、打印或另存 PDF。'

export const resumeProfile = {
  name: '涂阿燃',
  nameEn: 'TUARAN',
  aliases: ['掘金安东尼', '安东尼404', '安东尼与AI'],
  headline: 'AI 前沿部署工程师 · 矩联科技创始人',
  location: '广州',
  intent: 'AI 前沿部署 / Agent 工程 / 前端工程化',
  avatar: AVATAR_PATH,
}

export const resumeSummary =
  '2016 年开始编程，2018 年本科毕业于华南师范大学。曾任职于大型互联网企业与央企，现为矩联科技创始人，做 AI Agent 的研究、部署和产品交付。2019 年起持续技术写作，累计公开内容 1500 余篇，全网阅读超过 600 万；著有《程序员成长手记》《AI Bots 通关指南》。OpenClaw 贡献者，已有多项修复合并至主分支。'

export const resumeContacts = [
  { label: '邮箱', value: 'tuaran666@gmail.com', href: 'mailto:tuaran666@gmail.com' },
  { label: '微信', value: 'atar24' },
  { label: '主页', value: '2aran.com', href: 'https://2aran.com' },
  { label: 'GitHub', value: 'github.com/TUARAN', href: 'https://github.com/TUARAN' },
  { label: '掘金', value: '掘金安东尼', href: 'https://juejin.cn/user/1521379823340792' },
]

export const resumeSkills = [
  {
    label: '前端工程',
    items: ['React', 'Next.js', 'JavaScript', 'Tailwind CSS', 'Cloudflare Pages / D1 / Edge'],
  },
  {
    label: 'AI Agent',
    items: ['模型工具协议', '上下文工程', 'MCP', 'OpenClaw', '浏览器端推理'],
  },
  {
    label: '交付',
    items: ['从原型到部署', '鉴权与测试', '站点与产品维护', 'PMP 项目管理'],
  },
]

export const resumeExperience = [
  {
    org: '矩联科技',
    title: '创始人',
    period: '2026 — 至今',
    location: '广州',
    bullets: [
      '围绕 AI 开发者生态、创作者协作与技术服务建设公司，把工程经验落到可交付的站点、产品与服务。',
      '发起博主联盟，连接 AI 产品方与技术创作者；共创前端周刊（前端周看）。',
      '持续维护 2aran.com 及博主联盟、前端周看、AI 分发大师等站点。',
    ],
  },
  {
    org: '某央企',
    title: '工程研发 / 项目管理',
    period: '2021 入职',
    location: '中国',
    bullets: [
      '在信息化与工程岗位做编程交付，并参与 PMP 项目管理实践。',
      '已通过 PMI PMP 认证，证书有效期至 2028 年 3 月。',
    ],
  },
  {
    org: '某大型互联网企业',
    title: '前端工程',
    period: '2019 入职',
    location: '中国',
    bullets: [
      '在高强度工程环境中做前端交付。',
      '同年开始技术写作，后续入选掘金优秀作者。',
    ],
  },
]

export const resumeWriting = {
  period: '2019 — 至今',
  stats: [
    { value: '1500+', label: '公开内容' },
    { value: '600w+', label: '全网阅读' },
    { value: '2', label: '已发布作品' },
  ],
  bullets: [
    '2020 年获掘金优秀作者。',
    '2023 年出版《程序员成长手记》。',
    '2024 年发布电子小册《AI Bots 通关指南》。',
  ],
}

export const resumeWorks = [
  {
    title: '《程序员成长手记》',
    meta: '技术图书 · 2023 · 已出版',
    href: 'https://www.dedao.cn/ebook/detail?id=Lk89Yv4kyM12eaG795DmKAponOvLVWvoRl83ZzdbYxN84JQR6XgEqBPljrbpzARl',
  },
  {
    title: '《AI Bots 通关指南》',
    meta: '电子小册 · 2024 · 已发布',
    href: 'https://juejin.cn/book/7351709145294176282',
  },
]

export const resumeOpenSource = {
  title: `OpenClaw 贡献者 · ${OPENCLAW_ACHIEVEMENT_COUNT} 个 PR 已合并至 main`,
  href: 'https://github.com/openclaw/openclaw/pulls?q=is%3Apr+author%3ATUARAN+is%3Amerged',
  items: OPENCLAW_ACHIEVEMENTS.map((item) => ({
    title: item.title.replace(/^OpenClaw PR /, 'PR '),
    href: item.url,
  })),
}

export const resumeEducation = [
  {
    school: '华南师范大学',
    degree: '本科',
    period: '2018 年毕业',
    note: '2016 年开始系统学习编程。',
  },
]

export const resumeCertifications = [
  {
    name: 'PMP',
    org: 'Project Management Institute',
    note: '有效期至 2028 年 3 月',
    href: '/project-manager',
  },
]

export const resumeSameAs = [
  'https://github.com/TUARAN',
  'https://juejin.cn/user/1521379823340792',
  'https://blog.csdn.net/aifs2025',
  'https://blog.51cto.com/u_15298598',
  'https://www.xiaohongshu.com/user/profile/68b313f9000000001901d07e',
]
