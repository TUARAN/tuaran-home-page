export function countAuditTasks(markdown) {
  const tasks = [...String(markdown || '').matchAll(/^- \[([ xX])\] [A-Z]+-\d+/gm)]
  const completed = tasks.filter((task) => task[1].toLowerCase() === 'x').length
  return { completed, total: tasks.length }
}
