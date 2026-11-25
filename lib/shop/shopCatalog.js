/**
 * 甄选小店商品目录。
 *
 * 商品收敛在这里，新增商品只需要追加一条记录：
 * - status: 'available'（已开放，可点击跳转）| 'coming'（即将上线，占位展示）
 * - href 为 null 时页面渲染为占位卡，不输出链接。
 * - highlights（可选）：卡片上突出展示的卖点。
 * - wechat（可选）：为 true 时卡片附「加微信」按钮，打开站内联系弹窗。
 * 本文件会被站点页面与测试同时导入，保持纯数据、无副作用。
 */

export const SHOP_PATH = '/shop'

export const SHOP_ITEMS = [
  {
    id: 'gptplus',
    title: 'ChatGPT Plus / Pro 代充',
    titleEn: 'ChatGPT Plus / Pro recharge',
    desc: '套餐选择、订单进度查询与售后支持，适合个人订阅与企业采购。',
    descEn: 'Plan selection, order tracking and after-sales support for individuals and teams.',
    href: 'https://gptplus.2aran.com/',
    status: 'available',
    tags: ['ChatGPT', 'Plus / Pro', '代充'],
  },
  {
    id: 'claude-recharge',
    title: 'Claude 代充',
    titleEn: 'Claude recharge',
    desc: '通过 Wokey 充值调用 Claude 全系模型，按 1:6.9 汇率代充；每次响应都带签名，可在本地离线校验来源。',
    descEn: 'Top up Claude models via Wokey at a 1:6.9 rate; every response is signed and can be verified offline.',
    href: 'https://wokey.ai/r/6D1SSKHS',
    status: 'available',
    tags: ['Claude', 'Wokey', '代充'],
    highlights: [
      { label: '离线可验证', labelEn: 'Offline verifiable' },
      { label: '代充 1:6.9 汇率', labelEn: '1:6.9 rate' },
      { label: '可加微信沟通', labelEn: 'WeChat support' },
    ],
    wechat: true,
  },
]

export function listShopItems() {
  return SHOP_ITEMS
}

export function findShopItem(id) {
  return SHOP_ITEMS.find((item) => item.id === id)
}
