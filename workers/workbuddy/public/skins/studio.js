import { themes, buildDeliveryMessage, copyText } from './studio-model.js'

const preview = document.querySelector('#preview')
const choices = [...document.querySelectorAll('[data-theme-choice]')]
let selected = 'moyu'
for (const button of choices) {
  button.addEventListener('click', () => {
    const id = button.dataset.themeChoice
    if (!Object.hasOwn(themes, id)) return
    const theme = themes[id]
    selected = id
    preview.dataset.theme = id
    document.querySelector('#preview-title').textContent = theme.name
    document.querySelector('#preview-caption').textContent = theme.caption
    document.querySelector('.work-bottom span').textContent = theme.number + ' / 04'
    for (const choice of choices) choice.setAttribute('aria-pressed', String(choice.dataset.themeChoice === id))
    if (button.classList.contains('theme-card')) preview.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  })
}

async function copy(value, successMessage) {
  const status = document.querySelector('#copy-status')
  const fallback = document.querySelector('#message-fallback')
  const copied = await copyText(value, navigator.clipboard)
  fallback.hidden = copied
  status.textContent = copied ? successMessage : '浏览器未允许自动复制，请在下方选中文本手动复制。'
  if (!copied) {
    fallback.value = value
    fallback.focus()
    fallback.select()
  }
}
document.querySelector('#copy-wechat').addEventListener('click', () => copy('atar24', '微信号已复制，请到微信添加 atar24。'))
document.querySelector('#copy-message').addEventListener('click', () => copy(
  buildDeliveryMessage(document.querySelector('#system').value, selected),
  '领取信息已复制。付款后请在微信粘贴，并附截图、付款时间和版本。',
))
