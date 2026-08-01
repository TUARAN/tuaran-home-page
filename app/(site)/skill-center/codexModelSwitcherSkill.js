export const CODEX_MODEL_SWITCHER_SKILL = {
  id: 'install-codex-model-switcher',
  name: 'install-codex-model-switcher',
  title: 'Codex 模型切换器安装 Skill',
  category: '研发与交付',
  status: '已上架',
  desc: '在 macOS 上检查、安装、配置、验证或卸载 Codex 模型切换器；保留已有配置，不在安装包或聊天中传递 API Key。',
  trigger: '用户提供本 Skill、2aran 下载包，或要求安装、配置、修复 Codex 模型切换器时使用。',
  inputs: ['macOS 13+', '已启动过一次的 Codex Desktop', '可选：用户自己的 DeepSeek API Key'],
  outputs: ['安装到 ~/Applications 的通用 macOS App', '经过备份和本地解析验证的 Codex 配置', '明确的首开与回滚说明'],
  acceptance: '预检、安装和 Codex 本地配置解析均通过；不输出或打包 Key；说明第三方端点仍需真实请求验证。',
  content: {
    type: 'rules',
    label: '安装与安全边界',
    pill: '4 条',
    items: [
      { title: '先预检', body: '确认 macOS 版本、Codex Desktop、config.toml、App 资源和模型目录齐全，再执行安装。' },
      { title: '配置可恢复', body: '只管理切换器自己的应用、DeepSeek Provider 表和模型目录；修改前生成带时间戳的备份。' },
      { title: 'Key 不进聊天', body: 'API Key 由用户在本机终端隐藏输入，不作为参数、不写入安装包，也不复制维护者的 ~/.codex。' },
      { title: '验证分两层', body: '本地解析通过只说明配置合法；第三方端点与账户兼容性还需要用户批准的一次真实模型请求。' },
    ],
  },
  codex: {
    installPath: '~/.codex/skills/install-codex-model-switcher',
    files: ['SKILL.md', 'agents/openai.yaml', 'scripts/', 'references/', 'assets/'],
    packageUrl: '/api/resources/deliver?resourceKey=resource%3Acodex-model-switcher&file=skill-zip',
    packageLabel: '下载完整 Skill（含 App）',
    skillMd: `---
name: install-codex-model-switcher
description: Install, configure, repair, inspect, or uninstall Tuaran's Codex Model Switcher on macOS. Use when a user provides this Skill or the 2aran.com download and asks Codex to set up a local window/menu-bar switcher between their OpenAI Codex provider and a DeepSeek-compatible Responses API provider without bundling credentials.
---

# Install Codex Model Switcher

Use the complete downloadable package for scripts, references, the universal app, and the sanitized model catalog. Run the read-only preflight first, preserve unrelated Codex settings, back up every changed config file, and never ask the user to paste an API key into chat. Read references/compatibility.md before configuring DeepSeek. Do not remove macOS quarantine automatically. Verify local config parsing, and explain that a real user-approved request is still required to prove third-party endpoint compatibility.`,
    openaiYaml: `interface:
  display_name: "Codex 模型切换器安装器"
  short_description: "在 macOS 安装并配置 Codex 模型切换器"
  default_prompt: "Use $install-codex-model-switcher to install and configure the Codex model switcher on this Mac."`,
  },
}
