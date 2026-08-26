import WorkspaceHub from '../../components/WorkspaceHub'

export default function AutomationWorkspace() {
  return (
    <WorkspaceHub
      title="自动化"
      description="统一查看自动任务、内容流水线、模型服务和执行审计。"
      eyebrow="从任务到复盘"
      flow={['登记任务', '自动执行', '人工审计', '结果复盘']}
      sections={[
        {
          title: '执行与审计',
          description: '先看整体运行状态，再进入模型调用与失败原因。',
          items: [
            { href: '/admin/ops', title: '自动化台账', description: '统一登记云端与本地自动化，追踪运行、产物、风险与审核。', icon: 'ops' },
            { href: '/admin/deepseek-tasks', title: '模型服务', description: '管理模型服务、密钥与调用记录，审阅 Token 消耗和失败原因。', icon: 'deepseekTasks' },
          ],
        },
        {
          title: '内容流水线',
          description: '管理有明确输入、审核窗口和发布结果的自动内容任务。',
          items: [
            { href: '/admin/a-share-research', title: 'A 股研究自动化', description: '每日选题、联网检索草稿、复核窗口、自动发布与运行日志。', icon: 'aShareResearch' },
            { href: '/admin/crypto-research', title: '加密调研自动化', description: '按市值每天一个币种，覆盖背景、技术、代币经济、治理、安全与监管。', icon: 'ops', note: '每天 01:30' },
            { href: '/admin/morning-greeting', title: 'X 发布任务', description: '管理每日问候、朋友图文和文化短故事的全自动发布。', icon: 'morningGreeting' },
            { href: '/admin/article-distribution', title: '文章一键分发', description: '选择站内文章，通过浏览器插件写入六个平台草稿。', icon: 'share' },
            { href: '/admin/quotes', title: '名言生成', description: '每天自动生成原创短句并留档，前台从名言池随机展示。', icon: 'researchStyle', note: '每日自动生成' },
            { href: '/admin/engagement-bots', title: '路过互动', description: '管理人设、每日随机点赞、DeepSeek 评论与运行记录。', icon: 'ops', note: '每天 10:23' },
          ],
        },
      ]}
      planned={[
        { title: '统一任务日历', description: '按时间查看所有定时任务、依赖关系和下一次运行。' },
        { title: '异常告警', description: '汇总连续失败、超时、配额不足与人工待审状态。' },
        { title: '运行成本', description: '按任务和模型统计 Token、调用次数与估算费用。' },
      ]}
    />
  )
}
