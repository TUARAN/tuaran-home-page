export const RANK_TIERS = [
  { id: 'hang', label: '夯', note: '闭眼冲，已经是工作流的一部分', color: '#ff4d6d' },
  { id: 'top', label: '顶级', note: '稳定好用，关键时刻真能打', color: '#ff9f43' },
  { id: 'human', label: '人上人', note: '有长板，放对位置很舒服', color: '#ffd93d' },
  { id: 'npc', label: 'NPC', note: '能用，但很难成为第一选择', color: '#73d2a6' },
  { id: 'trash', label: '拉完了', note: '当前体验不及预期，等版本翻身', color: '#7b8cde' },
]

export const RANK_ITEMS = [
  { id: 'claude-code', name: 'Claude Code', mark: 'CC', category: '编程', tier: 'hang', accent: '#d97757', summary: '复杂代码库里的理解、修改与协作体验很完整。' },
  { id: 'codex', name: 'Codex', mark: 'CX', category: '编程', tier: 'hang', accent: '#111827', summary: '长任务推进、工具调用和工程执行很稳。' },
  { id: 'chatgpt', name: 'ChatGPT', mark: 'GPT', category: '通用', tier: 'hang', accent: '#10a37f', summary: '通用能力均衡，适合高频问答与多模态工作。' },
  { id: 'gemini', name: 'Gemini', mark: 'GE', category: '通用', tier: 'hang', accent: '#4285f4', summary: '长上下文和 Google 生态联动是明显优势。' },
  { id: 'cursor', name: 'Cursor', mark: 'CU', category: '编程', tier: 'top', accent: '#6d5dfc', summary: '编辑器里的 AI 工作流成熟，改代码很顺手。' },
  { id: 'perplexity', name: 'Perplexity', mark: 'PX', category: '搜索', tier: 'top', accent: '#20b8cd', summary: '带来源的快速检索依然是高频刚需。' },
  { id: 'notebooklm', name: 'NotebookLM', mark: 'NL', category: '知识', tier: 'top', accent: '#5b7cfa', summary: '围绕自有资料做总结、追问和音频化很省心。' },
  { id: 'deepseek', name: 'DeepSeek', mark: 'DS', category: '通用', tier: 'human', accent: '#4d6bfe', summary: '中文推理和性价比突出，服务稳定性仍会影响体验。' },
  { id: 'kimi', name: 'Kimi', mark: 'KM', category: '知识', tier: 'human', accent: '#1c1c1e', summary: '中文长文、资料整理和办公场景覆盖扎实。' },
  { id: 'doubao', name: '豆包', mark: '豆', category: '通用', tier: 'human', accent: '#2f6bff', summary: '产品完成度高，语音和大众使用门槛很友好。' },
  { id: 'midjourney', name: 'Midjourney', mark: 'MJ', category: '创作', tier: 'human', accent: '#101010', summary: '视觉风格稳定，精细控制和工作流仍有取舍。' },
  { id: 'jimeng', name: '即梦', mark: '即', category: '创作', tier: 'npc', accent: '#6757e8', summary: '中文创作入口顺手，结果上限依赖题材和提示。' },
  { id: 'yuanbao', name: '腾讯元宝', mark: '元', category: '通用', tier: 'npc', accent: '#0ea5e9', summary: '入口和生态资源充足，核心体验辨识度还可提高。' },
  { id: 'tongyi', name: '通义', mark: '通', category: '通用', tier: 'npc', accent: '#7656ff', summary: '能力面很广，产品线较多也增加了选择成本。' },
  { id: 'copilot', name: 'GitHub Copilot', mark: 'CP', category: '编程', tier: 'trash', accent: '#24292f', summary: '基础补全可靠，但在智能体式开发里存在感变弱。' },
  { id: 'wenxin', name: '文心一言', mark: '文', category: '通用', tier: 'trash', accent: '#315efb', summary: '覆盖常见需求，当前个人使用频率和惊喜感偏低。' },
]

export const RANK_CATEGORIES = ['全部', ...new Set(RANK_ITEMS.map((item) => item.category))]
