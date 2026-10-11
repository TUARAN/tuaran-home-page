const plans = [...document.querySelectorAll('.plan')]
const pay = document.querySelector('#pay')
const phone = document.querySelector('#phone')
const modal = document.querySelector('#wechat-modal')
let selected = plans[0]

plans.forEach((plan) => {
  plan.addEventListener('click', () => {
    plans.forEach((item) => item.classList.remove('selected'))
    plan.classList.add('selected')
    selected = plan
    pay.querySelector('b').textContent = `¥${plan.dataset.price}`
  })
})

pay.addEventListener('click', () => {
  if (!phone.value.trim()) {
    phone.focus()
    phone.classList.add('invalid')
    return
  }
  phone.classList.remove('invalid')
  modal.hidden = false
})

document.querySelector('#wechat-open').addEventListener('click', () => { modal.hidden = false })
document.querySelector('#wechat-close').addEventListener('click', () => { modal.hidden = true })
modal.addEventListener('click', (event) => { if (event.target === modal) modal.hidden = true })
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') modal.hidden = true })
