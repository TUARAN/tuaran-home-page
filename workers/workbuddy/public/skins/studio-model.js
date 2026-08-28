export const priceCents = 1990
export const themes = Object.freeze({
  moyu: { id: '2aran-moyu', name: '摸鱼办事处', caption: '认真工作，合理发呆。', number: '01', mode: 'light', canvas: '#e9efde', surface: '#f4f7ec', text: '#233222', muted: '#54634e', accent: '#527242', border: '#bac8ad' },
  peach: { id: '2aran-peach', name: '班味清除器', caption: '今天的班味，淡一点。', number: '02', mode: 'light', canvas: '#fff0e8', surface: '#fff8f2', text: '#563d38', muted: '#805f53', accent: '#a45038', border: '#dcc2b6' },
  cosmos: { id: '2aran-cosmos', name: '宇宙旷工', caption: '工位有限，宇宙无限。', number: '03', mode: 'dark', canvas: '#221e37', surface: '#302940', text: '#f0eafa', muted: '#beb0ce', accent: '#c8acf5', border: '#5e516f' },
  friday: { id: '2aran-friday', name: '周五永动机', caption: '今天也有周五的好心情。', number: '04', mode: 'dark', canvas: '#28221e', surface: '#362d25', text: '#fff2df', muted: '#d1b99e', accent: '#ffb46d', border: '#72563e' },
})

export function buildDeliveryMessage(system, themeKey) {
  const allowed = ['Windows', 'macOS（Apple 芯片）', 'macOS（Intel 芯片）']
  const selected = Object.hasOwn(themes, themeKey) ? themes[themeKey] : themes.moyu
  return `WorkBuddy 换肤套装｜¥${(priceCents / 100).toFixed(2)}\n电脑系统：${allowed.includes(system) ? system : '请填写'}\n想先安装：${selected.name}（含四套主题）\nWorkBuddy 版本：【请填写】\n付款时间：【请填写】\n请在付款后附上付款截图，方便核账。`
}

export async function copyText(value, clipboard) {
  try {
    if (!clipboard?.writeText) return false
    await clipboard.writeText(value)
    return true
  } catch { return false }
}
