'use strict';
/**
 * persona.cjs — WorkBuddy 人格/记忆注入（供 5G ACP 会话使用）
 *
 * 渠道回复上下文：
 *   - 真实 ACP 渠道身份与格式说明，不伪装成当前桌面对话；
 *   - 人格档案段（IDENTITY/SOUL/USER/MEMORY.md）仅在文件有实质内容时注入，
 *     空模板占位自动跳过（用户完成 bootstrap 填充后即自动生效）。
 *
 * ACP 的 session/new 与 session/prompt 均无 system prompt 字段，
 * 因此人格以一条 text 内容块注入（前缀标记为非用户消息），仅会话内首次注入一次。
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const PERSONA_FILES = ['IDENTITY.md', 'SOUL.md', 'USER.md', 'MEMORY.md'];

// 与手机端话风相关的渠道约束（这里的目标是模型输出，不是用户可见内容）
const CHANNEL_CONSTRAINTS = `
## 5G 消息渠道约束（重要）
- 以上档案来自你主人的 WorkBuddy 人格文件，是你与主人之间的真实设定，务必遵守。
- 回复目标 300 字以内，口语化、直接、自然，一次讲清一件事。
- 禁止 markdown 语法：不要用 # 标题、**加粗**、- 列表、\`\`\`代码块、链接语法；需要分点用"1. 2. 3."或换行。
- 尽量少用表情符号；不要在结尾堆叠语气词。
- 如果用户的问题需要工具（查天气/查资料/执行命令等），先执行完再给结果，可简要说明做了什么。
- 回复围绕用户当前问题，未问不扩展；涉及违法、有害、敏感内容一律拒绝并简短说明。
`;

// 空模板占位特征句：命中则视为尚未填写的模板，跳过注入
const TEMPLATE_MARKERS = [
  '_Fill this in',
  "_You're not a chatbot",
  '_Learn about the person',
  'pick something you like',
  'Save this file at the workspace root',
];

// 去掉 Markdown YAML frontmatter（--- 块），只保留正文
function stripFrontmatter(raw) {
  const s = String(raw || '').replace(/^\uFEFF/, ''); // BOM
  if (!s.startsWith('---')) return s;
  const end = s.indexOf('\n---', 4);
  if (end === -1) return s;
  return s.slice(end + 4);
}

function isTemplate(body) {
  return TEMPLATE_MARKERS.some(m => body.includes(m));
}

// 真实运行环境说明，避免以改名冒充另一调用路径
function buildHead() {
  return '【5G 渠道说明】你通过本地 ACP 为 5G 消息渠道提供服务，使用独立渠道会话。\n' +
    '请如实说明自己的运行环境；不要声称正在使用桌面当前对话，也不要用名称替换掩盖底层身份。\n';
}

// 实时拼装人格注入文本；禁用或全部为空时返回 null（由调用方决定是否注入）
function buildPersona(env = process.env, home = os.homedir()) {
  if (env.PERSONA_ENABLED !== '1') return null;

  // 1) 显式文件优先（完全自定义场景）
  if (env.PERSONA_PROMPT_FILE) {
    try { return fs.readFileSync(env.PERSONA_PROMPT_FILE, 'utf8'); }
    catch { /* 读取失败则回退动态拼装 */ }
  }

  // 2) 动态拼装 PERSONA_DIR 下的人格档案（缺失/空模板自动跳过）
  const dir = env.PERSONA_DIR || path.join(home, '.workbuddy');
  const sections = [];
  for (const f of PERSONA_FILES) {
    const p = path.join(dir, f);
    try {
      const body = stripFrontmatter(fs.readFileSync(p, 'utf8')).trim();
      if (body && !isTemplate(body)) sections.push('==== ' + f + ' ====\n' + body);
    } catch { /* 文件不存在等，跳过该段 */ }
  }

  const persona = sections.join('\n\n');
  if (persona) {
    return buildHead() + '以下是你的主人身份与人格档案（每次会话实时生成，务必遵循其中设定）：\n\n' + persona + '\n\n' + CHANNEL_CONSTRAINTS;
  }
  // 档案为空（尚未填充）时，仍注入基础身份 + 渠道约束
  return buildHead() + CHANNEL_CONSTRAINTS;
}

module.exports = { buildPersona, CHANNEL_CONSTRAINTS, PERSONA_FILES, stripFrontmatter };
