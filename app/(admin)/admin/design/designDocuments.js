/** 审计类文档在「设计与体验」默认折叠；规范类文档保持展开。 */
export function isCollapsedDesignDocument(document) {
  return document?.kind === 'audit'
}

export function countAuditTasks(markdown) {
  const tasks = [...String(markdown || '').matchAll(/^- \[([ xX])\] [A-Z]+-\d+/gm)]
  const completed = tasks.filter((task) => task[1].toLowerCase() === 'x').length
  return { completed, total: tasks.length }
}
