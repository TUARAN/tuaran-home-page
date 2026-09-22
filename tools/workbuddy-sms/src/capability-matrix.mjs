export const BACKEND_MATRIX = Object.freeze([
  {
    id: 'codebuddy-cli',
    label: 'MCP + CLI / CodeBuddy Runs',
    agentMode: 'codebuddy',
    smsAsEntry: true,
    smsAsTool: false,
    sessionLocation: 'local-cli',
    entersDesktopChat: false,
    runsWithoutDesktop: false,
    permissionSurface: 'codebuddy-cli',
    notes: '短信作为入口调用本机 CodeBuddy /api/v1/runs；不能进入官方云端任务。',
  },
  {
    id: 'local-acp',
    label: 'MCP + 本机 ACP',
    agentMode: 'local-acp',
    smsAsEntry: true,
    smsAsTool: false,
    sessionLocation: 'workbuddy-desktop-session',
    entersDesktopChat: true,
    runsWithoutDesktop: false,
    permissionSurface: 'workbuddy-desktop',
    notes: '短信注入本机 WorkBuddy ACP 会话；电脑关闭后不可用。MCP 收件工具是另一条能力，不与 CLI 打进同一个连接器包。',
  },
  {
    id: 'official-acp',
    label: '官方硬件接入 ACP',
    agentMode: 'workbuddy-acp',
    smsAsEntry: true,
    smsAsTool: false,
    sessionLocation: 'workbuddy-cloud-task',
    entersDesktopChat: false,
    runsWithoutDesktop: true,
    permissionSurface: 'acp-bridge-ui',
    notes: '经本机桥接台走 Open API 云端任务 ACP；权限弹窗在桥接台，不自动批准。',
  },
]);

export function matrixForMode(mode) {
  return BACKEND_MATRIX.find((item) => item.agentMode === mode) || null;
}

export function describeCapabilityMatrix(currentMode, live = {}) {
  return BACKEND_MATRIX.map((item) => ({
    ...item,
    selected: item.agentMode === currentMode,
    live: live[item.id] || { available: null },
  }));
}
