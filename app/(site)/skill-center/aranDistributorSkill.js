import { HARNESS_VERSION } from '../../../lib/distribution/harness.js'
import { DISTRIBUTION_AGENT_PLATFORM_IDS } from '../../../lib/distribution/playbooks.js'
import { distributionPlatformShortLabel } from '../../../lib/distribution/platforms.js'

const platformLabels = DISTRIBUTION_AGENT_PLATFORM_IDS.map((id) => distributionPlatformShortLabel(id)).filter(Boolean)

export const ARAN_DISTRIBUTOR_SKILL = {
  id: '2aran-distributor',
  name: '2aran-distributor',
  title: '阿燃分发智能体',
  category: '创作与分发',
  status: '已上架',
  desc: '在本机用 ego lite 浏览器，把 2aran 公开文章或自备 Markdown 发到你的掘金、CSDN、X、小红书、知乎、头条等账号；智能体按平台手册填表，你在浏览器里登录并点发布。',
  trigger: '用户粘贴「2aran 分发任务」或「自备账号」分发任务，或要求把站内文章发到自己的内容平台时使用。',
  inputs: ['已安装 ego-browser skill', 'ego lite 分发专用 Profile', '各平台已登录或愿意 handOff 登录', 'Cursor / Codex / Claude Code 等可加载 skill 的客户端'],
  outputs: ['各平台草稿或已发布链接', '对话内逐平台回报', '站长任务台模式另有后台台账'],
  acceptance: '登录态在你自己的 Profile；权利声明经你确认；站内文默认链回原文不全文镜像；手册版本与 harness 一致。',
  content: {
    type: 'rules',
    label: '自备账号要点',
    pill: '4 条',
    items: [
      { title: '浏览器', body: '专用 ego Profile（默认 SyncBlog），与日常上网分离；未登录时 handOff 给你本人扫码登录。' },
      { title: '正文', body: '从站内原文 URL 读取正文，不在任务里携带全文 Markdown，发布时保留原文链接。' },
      { title: '安全', body: '不使用他人 Bearer token；转载/翻译填原文 URL；原创声明与授权勾选前必须问你。' },
      { title: '安装', body: `下载 SKILL.md（harness ${HARNESS_VERSION}），放入各客户端的 skills/2aran-distributor/ 目录后新开对话。` },
    ],
  },
  codex: {
    installPath: '~/.codex/skills/2aran-distributor',
    files: ['SKILL.md'],
    packageUrl: '/api/resources/aran-distributor-skill',
    packageLabel: '下载 SKILL.md',
    skillMd: `---
name: 2aran-distributor
description: 阿燃分发智能体 — ego lite 多平台发文。站内公开页或 ${platformLabels.join('、')} 等。
metadata:
  version: "${HARNESS_VERSION}"
---

# 2aran-distributor

完整规则与六份平台手册请使用上方「下载 SKILL.md」。安装后粘贴「自备账号」分发任务或站长「任务台」领取指令即可开工。`,
    openaiYaml: `interface:
  display_name: "阿燃分发智能体"
  short_description: "ego lite 多平台内容分发"
  default_prompt: "Use $2aran-distributor to publish using my guest distribution task and ego lite."`,
  },
}